import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { InventoryService } from '../../core/services/inventory.service';
import { Product, ProductRequest, Category, ProductVariant, VariantRequest } from '../../core/models/catalog.model';

type FormTab = 'basic' | 'variants' | 'inventory';

interface VariantRow {
  id: string | null;
  sku: string;
  price: number;
  variantAttributesJson: string;
  quantity: number;
}

interface ProductForm {
  id: string | null;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  sku: string;
  barcode: string;
  isPublished: boolean;
  sortOrder: number;
}

function emptyForm(): ProductForm {
  return { id: null, categoryId: '', nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '', price: 0, sku: '', barcode: '', isPublished: true, sortOrder: 0 };
}

@Component({
  selector: 'db-products',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-prods">
      <!-- Header -->
      <header class="db-prods__header">
        <h1 class="db-prods__title">{{ 'products.title' | translate }}</h1>
        <button class="db-prods__btn-primary" type="button" (click)="openAdd()">
          + {{ 'products.add_product' | translate }}
        </button>
      </header>

      <!-- Toolbar -->
      <div class="db-prods__toolbar">
        <div class="db-prods__search-wrap">
          <svg class="db-prods__search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            class="db-prods__input db-prods__search"
            type="search"
            [placeholder]="'products.search_products' | translate"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
          />
        </div>
        <select class="db-prods__input db-prods__select" [(ngModel)]="filterCategoryId" (ngModelChange)="onSearch()">
          <option value="">{{ 'products.filter_category' | translate }}</option>
          @for (cat of categories(); track cat.id) {
            <option [value]="cat.id">{{ cat.nameEn }}</option>
          }
        </select>
      </div>

      <!-- Error -->
      @if (error() && !loading()) {
        <div class="db-prods__error" role="alert">
          <span>{{ 'products.error' | translate }}</span>
          <button class="db-prods__retry" type="button" (click)="load()">{{ 'products.retry' | translate }}</button>
        </div>
      }

      <!-- Table -->
      <div class="db-prods__table-wrap">
        <table class="db-prods__table" role="table">
          <thead class="db-prods__thead">
            <tr>
              <th class="db-prods__th" scope="col">{{ 'products.col_name' | translate }}</th>
              <th class="db-prods__th" scope="col">{{ 'products.col_category' | translate }}</th>
              <th class="db-prods__th db-prods__th--num" scope="col">{{ 'products.col_price' | translate }}</th>
              <th class="db-prods__th" scope="col">{{ 'products.col_published' | translate }}</th>
              <th class="db-prods__th db-prods__th--actions" scope="col">
                <span class="db-prods__sr">{{ 'products.col_actions' | translate }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="db-prods__tbody">
            @if (loading()) {
              @for (_ of [1,2,3,4,5]; track $index) {
                <tr class="db-prods__row" aria-hidden="true">
                  <td class="db-prods__td"><span class="db-prods__sk db-prods__sk--name"></span></td>
                  <td class="db-prods__td"><span class="db-prods__sk db-prods__sk--sm"></span></td>
                  <td class="db-prods__td db-prods__td--num"><span class="db-prods__sk db-prods__sk--xs"></span></td>
                  <td class="db-prods__td"><span class="db-prods__sk db-prods__sk--badge"></span></td>
                  <td class="db-prods__td db-prods__td--actions"></td>
                </tr>
              }
            }
            @if (!loading()) {
              @for (prod of items(); track prod.id) {
                <tr class="db-prods__row">
                  <td class="db-prods__td">
                    <div class="db-prods__name-cell">
                      <div class="db-prods__thumb" [attr.aria-hidden]="true">
                        @if (prod.imageUrl) {
                          <img [src]="prod.imageUrl" [alt]="prod.nameEn" class="db-prods__thumb-img" loading="lazy" />
                        } @else {
                          <span class="db-prods__thumb-placeholder">{{ prod.nameEn.charAt(0) }}</span>
                        }
                      </div>
                      <span class="db-prods__name">{{ prod.nameEn }}</span>
                    </div>
                  </td>
                  <td class="db-prods__td">
                    <span class="db-prods__muted">{{ prod.categoryNameEn ?? '—' }}</span>
                  </td>
                  <td class="db-prods__td db-prods__td--num">
                    <span class="db-prods__price">{{ prod.price.toFixed(3) }}</span>
                  </td>
                  <td class="db-prods__td">
                    <span class="db-prods__badge" [attr.data-pub]="prod.isPublished ? 'yes' : 'no'">
                      {{ (prod.isPublished ? 'categories_page.published' : 'common.no') | translate }}
                    </span>
                  </td>
                  <td class="db-prods__td db-prods__td--actions">
                    <div class="db-prods__actions">
                      <button class="db-prods__btn-ghost" type="button" (click)="openEdit(prod)">{{ 'common.edit' | translate }}</button>
                      <button class="db-prods__btn-danger" type="button" (click)="confirmDelete(prod)">{{ 'common.delete' | translate }}</button>
                    </div>
                  </td>
                </tr>
              }
              @if (items().length === 0 && !error()) {
                <tr>
                  <td class="db-prods__empty" colspan="5">{{ 'products.no_products' | translate }}</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Form Drawer -->
      @if (showForm()) {
        <div class="db-prods__overlay" role="dialog" [attr.aria-modal]="true" (click)="closeForm()">
          <div class="db-prods__drawer" (click)="$event.stopPropagation()">
            <header class="db-prods__drawer-header">
              <h2 class="db-prods__drawer-title">
                {{ (form().id ? 'products.form_title_edit' : 'products.form_title_add') | translate }}
              </h2>
              <button class="db-prods__close" type="button" (click)="closeForm()">✕</button>
            </header>

            <!-- Tabs -->
            <div class="db-prods__tabs" role="tablist">
              <button class="db-prods__tab" type="button" role="tab" [class.db-prods__tab--active]="activeTab() === 'basic'" (click)="activeTab.set('basic')">
                {{ 'products.tab_basic' | translate }}
              </button>
              <button class="db-prods__tab" type="button" role="tab" [class.db-prods__tab--active]="activeTab() === 'variants'" (click)="loadVariants()">
                {{ 'products.tab_variants' | translate }}
              </button>
              <button class="db-prods__tab" type="button" role="tab" [class.db-prods__tab--active]="activeTab() === 'inventory'" (click)="activeTab.set('inventory')">
                {{ 'products.tab_inventory' | translate }}
              </button>
            </div>

            <div class="db-prods__drawer-body">
              <!-- Basic tab -->
              @if (activeTab() === 'basic') {
                <label class="db-prods__label">
                  {{ 'products.name_en' | translate }}
                  <input class="db-prods__input" type="text" [(ngModel)]="form().nameEn" />
                </label>
                <label class="db-prods__label">
                  {{ 'products.name_ar' | translate }}
                  <input class="db-prods__input" type="text" [(ngModel)]="form().nameAr" dir="rtl" />
                </label>
                <label class="db-prods__label">
                  {{ 'products.desc_en' | translate }}
                  <textarea class="db-prods__input db-prods__textarea" [(ngModel)]="form().descriptionEn" rows="2"></textarea>
                </label>
                <label class="db-prods__label">
                  {{ 'products.desc_ar' | translate }}
                  <textarea class="db-prods__input db-prods__textarea" [(ngModel)]="form().descriptionAr" rows="2" dir="rtl"></textarea>
                </label>
                <label class="db-prods__label">
                  {{ 'products.category' | translate }}
                  <select class="db-prods__input db-prods__select" [(ngModel)]="form().categoryId">
                    <option value="">—</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.nameEn }}</option>
                    }
                  </select>
                </label>
                <div class="db-prods__row-2">
                  <label class="db-prods__label">
                    {{ 'products.price' | translate }}
                    <input class="db-prods__input" type="number" [(ngModel)]="form().price" min="0" step="0.001" />
                  </label>
                  <label class="db-prods__label">
                    {{ 'products.sku' | translate }}
                    <input class="db-prods__input" type="text" [(ngModel)]="form().sku" />
                  </label>
                </div>
                <label class="db-prods__label">
                  {{ 'products.barcode' | translate }}
                  <input class="db-prods__input" type="text" [(ngModel)]="form().barcode" />
                </label>
                <label class="db-prods__toggle-label">
                  <input class="db-prods__toggle-input" type="checkbox" [(ngModel)]="form().isPublished" />
                  <span class="db-prods__toggle-track"><span class="db-prods__toggle-thumb"></span></span>
                  {{ 'products.published' | translate }}
                </label>
              }

              <!-- Variants tab -->
              @if (activeTab() === 'variants') {
                @if (form().id) {
                  <div class="db-prods__variants">
                    <div class="db-prods__section-header">
                      <span class="db-prods__section-title">{{ 'products.tab_variants' | translate }}</span>
                      <button class="db-prods__btn-secondary" type="button" (click)="addVariantRow()">
                        + {{ 'products.add_variant' | translate }}
                      </button>
                    </div>
                    @for (v of variantRows(); track $index; let i = $index) {
                      <div class="db-prods__variant-row">
                        <input class="db-prods__input db-prods__variant-sku" type="text" [placeholder]="'products.variant_sku' | translate" [(ngModel)]="v.sku" />
                        <input class="db-prods__input db-prods__variant-price" type="number" [placeholder]="'products.variant_price' | translate" [(ngModel)]="v.price" min="0" step="0.001" />
                        <input class="db-prods__input db-prods__variant-attrs" type="text" [placeholder]="'products.variant_attrs' | translate" [(ngModel)]="v.variantAttributesJson" />
                        <button class="db-prods__btn-danger db-prods__variant-del" type="button" (click)="removeVariantRow(i)">✕</button>
                      </div>
                    }
                    @if (variantRows().length === 0) {
                      <p class="db-prods__hint">{{ 'products.add_variant' | translate }}</p>
                    }
                    <button class="db-prods__btn-primary" type="button" (click)="saveVariants()" [disabled]="saving()">
                      @if (saving()) { <span class="db-prods__spinner" aria-hidden="true"></span> }
                      {{ 'common.save' | translate }}
                    </button>
                  </div>
                } @else {
                  <p class="db-prods__hint">{{ 'products.inventory_note' | translate }}</p>
                }
              }

              <!-- Inventory tab -->
              @if (activeTab() === 'inventory') {
                <p class="db-prods__hint">{{ 'products.inventory_note' | translate }}</p>
              }
            </div>

            @if (activeTab() === 'basic') {
              <footer class="db-prods__drawer-footer">
                <button class="db-prods__btn-secondary" type="button" (click)="closeForm()">{{ 'common.cancel' | translate }}</button>
                <button class="db-prods__btn-primary" type="button" (click)="saveForm()" [disabled]="saving()">
                  @if (saving()) { <span class="db-prods__spinner" aria-hidden="true"></span> }
                  {{ 'common.save' | translate }}
                </button>
              </footer>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .db-prods {
      padding-block: 2rem;
      padding-inline: 2rem;
      container-type: inline-size;
      container-name: prods-page;
    }

    .db-prods__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-block-end: 1.5rem;
      flex-wrap: wrap;
    }

    .db-prods__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      letter-spacing: -0.025em;
    }

    .db-prods__toolbar {
      display: flex;
      gap: 0.5rem;
      margin-block-end: 1.25rem;
      flex-wrap: wrap;
    }

    .db-prods__search-wrap {
      position: relative;
      flex: 1;
      min-inline-size: 180px;
      max-inline-size: 320px;
    }

    .db-prods__search-icon {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 0.625rem;
      transform: translateY(-50%);
      color: var(--text-subtle);
      pointer-events: none;
    }

    .db-prods__search { inline-size: 100%; padding-inline-start: 2rem; }

    .db-prods__input {
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.5rem;
      padding-inline: 0.75rem;
      outline: none;
      block-size: 36px;
      box-sizing: border-box;
      transition: border-color var(--motion-base) ease, box-shadow var(--motion-base) ease;
    }

    .db-prods__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-prods__select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 0.625rem) 50%;
      padding-inline-end: 2rem;
      cursor: pointer;
      min-inline-size: 140px;
    }

    .db-prods__btn-primary {
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

    .db-prods__btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
    .db-prods__btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

    .db-prods__btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
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
    }

    .db-prods__btn-secondary:hover { background: var(--surface-alt); }

    .db-prods__btn-ghost {
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

    .db-prods__btn-ghost:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); }

    .db-prods__btn-danger {
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

    .db-prods__btn-danger:hover { background: color-mix(in srgb, var(--error) 14%, transparent); }

    .db-prods__retry {
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

    .db-prods__error {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      margin-block-end: 1rem;
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-card);
      color: var(--error);
      font-size: 0.875rem;
    }

    .db-prods__table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow-x: auto;
    }

    .db-prods__table {
      inline-size: 100%;
      min-inline-size: 560px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-prods__thead {
      background: var(--surface-alt);
      border-block-end: 1px solid var(--border);
    }

    .db-prods__th {
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

    .db-prods__th--num { text-align: end; }
    .db-prods__th--actions { inline-size: 120px; }

    .db-prods__row {
      border-block-end: 1px solid var(--border);
      transition: background-color var(--motion-fast) ease;
    }

    .db-prods__row:last-child { border-block-end: none; }
    .db-prods__row:hover { background: var(--surface-alt); }

    .db-prods__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem 0.5rem;
      vertical-align: middle;
      color: var(--text);
    }

    .db-prods__td--num { text-align: end; }

    .db-prods__td--actions {
      text-align: end;
      padding-inline-end: 0.875rem;
    }

    .db-prods__empty {
      text-align: center;
      padding-block: 3rem;
      color: var(--text-muted);
    }

    .db-prods__name-cell {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .db-prods__thumb {
      inline-size: 36px;
      block-size: 36px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--surface-alt);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .db-prods__thumb-img { inline-size: 100%; block-size: 100%; object-fit: cover; }

    .db-prods__thumb-placeholder {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .db-prods__name { font-weight: 600; color: var(--text); }

    .db-prods__muted { color: var(--text-muted); font-size: 0.875rem; }

    .db-prods__price {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .db-prods__badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .db-prods__badge[data-pub='yes'] {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
      outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
    }

    .db-prods__badge[data-pub='no'] {
      background: color-mix(in srgb, var(--text-muted) 10%, transparent);
      color: var(--text-muted);
      outline: 1px solid color-mix(in srgb, var(--text-muted) 25%, transparent);
    }

    .db-prods__actions { display: flex; gap: 0.375rem; justify-content: flex-end; }

    /* Skeleton */
    .db-prods__sk {
      display: inline-block;
      block-size: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-shimmer 1.4s infinite;
    }

    .db-prods__sk--name  { inline-size: 140px; }
    .db-prods__sk--sm    { inline-size: 80px; }
    .db-prods__sk--xs    { inline-size: 40px; }
    .db-prods__sk--badge { inline-size: 60px; block-size: 20px; border-radius: 999px; }

    @keyframes db-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .db-prods__sr { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }

    .db-prods__spinner {
      display: inline-block;
      inline-size: 14px;
      block-size: 14px;
      border: 2px solid color-mix(in srgb, var(--accent-text) 40%, transparent);
      border-block-start-color: var(--accent-text);
      border-radius: 50%;
      animation: db-spin 0.7s linear infinite;
    }

    @keyframes db-spin { to { transform: rotate(360deg); } }

    /* Overlay */
    .db-prods__overlay {
      position: fixed;
      inset: 0;
      background: color-mix(in srgb, #000 55%, transparent);
      display: flex;
      align-items: stretch;
      justify-content: flex-end;
      z-index: 200;
    }

    .db-prods__drawer {
      background: var(--card);
      border-inline-start: 1px solid var(--border);
      inline-size: 100%;
      max-inline-size: 540px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .db-prods__drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-block: 1.25rem;
      padding-inline: 1.5rem;
      border-block-end: 1px solid var(--border);
      flex-shrink: 0;
    }

    .db-prods__drawer-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-prods__close {
      padding: 0.25rem 0.5rem;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-prods__close:hover { background: var(--surface-alt); color: var(--text); }

    .db-prods__tabs {
      display: flex;
      border-block-end: 1px solid var(--border);
      flex-shrink: 0;
    }

    .db-prods__tab {
      flex: 1;
      padding-block: 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-block-end: 2px solid transparent;
      cursor: pointer;
      transition: color var(--motion-base) ease, border-color var(--motion-base) ease;
    }

    .db-prods__tab--active {
      color: var(--accent);
      border-block-end-color: var(--accent);
    }

    .db-prods__drawer-body {
      flex: 1;
      overflow-y: auto;
      padding-block: 1.25rem;
      padding-inline: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .db-prods__drawer-footer {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      padding-block: 1rem 1.25rem;
      padding-inline: 1.5rem;
      border-block-start: 1px solid var(--border);
      flex-shrink: 0;
    }

    .db-prods__label {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .db-prods__textarea {
      block-size: auto;
      resize: vertical;
    }

    .db-prods__row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    .db-prods__toggle-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
    }

    .db-prods__toggle-input { display: none; }

    .db-prods__toggle-track {
      display: inline-block;
      inline-size: 36px;
      block-size: 20px;
      background: var(--border);
      border-radius: 999px;
      position: relative;
      transition: background-color var(--motion-base) ease;
      flex-shrink: 0;
    }

    .db-prods__toggle-input:checked ~ .db-prods__toggle-track { background: var(--accent); }

    .db-prods__toggle-thumb {
      position: absolute;
      inset-block-start: 2px;
      inset-inline-start: 2px;
      inline-size: 16px;
      block-size: 16px;
      background: #fff;
      border-radius: 50%;
      transition: inset-inline-start var(--motion-base) ease;
    }

    .db-prods__toggle-input:checked ~ .db-prods__toggle-track .db-prods__toggle-thumb {
      inset-inline-start: 18px;
    }

    .db-prods__hint {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .db-prods__variants { display: flex; flex-direction: column; gap: 0.75rem; }

    .db-prods__section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-block-end: 0.25rem;
    }

    .db-prods__section-title { font-size: 0.875rem; font-weight: 700; color: var(--text); }

    .db-prods__variant-row {
      display: grid;
      grid-template-columns: 1fr 0.7fr 1.2fr 32px;
      gap: 0.5rem;
      align-items: center;
    }

    .db-prods__variant-del { padding-inline: 0.375rem; }

    @container prods-page (max-width: 768px) {
      .db-prods { padding-inline: 1rem; padding-block: 1.25rem; }
      .db-prods__title { font-size: 1.125rem; }
      .db-prods__drawer { max-inline-size: 100%; }
    }
  `],
})
export class ProductsComponent implements OnInit {
  private readonly productsSvc = inject(ProductsService);
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly inventorySvc = inject(InventoryService);

  readonly items = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly activeTab = signal<FormTab>('basic');
  readonly variantRows = signal<VariantRow[]>([]);
  readonly existingVariants = signal<ProductVariant[]>([]);

  readonly form = signal<ProductForm>(emptyForm());

  searchTerm = '';
  filterCategoryId = '';

  ngOnInit(): void {
    this.load();
    this.categoriesSvc.getAll().subscribe({ next: (cats) => this.categories.set(cats) });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.productsSvc.getAll({ search: this.searchTerm || undefined, categoryId: this.filterCategoryId || undefined }).subscribe({
      next: (res) => { this.items.set(res.items); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  onSearch(): void { this.load(); }

  openAdd(): void {
    this.form.set(emptyForm());
    this.activeTab.set('basic');
    this.variantRows.set([]);
    this.showForm.set(true);
  }

  openEdit(prod: Product): void {
    this.form.set({
      id: prod.id,
      categoryId: prod.categoryId ?? '',
      nameEn: prod.nameEn,
      nameAr: prod.nameAr,
      descriptionEn: prod.descriptionEn ?? '',
      descriptionAr: prod.descriptionAr ?? '',
      price: prod.price,
      sku: prod.sku ?? '',
      barcode: prod.barcode ?? '',
      isPublished: prod.isPublished,
      sortOrder: prod.sortOrder,
    });
    this.activeTab.set('basic');
    this.variantRows.set([]);
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  saveForm(): void {
    const f = this.form();
    if (!f.nameEn.trim()) return;

    const body: ProductRequest = {
      categoryId: f.categoryId || null,
      nameEn: f.nameEn,
      nameAr: f.nameAr,
      descriptionEn: f.descriptionEn || null,
      descriptionAr: f.descriptionAr || null,
      price: f.price,
      sku: f.sku || null,
      barcode: f.barcode || null,
      isPublished: f.isPublished,
      sortOrder: f.sortOrder,
      productType: 'physical',
    };

    this.saving.set(true);
    const obs = f.id ? this.productsSvc.update(f.id, body) : this.productsSvc.create(body);
    obs.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.load(); },
      error: () => { this.saving.set(false); },
    });
  }

  confirmDelete(prod: Product): void {
    if (!confirm('Delete this product?')) return;
    this.productsSvc.delete(prod.id).subscribe({ next: () => this.load() });
  }

  loadVariants(): void {
    this.activeTab.set('variants');
    const id = this.form().id;
    if (!id) return;
    this.inventorySvc.getVariants(id).subscribe({
      next: (variants) => {
        this.existingVariants.set(variants);
        this.variantRows.set(variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: v.price,
          variantAttributesJson: v.variantAttributesJson,
          quantity: v.quantity,
        })));
      },
    });
  }

  addVariantRow(): void {
    this.variantRows.update((rows) => [
      ...rows,
      { id: null, sku: '', price: 0, variantAttributesJson: '{}', quantity: 0 },
    ]);
  }

  removeVariantRow(index: number): void {
    this.variantRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  saveVariants(): void {
    const pid = this.form().id;
    if (!pid) return;
    this.saving.set(true);
    const newRows = this.variantRows().filter((v) => !v.id && v.sku.trim());
    let pending = newRows.length;
    if (pending === 0) { this.saving.set(false); return; }
    for (const row of newRows) {
      const body: VariantRequest = {
        sku: row.sku,
        price: row.price,
        quantity: row.quantity,
        variantAttributesJson: row.variantAttributesJson || '{}',
      };
      this.inventorySvc.createVariant(pid, body).subscribe({
        next: () => { if (--pending === 0) { this.saving.set(false); this.loadVariants(); } },
        error: () => { this.saving.set(false); },
      });
    }
  }
}
