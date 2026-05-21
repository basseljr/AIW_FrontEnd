import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { CategoriesService } from '../../core/services/categories.service';
import { Category, CategoryRequest } from '../../core/models/catalog.model';

interface CategoryFormState {
  id: string | null;
  nameEn: string;
  nameAr: string;
  parentId: string;
  sortOrder: number;
  isPublished: boolean;
}

function emptyForm(): CategoryFormState {
  return { id: null, nameEn: '', nameAr: '', parentId: '', sortOrder: 0, isPublished: true };
}

@Component({
  selector: 'db-categories',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-cats">
      <!-- Header -->
      <header class="db-cats__header">
        <h1 class="db-cats__title">{{ 'categories_page.title' | translate }}</h1>
        <button class="db-cats__btn-primary" type="button" (click)="openAdd()">
          + {{ 'categories_page.add_category' | translate }}
        </button>
      </header>

      <!-- Error -->
      @if (error() && !loading()) {
        <div class="db-cats__error" role="alert">
          <span>{{ 'categories_page.error' | translate }}</span>
          <button class="db-cats__retry" type="button" (click)="load()">
            {{ 'categories_page.retry' | translate }}
          </button>
        </div>
      }

      <!-- Table -->
      <div class="db-cats__table-wrap">
        <table class="db-cats__table" role="table">
          <thead class="db-cats__thead">
            <tr>
              <th class="db-cats__th" scope="col">{{ 'categories_page.col_name' | translate }}</th>
              <th class="db-cats__th" scope="col">{{ 'categories_page.col_parent' | translate }}</th>
              <th class="db-cats__th db-cats__th--num" scope="col">{{ 'categories_page.col_sort' | translate }}</th>
              <th class="db-cats__th" scope="col">{{ 'categories_page.col_published' | translate }}</th>
              <th class="db-cats__th db-cats__th--actions" scope="col">
                <span class="db-cats__sr">{{ 'categories_page.col_actions' | translate }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="db-cats__tbody">
            @if (loading()) {
              @for (_ of [1,2,3]; track $index) {
                <tr class="db-cats__row" aria-hidden="true">
                  <td class="db-cats__td"><span class="db-cats__sk db-cats__sk--name"></span></td>
                  <td class="db-cats__td"><span class="db-cats__sk db-cats__sk--sm"></span></td>
                  <td class="db-cats__td db-cats__td--num"><span class="db-cats__sk db-cats__sk--xs"></span></td>
                  <td class="db-cats__td"><span class="db-cats__sk db-cats__sk--badge"></span></td>
                  <td class="db-cats__td db-cats__td--actions"></td>
                </tr>
              }
            }
            @if (!loading()) {
              @for (cat of items(); track cat.id) {
                <tr class="db-cats__row">
                  <td class="db-cats__td">
                    <span class="db-cats__name">{{ cat.nameEn }}</span>
                    @if (cat.nameAr) {
                      <span class="db-cats__name-ar">{{ cat.nameAr }}</span>
                    }
                  </td>
                  <td class="db-cats__td">
                    <span class="db-cats__muted">{{ parentName(cat.parentId) }}</span>
                  </td>
                  <td class="db-cats__td db-cats__td--num">
                    <input
                      class="db-cats__sort-input"
                      type="number"
                      [ngModel]="cat.sortOrder"
                      (ngModelChange)="setSortOrder(cat, $event)"
                      min="0"
                    />
                  </td>
                  <td class="db-cats__td">
                    <span
                      class="db-cats__badge"
                      [attr.data-pub]="cat.isPublished ? 'yes' : 'no'"
                    >
                      {{ (cat.isPublished ? 'categories_page.published' : 'common.no') | translate }}
                    </span>
                  </td>
                  <td class="db-cats__td db-cats__td--actions">
                    <div class="db-cats__actions">
                      <button class="db-cats__btn-ghost" type="button" (click)="openEdit(cat)">
                        {{ 'common.edit' | translate }}
                      </button>
                      <button class="db-cats__btn-danger" type="button" (click)="confirmDelete(cat)">
                        {{ 'common.delete' | translate }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (items().length === 0 && !error()) {
                <tr>
                  <td class="db-cats__empty" colspan="5">
                    {{ 'categories_page.no_categories' | translate }}
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Save order button -->
      @if (orderDirty()) {
        <div class="db-cats__order-bar">
          <button class="db-cats__btn-primary" type="button" (click)="saveOrder()" [disabled]="saving()">
            @if (saving()) { <span class="db-cats__spinner" aria-hidden="true"></span> }
            {{ 'categories_page.save_order' | translate }}
          </button>
        </div>
      }

      <!-- Dialog overlay -->
      @if (showForm()) {
        <div class="db-cats__overlay" role="dialog" [attr.aria-modal]="true" (click)="closeForm()">
          <div class="db-cats__dialog" (click)="$event.stopPropagation()">
            <header class="db-cats__dialog-header">
              <h2 class="db-cats__dialog-title">
                {{ (form().id ? 'categories_page.form_title_edit' : 'categories_page.form_title_add') | translate }}
              </h2>
              <button class="db-cats__close" type="button" (click)="closeForm()" [attr.aria-label]="'common.close' | translate">✕</button>
            </header>
            <div class="db-cats__dialog-body">
              <label class="db-cats__label">
                {{ 'categories_page.name_en' | translate }}
                <input class="db-cats__input" type="text" [(ngModel)]="form().nameEn" />
              </label>
              <label class="db-cats__label">
                {{ 'categories_page.name_ar' | translate }}
                <input class="db-cats__input" type="text" [(ngModel)]="form().nameAr" dir="rtl" />
              </label>
              <label class="db-cats__label">
                {{ 'categories_page.parent' | translate }}
                <select class="db-cats__input db-cats__select" [(ngModel)]="form().parentId">
                  <option value="">{{ 'categories_page.no_parent' | translate }}</option>
                  @for (cat of items(); track cat.id) {
                    @if (cat.id !== form().id) {
                      <option [value]="cat.id">{{ cat.nameEn }}</option>
                    }
                  }
                </select>
              </label>
              <label class="db-cats__label">
                {{ 'categories_page.sort_order' | translate }}
                <input class="db-cats__input" type="number" [(ngModel)]="form().sortOrder" min="0" />
              </label>
              <label class="db-cats__toggle-label">
                <input class="db-cats__toggle-input" type="checkbox" [(ngModel)]="form().isPublished" />
                <span class="db-cats__toggle-track">
                  <span class="db-cats__toggle-thumb"></span>
                </span>
                {{ 'categories_page.published' | translate }}
              </label>
            </div>
            <footer class="db-cats__dialog-footer">
              <button class="db-cats__btn-secondary" type="button" (click)="closeForm()">
                {{ 'common.cancel' | translate }}
              </button>
              <button class="db-cats__btn-primary" type="button" (click)="saveForm()" [disabled]="saving()">
                @if (saving()) { <span class="db-cats__spinner" aria-hidden="true"></span> }
                {{ 'common.save' | translate }}
              </button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .db-cats {
      padding-block: 2rem;
      padding-inline: 2rem;
      container-type: inline-size;
      container-name: cats-page;
    }

    /* Header */
    .db-cats__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-block-end: 1.5rem;
      flex-wrap: wrap;
    }

    .db-cats__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      letter-spacing: -0.025em;
    }

    /* Buttons */
    .db-cats__btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding-block: 0.5rem;
      padding-inline: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--accent-text);
      background: var(--accent);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
      white-space: nowrap;
    }

    .db-cats__btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
    .db-cats__btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

    .db-cats__btn-secondary {
      display: inline-flex;
      align-items: center;
      padding-block: 0.5rem;
      padding-inline: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-cats__btn-secondary:hover { background: var(--surface-alt); }

    .db-cats__btn-ghost {
      padding-block: 0.25rem;
      padding-inline: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--accent);
      background: color-mix(in srgb, var(--accent) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-cats__btn-ghost:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); }

    .db-cats__btn-danger {
      padding-block: 0.25rem;
      padding-inline: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--error);
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-cats__btn-danger:hover { background: color-mix(in srgb, var(--error) 14%, transparent); }

    .db-cats__retry {
      padding-block: 0.3125rem;
      padding-inline: 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      background: var(--accent);
      color: var(--accent-text);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    /* Error */
    .db-cats__error {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-block: 1rem;
      padding-inline: 1rem;
      margin-block-end: 1rem;
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-card);
      color: var(--error);
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Table */
    .db-cats__table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .db-cats__table {
      inline-size: 100%;
      min-inline-size: 560px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-cats__thead {
      background: var(--surface-alt);
      border-block-end: 1px solid var(--border);
    }

    .db-cats__th {
      padding-block: 0.6875rem;
      padding-inline: 0.875rem 0.5rem;
      text-align: start;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .db-cats__th--num { text-align: end; }

    .db-cats__th--actions { inline-size: 120px; }

    .db-cats__row {
      border-block-end: 1px solid var(--border);
      transition: background-color var(--motion-fast) ease;
    }

    .db-cats__row:last-child { border-block-end: none; }
    .db-cats__row:hover { background: var(--surface-alt); }

    .db-cats__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem 0.5rem;
      vertical-align: middle;
      color: var(--text);
    }

    .db-cats__td--num { text-align: end; }

    .db-cats__td--actions {
      text-align: end;
      padding-inline-end: 0.875rem;
    }

    .db-cats__empty {
      text-align: center;
      padding-block: 3rem;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .db-cats__name {
      font-weight: 600;
      color: var(--text);
      display: block;
    }

    .db-cats__name-ar {
      font-size: 0.8125rem;
      color: var(--text-muted);
      display: block;
      direction: rtl;
    }

    .db-cats__muted { color: var(--text-muted); font-size: 0.875rem; }

    .db-cats__actions {
      display: flex;
      gap: 0.375rem;
      justify-content: flex-end;
    }

    .db-cats__sort-input {
      inline-size: 64px;
      padding-block: 0.3125rem;
      padding-inline: 0.5rem;
      font-size: 0.8125rem;
      font-family: inherit;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      text-align: end;
    }

    .db-cats__sort-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-cats__badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .db-cats__badge[data-pub='yes'] {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
      outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
    }

    .db-cats__badge[data-pub='no'] {
      background: color-mix(in srgb, var(--text-muted) 10%, transparent);
      color: var(--text-muted);
      outline: 1px solid color-mix(in srgb, var(--text-muted) 25%, transparent);
    }

    /* Save order bar */
    .db-cats__order-bar {
      display: flex;
      justify-content: flex-end;
      margin-block-start: 1rem;
    }

    /* Skeleton */
    .db-cats__sk {
      display: inline-block;
      block-size: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-shimmer 1.4s infinite;
    }

    .db-cats__sk--name   { inline-size: 120px; }
    .db-cats__sk--sm     { inline-size: 80px; }
    .db-cats__sk--xs     { inline-size: 32px; }
    .db-cats__sk--badge  { inline-size: 60px; block-size: 20px; border-radius: 999px; }

    @keyframes db-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Spinner */
    .db-cats__spinner {
      display: inline-block;
      inline-size: 14px;
      block-size: 14px;
      border: 2px solid color-mix(in srgb, var(--accent-text) 40%, transparent);
      border-block-start-color: var(--accent-text);
      border-radius: 50%;
      animation: db-spin 0.7s linear infinite;
    }

    @keyframes db-spin { to { transform: rotate(360deg); } }

    /* SR only */
    .db-cats__sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
    }

    /* Overlay / Dialog */
    .db-cats__overlay {
      position: fixed;
      inset: 0;
      background: color-mix(in srgb, #000 55%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding-inline: 1rem;
    }

    .db-cats__dialog {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      inline-size: 100%;
      max-inline-size: 480px;
      box-shadow: 0 24px 48px color-mix(in srgb, #000 30%, transparent);
    }

    .db-cats__dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-block: 1.25rem;
      padding-inline: 1.5rem;
      border-block-end: 1px solid var(--border);
    }

    .db-cats__dialog-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-cats__close {
      padding: 0.25rem 0.5rem;
      font-size: 1rem;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-cats__close:hover { background: var(--surface-alt); color: var(--text); }

    .db-cats__dialog-body {
      padding-block: 1.25rem;
      padding-inline: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .db-cats__dialog-footer {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      padding-block: 1rem 1.25rem;
      padding-inline: 1.5rem;
      border-block-start: 1px solid var(--border);
    }

    .db-cats__label {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .db-cats__input {
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.5rem;
      padding-inline: 0.75rem;
      outline: none;
      transition: border-color var(--motion-base) ease, box-shadow var(--motion-base) ease;
    }

    .db-cats__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-cats__select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 0.625rem) 50%;
      padding-inline-end: 2rem;
      cursor: pointer;
    }

    /* Toggle */
    .db-cats__toggle-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
    }

    .db-cats__toggle-input { display: none; }

    .db-cats__toggle-track {
      display: inline-block;
      inline-size: 36px;
      block-size: 20px;
      background: var(--border);
      border-radius: 999px;
      position: relative;
      transition: background-color var(--motion-base) ease;
      flex-shrink: 0;
    }

    .db-cats__toggle-input:checked ~ .db-cats__toggle-track { background: var(--accent); }

    .db-cats__toggle-thumb {
      position: absolute;
      inset-block-start: 2px;
      inset-inline-start: 2px;
      inline-size: 16px;
      block-size: 16px;
      background: #fff;
      border-radius: 50%;
      transition: inset-inline-start var(--motion-base) ease;
    }

    .db-cats__toggle-input:checked ~ .db-cats__toggle-track .db-cats__toggle-thumb {
      inset-inline-start: 18px;
    }

    /* Responsive */
    @container cats-page (max-width: 768px) {
      .db-cats { padding-inline: 1rem; padding-block: 1.25rem; }
      .db-cats__title { font-size: 1.125rem; }
    }
  `],
})
export class CategoriesComponent implements OnInit {
  private readonly svc = inject(CategoriesService);

  readonly items = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly orderDirty = signal(false);

  readonly form = signal<CategoryFormState>(emptyForm());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.svc.getAll().subscribe({
      next: (cats) => { this.items.set(cats); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  openAdd(): void {
    this.form.set(emptyForm());
    this.showForm.set(true);
  }

  openEdit(cat: Category): void {
    this.form.set({
      id: cat.id,
      nameEn: cat.nameEn,
      nameAr: cat.nameAr,
      parentId: cat.parentId ?? '',
      sortOrder: cat.sortOrder,
      isPublished: cat.isPublished,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  saveForm(): void {
    const f = this.form();
    if (!f.nameEn.trim()) return;

    const body: CategoryRequest = {
      parentId: f.parentId || null,
      nameEn: f.nameEn,
      nameAr: f.nameAr,
      sortOrder: f.sortOrder,
      isPublished: f.isPublished,
    };

    this.saving.set(true);
    const obs = f.id
      ? this.svc.update(f.id, body)
      : this.svc.create(body);

    obs.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.load(); },
      error: () => { this.saving.set(false); },
    });
  }

  confirmDelete(cat: Category): void {
    if (!confirm('Delete this category?')) return;
    this.svc.delete(cat.id).subscribe({
      next: () => this.load(),
    });
  }

  setSortOrder(cat: Category, value: number): void {
    this.items.update((list) =>
      list.map((c) => (c.id === cat.id ? { ...c, sortOrder: value } : c)),
    );
    this.orderDirty.set(true);
  }

  saveOrder(): void {
    const items = this.items().map((c) => ({ id: c.id, sortOrder: c.sortOrder }));
    this.saving.set(true);
    this.svc.reorder(items).subscribe({
      next: () => { this.saving.set(false); this.orderDirty.set(false); },
      error: () => { this.saving.set(false); },
    });
  }

  parentName(parentId: string | null): string {
    if (!parentId) return '—';
    return this.items().find((c) => c.id === parentId)?.nameEn ?? parentId;
  }
}
