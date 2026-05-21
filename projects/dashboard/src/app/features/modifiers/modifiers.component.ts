import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { ModifiersService } from '../../core/services/modifiers.service';
import { ModifierGroup, ModifierGroupRequest, ModifierOption } from '../../core/models/catalog.model';

interface GroupForm {
  id: string | null;
  nameEn: string;
  nameAr: string;
  selectionType: 'single' | 'multiple';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  options: ModifierOption[];
}

function emptyForm(): GroupForm {
  return {
    id: null, nameEn: '', nameAr: '',
    selectionType: 'single', isRequired: false,
    minSelections: 0, maxSelections: 1, sortOrder: 0,
    options: [],
  };
}

@Component({
  selector: 'db-modifiers',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-mods">
      <!-- Header -->
      <header class="db-mods__header">
        <h1 class="db-mods__title">{{ 'modifiers.title' | translate }}</h1>
        <button class="db-mods__btn-primary" type="button" (click)="openAdd()">
          + {{ 'modifiers.add_group' | translate }}
        </button>
      </header>

      <!-- Table -->
      <div class="db-mods__table-wrap">
        <table class="db-mods__table" role="table">
          <thead class="db-mods__thead">
            <tr>
              <th class="db-mods__th" scope="col">{{ 'modifiers.col_name' | translate }}</th>
              <th class="db-mods__th" scope="col">{{ 'modifiers.col_type' | translate }}</th>
              <th class="db-mods__th" scope="col">{{ 'modifiers.col_required' | translate }}</th>
              <th class="db-mods__th db-mods__th--num" scope="col">{{ 'modifiers.col_options' | translate }}</th>
              <th class="db-mods__th db-mods__th--actions" scope="col">
                <span class="db-mods__sr">{{ 'modifiers.col_actions' | translate }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="db-mods__tbody">
            @if (loading()) {
              @for (_ of [1,2,3]; track $index) {
                <tr class="db-mods__row" aria-hidden="true">
                  <td class="db-mods__td"><span class="db-mods__sk db-mods__sk--name"></span></td>
                  <td class="db-mods__td"><span class="db-mods__sk db-mods__sk--badge"></span></td>
                  <td class="db-mods__td"><span class="db-mods__sk db-mods__sk--badge"></span></td>
                  <td class="db-mods__td db-mods__td--num"><span class="db-mods__sk db-mods__sk--xs"></span></td>
                  <td class="db-mods__td db-mods__td--actions"></td>
                </tr>
              }
            }
            @if (!loading()) {
              @for (grp of items(); track grp.id) {
                <tr class="db-mods__row">
                  <td class="db-mods__td">
                    <span class="db-mods__name">{{ grp.nameEn }}</span>
                    @if (grp.nameAr) {
                      <span class="db-mods__name-ar">{{ grp.nameAr }}</span>
                    }
                  </td>
                  <td class="db-mods__td">
                    <span class="db-mods__badge" [attr.data-type]="grp.selectionType">
                      {{ (grp.selectionType === 'single' ? 'modifiers.selection_single' : 'modifiers.selection_multiple') | translate }}
                    </span>
                  </td>
                  <td class="db-mods__td">
                    <span class="db-mods__badge" [attr.data-req]="grp.isRequired ? 'yes' : 'no'">
                      {{ (grp.isRequired ? 'modifiers.yes' : 'modifiers.no') | translate }}
                    </span>
                  </td>
                  <td class="db-mods__td db-mods__td--num">
                    <span class="db-mods__count">{{ grp.options.length }}</span>
                  </td>
                  <td class="db-mods__td db-mods__td--actions">
                    <div class="db-mods__actions">
                      <button class="db-mods__btn-ghost" type="button" (click)="openEdit(grp)">{{ 'common.edit' | translate }}</button>
                      <button class="db-mods__btn-danger" type="button" (click)="confirmDelete(grp)">{{ 'common.delete' | translate }}</button>
                    </div>
                  </td>
                </tr>
              }
              @if (items().length === 0 && !error()) {
                <tr>
                  <td class="db-mods__empty" colspan="5">{{ 'modifiers.no_groups' | translate }}</td>
                </tr>
              }
            }
          </tbody>
        </table>

        @if (error() && !loading()) {
          <div class="db-mods__error" role="alert">
            <span>{{ 'errors.generic' | translate }}</span>
            <button class="db-mods__retry" type="button" (click)="load()">{{ 'common.retry' | translate }}</button>
          </div>
        }
      </div>

      <!-- Form Dialog -->
      @if (showForm()) {
        <div class="db-mods__overlay" role="dialog" [attr.aria-modal]="true" (click)="closeForm()">
          <div class="db-mods__dialog" (click)="$event.stopPropagation()">
            <header class="db-mods__dialog-header">
              <h2 class="db-mods__dialog-title">
                {{ (form().id ? 'modifiers.group_form_title_edit' : 'modifiers.group_form_title_add') | translate }}
              </h2>
              <button class="db-mods__close" type="button" (click)="closeForm()">✕</button>
            </header>
            <div class="db-mods__dialog-body">
              <label class="db-mods__label">
                {{ 'modifiers.group_name_en' | translate }}
                <input class="db-mods__input" type="text" [(ngModel)]="form().nameEn" />
              </label>
              <label class="db-mods__label">
                {{ 'modifiers.group_name_ar' | translate }}
                <input class="db-mods__input" type="text" [(ngModel)]="form().nameAr" dir="rtl" />
              </label>
              <label class="db-mods__label">
                {{ 'modifiers.selection_type' | translate }}
                <select class="db-mods__input db-mods__select" [(ngModel)]="form().selectionType">
                  <option value="single">{{ 'modifiers.selection_single' | translate }}</option>
                  <option value="multiple">{{ 'modifiers.selection_multiple' | translate }}</option>
                </select>
              </label>
              <div class="db-mods__row-2">
                <label class="db-mods__label">
                  {{ 'modifiers.min_selections' | translate }}
                  <input class="db-mods__input" type="number" [(ngModel)]="form().minSelections" min="0" />
                </label>
                <label class="db-mods__label">
                  {{ 'modifiers.max_selections' | translate }}
                  <input class="db-mods__input" type="number" [(ngModel)]="form().maxSelections" min="0" />
                </label>
              </div>
              <label class="db-mods__toggle-label">
                <input class="db-mods__toggle-input" type="checkbox" [(ngModel)]="form().isRequired" />
                <span class="db-mods__toggle-track"><span class="db-mods__toggle-thumb"></span></span>
                {{ 'modifiers.is_required' | translate }}
              </label>

              <!-- Options -->
              <div class="db-mods__options-section">
                <div class="db-mods__options-header">
                  <span class="db-mods__section-title">{{ 'modifiers.options' | translate }}</span>
                  <button class="db-mods__btn-secondary" type="button" (click)="addOption()">
                    + {{ 'modifiers.add_option' | translate }}
                  </button>
                </div>
                @for (opt of form().options; track $index; let i = $index) {
                  <div class="db-mods__option-row">
                    <input class="db-mods__input" type="text" [placeholder]="'modifiers.option_name_en' | translate" [(ngModel)]="opt.nameEn" />
                    <input class="db-mods__input" type="text" [placeholder]="'modifiers.option_name_ar' | translate" [(ngModel)]="opt.nameAr" dir="rtl" />
                    <input class="db-mods__input db-mods__input--price" type="number" [placeholder]="'modifiers.option_price' | translate" [(ngModel)]="opt.price" min="0" step="0.001" />
                    <button class="db-mods__btn-danger db-mods__opt-del" type="button" (click)="removeOption(i)">✕</button>
                  </div>
                }
                @if (form().options.length === 0) {
                  <p class="db-mods__hint">{{ 'modifiers.add_option' | translate }}</p>
                }
              </div>
            </div>
            @if (formError()) {
              <div class="db-mods__form-error" role="alert">{{ formError() }}</div>
            }
            <footer class="db-mods__dialog-footer">
              <button class="db-mods__btn-secondary" type="button" (click)="closeForm()">{{ 'common.cancel' | translate }}</button>
              <button class="db-mods__btn-primary" type="button" (click)="saveForm()" [disabled]="saving()">
                @if (saving()) { <span class="db-mods__spinner" aria-hidden="true"></span> }
                {{ 'common.save' | translate }}
              </button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .db-mods {
      padding-block: 2rem;
      padding-inline: 2rem;
      container-type: inline-size;
      container-name: mods-page;
    }

    .db-mods__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-block-end: 1.5rem;
      flex-wrap: wrap;
    }

    .db-mods__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      letter-spacing: -0.025em;
    }

    .db-mods__btn-primary {
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
    }

    .db-mods__btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
    .db-mods__btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

    .db-mods__btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding-block: 0.4375rem;
      padding-inline: 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-mods__btn-secondary:hover { background: var(--surface-alt); }

    .db-mods__btn-ghost {
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
    }

    .db-mods__btn-ghost:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); }

    .db-mods__btn-danger {
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
    }

    .db-mods__btn-danger:hover { background: color-mix(in srgb, var(--error) 14%, transparent); }

    .db-mods__retry {
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

    .db-mods__table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow-x: auto;
    }

    .db-mods__table {
      inline-size: 100%;
      min-inline-size: 520px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-mods__thead {
      background: var(--surface-alt);
      border-block-end: 1px solid var(--border);
    }

    .db-mods__th {
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

    .db-mods__th--num { text-align: end; }
    .db-mods__th--actions { inline-size: 120px; }

    .db-mods__row {
      border-block-end: 1px solid var(--border);
      transition: background-color var(--motion-fast) ease;
    }

    .db-mods__row:last-child { border-block-end: none; }
    .db-mods__row:hover { background: var(--surface-alt); }

    .db-mods__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem 0.5rem;
      vertical-align: middle;
      color: var(--text);
    }

    .db-mods__td--num { text-align: end; }

    .db-mods__td--actions {
      text-align: end;
      padding-inline-end: 0.875rem;
    }

    .db-mods__empty {
      text-align: center;
      padding-block: 3rem;
      color: var(--text-muted);
    }

    .db-mods__name { font-weight: 600; display: block; }

    .db-mods__name-ar {
      font-size: 0.8125rem;
      color: var(--text-muted);
      display: block;
      direction: rtl;
    }

    .db-mods__count {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .db-mods__badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .db-mods__badge[data-type='single'] {
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      color: var(--accent);
      outline: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    }

    .db-mods__badge[data-type='multiple'] {
      background: color-mix(in srgb, var(--info) 10%, transparent);
      color: var(--info);
      outline: 1px solid color-mix(in srgb, var(--info) 25%, transparent);
    }

    .db-mods__badge[data-req='yes'] {
      background: color-mix(in srgb, var(--warning) 12%, transparent);
      color: var(--warning);
      outline: 1px solid color-mix(in srgb, var(--warning) 25%, transparent);
    }

    .db-mods__badge[data-req='no'] {
      background: color-mix(in srgb, var(--text-muted) 8%, transparent);
      color: var(--text-muted);
      outline: 1px solid color-mix(in srgb, var(--text-muted) 20%, transparent);
    }

    .db-mods__actions { display: flex; gap: 0.375rem; justify-content: flex-end; }

    .db-mods__error {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      color: var(--error);
      font-size: 0.875rem;
    }

    .db-mods__sk {
      display: inline-block;
      block-size: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-shimmer 1.4s infinite;
    }

    .db-mods__sk--name  { inline-size: 120px; }
    .db-mods__sk--badge { inline-size: 80px; block-size: 20px; border-radius: 999px; }
    .db-mods__sk--xs    { inline-size: 24px; }

    @keyframes db-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .db-mods__sr { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }

    .db-mods__spinner {
      display: inline-block;
      inline-size: 14px;
      block-size: 14px;
      border: 2px solid color-mix(in srgb, var(--accent-text) 40%, transparent);
      border-block-start-color: var(--accent-text);
      border-radius: 50%;
      animation: db-spin 0.7s linear infinite;
    }

    @keyframes db-spin { to { transform: rotate(360deg); } }

    /* Dialog */
    .db-mods__overlay {
      position: fixed;
      inset: 0;
      background: color-mix(in srgb, #000 55%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding-inline: 1rem;
    }

    .db-mods__dialog {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      inline-size: 100%;
      max-inline-size: 600px;
      max-block-size: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 48px color-mix(in srgb, #000 30%, transparent);
    }

    .db-mods__dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-block: 1.25rem;
      padding-inline: 1.5rem;
      border-block-end: 1px solid var(--border);
      flex-shrink: 0;
    }

    .db-mods__dialog-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-mods__close {
      padding: 0.25rem 0.5rem;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-mods__close:hover { background: var(--surface-alt); color: var(--text); }

    .db-mods__dialog-body {
      flex: 1;
      overflow-y: auto;
      padding-block: 1.25rem;
      padding-inline: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .db-mods__form-error {
      margin-inline: 1.25rem;
      margin-block-end: 0.75rem;
      padding-block: 0.625rem;
      padding-inline: 0.875rem;
      background: color-mix(in srgb, var(--error) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 30%, transparent);
      border-radius: var(--radius-control);
      font-size: 0.8125rem;
      color: var(--error);
      line-height: 1.5;
    }

    .db-mods__dialog-footer {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      padding-block: 1rem 1.25rem;
      padding-inline: 1.5rem;
      border-block-start: 1px solid var(--border);
      flex-shrink: 0;
    }

    .db-mods__label {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .db-mods__input {
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

    .db-mods__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-mods__select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 0.625rem) 50%;
      padding-inline-end: 2rem;
      cursor: pointer;
    }

    .db-mods__row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    .db-mods__toggle-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
    }

    .db-mods__toggle-input { display: none; }

    .db-mods__toggle-track {
      inline-size: 36px;
      block-size: 20px;
      background: var(--border);
      border-radius: 999px;
      position: relative;
      transition: background-color var(--motion-base) ease;
      flex-shrink: 0;
    }

    .db-mods__toggle-input:checked ~ .db-mods__toggle-track { background: var(--accent); }

    .db-mods__toggle-thumb {
      position: absolute;
      inset-block-start: 2px;
      inset-inline-start: 2px;
      inline-size: 16px;
      block-size: 16px;
      background: #fff;
      border-radius: 50%;
      transition: inset-inline-start var(--motion-base) ease;
    }

    .db-mods__toggle-input:checked ~ .db-mods__toggle-track .db-mods__toggle-thumb {
      inset-inline-start: 18px;
    }

    /* Options section */
    .db-mods__options-section {
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .db-mods__options-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .db-mods__section-title { font-size: 0.875rem; font-weight: 700; color: var(--text); }

    .db-mods__option-row {
      display: grid;
      grid-template-columns: 1fr 1fr 0.6fr 28px;
      gap: 0.375rem;
      align-items: center;
    }

    .db-mods__input--price { padding-inline: 0.5rem; }
    .db-mods__opt-del { padding-inline: 0.3125rem; }

    .db-mods__hint { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }

    @container mods-page (max-width: 768px) {
      .db-mods { padding-inline: 1rem; padding-block: 1.25rem; }
      .db-mods__title { font-size: 1.125rem; }
      .db-mods__option-row { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class ModifiersComponent implements OnInit {
  private readonly svc = inject(ModifiersService);

  readonly items = signal<ModifierGroup[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly form = signal<GroupForm>(emptyForm());

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.svc.getAll().subscribe({
      next: (groups) => { this.items.set(groups); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  openAdd(): void {
    this.form.set(emptyForm());
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEdit(grp: ModifierGroup): void {
    this.form.set({
      id: grp.id,
      nameEn: grp.nameEn,
      nameAr: grp.nameAr,
      selectionType: grp.selectionType,
      isRequired: grp.isRequired,
      minSelections: grp.minSelections,
      maxSelections: grp.maxSelections,
      sortOrder: grp.sortOrder,
      options: grp.options.map((o) => ({ ...o })),
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.formError.set(null); }

  addOption(): void {
    this.form.update((f) => ({
      ...f,
      options: [...f.options, { nameEn: '', nameAr: '', price: 0, sortOrder: f.options.length }],
    }));
  }

  removeOption(index: number): void {
    this.form.update((f) => ({
      ...f,
      options: f.options.filter((_, i) => i !== index),
    }));
  }

  saveForm(): void {
    const f = this.form();
    if (!f.nameEn.trim()) return;

    const body: ModifierGroupRequest = {
      nameEn: f.nameEn,
      nameAr: f.nameAr,
      selectionType: f.selectionType,
      isRequired: f.isRequired,
      minSelections: f.minSelections,
      maxSelections: f.maxSelections,
      sortOrder: f.sortOrder,
      options: f.options.map((o, i) => ({ ...o, sortOrder: i })),
    };

    this.saving.set(true);
    this.formError.set(null);
    const obs = f.id ? this.svc.update(f.id, body) : this.svc.create(body);
    obs.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.load(); },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(
          err?.details?.length > 0
            ? err.details.map((d: { message: string }) => d.message).join(' ')
            : (err?.message || 'Failed to save modifier group.')
        );
      },
    });
  }

  confirmDelete(grp: ModifierGroup): void {
    if (!confirm('Delete this modifier group?')) return;
    this.svc.delete(grp.id).subscribe({ next: () => this.load() });
  }
}
