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
import { InventoryService } from '../../core/services/inventory.service';
import { Product, ProductVariant, VariantInventory } from '../../core/models/catalog.model';

interface InventoryRow {
  variant: ProductVariant;
  branchId: string;
  quantity: number;
  lowStockThreshold: number | null;
  saving: boolean;
}

@Component({
  selector: 'db-inventory',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-inv">
      <!-- Header -->
      <header class="db-inv__header">
        <h1 class="db-inv__title">{{ 'inventory.title' | translate }}</h1>
      </header>

      <!-- Product selector -->
      <div class="db-inv__selector">
        <label class="db-inv__label" [attr.for]="'inv-product-select'">
          {{ 'inventory.select_product' | translate }}
        </label>
        <select
          id="inv-product-select"
          class="db-inv__input db-inv__select"
          [(ngModel)]="selectedProductId"
          (ngModelChange)="onProductChange($event)"
        >
          <option value="">{{ 'inventory.select_product' | translate }}</option>
          @for (prod of products(); track prod.id) {
            <option [value]="prod.id">{{ prod.nameEn }}</option>
          }
        </select>
      </div>

      <!-- Hint when no product selected -->
      @if (!selectedProductId) {
        <div class="db-inv__hint-block">
          <svg class="db-inv__hint-icon" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="6" y="8" width="28" height="26" rx="3" stroke="var(--border-strong)" stroke-width="1.5"/>
            <path d="M13 16h14M13 22h9" stroke="var(--border-strong)" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p class="db-inv__hint-text">{{ 'inventory.select_product_hint' | translate }}</p>
        </div>
      }

      <!-- Error -->
      @if (error() && selectedProductId) {
        <div class="db-inv__error" role="alert">
          <span>{{ 'inventory.error' | translate }}</span>
        </div>
      }

      <!-- Variants table -->
      @if (selectedProductId && !loadingVariants() && rows().length > 0) {
        <div class="db-inv__table-wrap">
          <table class="db-inv__table" role="table">
            <thead class="db-inv__thead">
              <tr>
                <th class="db-inv__th" scope="col">{{ 'inventory.col_variant' | translate }}</th>
                <th class="db-inv__th" scope="col">{{ 'inventory.col_sku' | translate }}</th>
                <th class="db-inv__th db-inv__th--num" scope="col">{{ 'inventory.col_quantity' | translate }}</th>
                <th class="db-inv__th db-inv__th--num" scope="col">{{ 'inventory.col_threshold' | translate }}</th>
                <th class="db-inv__th" scope="col">{{ 'inventory.col_status' | translate }}</th>
                <th class="db-inv__th db-inv__th--actions" scope="col">
                  <span class="db-inv__sr">{{ 'inventory.col_actions' | translate }}</span>
                </th>
              </tr>
            </thead>
            <tbody class="db-inv__tbody">
              @for (row of rows(); track row.variant.id; let i = $index) {
                <tr class="db-inv__row" [class.db-inv__row--out]="row.quantity === 0" [class.db-inv__row--low]="isLow(row)">
                  <td class="db-inv__td">
                    <span class="db-inv__attrs">{{ formatAttrs(row.variant.variantAttributesJson) }}</span>
                  </td>
                  <td class="db-inv__td">
                    <span class="db-inv__sku">{{ row.variant.sku }}</span>
                  </td>
                  <td class="db-inv__td db-inv__td--num">
                    <input
                      class="db-inv__qty-input"
                      type="number"
                      [ngModel]="row.quantity"
                      (ngModelChange)="setQty(i, $event)"
                      min="0"
                    />
                  </td>
                  <td class="db-inv__td db-inv__td--num">
                    <input
                      class="db-inv__qty-input"
                      type="number"
                      [ngModel]="row.lowStockThreshold"
                      (ngModelChange)="setThreshold(i, $event)"
                      min="0"
                    />
                  </td>
                  <td class="db-inv__td">
                    <span class="db-inv__status-badge" [attr.data-status]="stockStatus(row)">
                      {{ stockStatusKey(row) | translate }}
                    </span>
                  </td>
                  <td class="db-inv__td db-inv__td--actions">
                    <button
                      class="db-inv__btn-primary"
                      type="button"
                      [disabled]="row.saving"
                      (click)="saveRow(i)"
                    >
                      @if (row.saving) { <span class="db-inv__spinner" aria-hidden="true"></span> }
                      {{ 'inventory.update' | translate }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (selectedProductId && !loadingVariants() && rows().length === 0 && !error()) {
        <p class="db-inv__empty">{{ 'inventory.no_variants' | translate }}</p>
      }

      @if (loadingVariants()) {
        <div class="db-inv__loading-variants" aria-busy="true">
          <span class="db-inv__spinner db-inv__spinner--dark" aria-hidden="true"></span>
          <span>{{ 'common.loading' | translate }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .db-inv {
      padding-block: 2rem;
      padding-inline: 2rem;
      container-type: inline-size;
      container-name: inv-page;
    }

    .db-inv__header {
      margin-block-end: 1.5rem;
    }

    .db-inv__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      letter-spacing: -0.025em;
    }

    .db-inv__selector {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-block-end: 1.5rem;
      flex-wrap: wrap;
    }

    .db-inv__label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .db-inv__input {
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

    .db-inv__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-inv__select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 0.625rem) 50%;
      padding-inline-end: 2rem;
      cursor: pointer;
      min-inline-size: 200px;
    }

    /* Hint block */
    .db-inv__hint-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-block: 4rem 3rem;
      gap: 0.875rem;
      text-align: center;
    }

    .db-inv__hint-icon { color: var(--border-strong); opacity: 0.7; }

    .db-inv__hint-text {
      font-size: 0.875rem;
      color: var(--text-muted);
      max-inline-size: 36ch;
      line-height: 1.55;
      margin: 0;
    }

    /* Error */
    .db-inv__error {
      padding: 1rem;
      margin-block-end: 1rem;
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-card);
      color: var(--error);
      font-size: 0.875rem;
    }

    /* Table */
    .db-inv__table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow-x: auto;
    }

    .db-inv__table {
      inline-size: 100%;
      min-inline-size: 580px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-inv__thead {
      background: var(--surface-alt);
      border-block-end: 1px solid var(--border);
    }

    .db-inv__th {
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

    .db-inv__th--num { text-align: end; }
    .db-inv__th--actions { inline-size: 96px; }

    .db-inv__row {
      border-block-end: 1px solid var(--border);
      transition: background-color var(--motion-fast) ease;
    }

    .db-inv__row:last-child { border-block-end: none; }

    .db-inv__row--out {
      background: color-mix(in srgb, var(--error) 5%, transparent);
    }

    .db-inv__row--low:not(.db-inv__row--out) {
      background: color-mix(in srgb, var(--warning) 5%, transparent);
    }

    .db-inv__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem 0.5rem;
      vertical-align: middle;
      color: var(--text);
    }

    .db-inv__td--num { text-align: end; }

    .db-inv__td--actions {
      text-align: end;
      padding-inline-end: 0.875rem;
    }

    .db-inv__attrs { font-weight: 500; }
    .db-inv__sku { font-size: 0.8125rem; color: var(--text-muted); }

    .db-inv__qty-input {
      inline-size: 72px;
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

    .db-inv__qty-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-inv__status-badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .db-inv__status-badge[data-status='in_stock'] {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
      outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
    }

    .db-inv__status-badge[data-status='low'] {
      background: color-mix(in srgb, var(--warning) 14%, transparent);
      color: var(--warning);
      outline: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
    }

    .db-inv__status-badge[data-status='out'] {
      background: color-mix(in srgb, var(--error) 10%, transparent);
      color: var(--error);
      outline: 1px solid color-mix(in srgb, var(--error) 25%, transparent);
    }

    /* Buttons */
    .db-inv__btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding-block: 0.375rem;
      padding-inline: 0.75rem;
      font-size: 0.8125rem;
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

    .db-inv__btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
    .db-inv__btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

    .db-inv__empty {
      text-align: center;
      padding-block: 3rem;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .db-inv__loading-variants {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding-block: 2rem;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .db-inv__sr { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }

    .db-inv__spinner {
      display: inline-block;
      inline-size: 14px;
      block-size: 14px;
      border: 2px solid color-mix(in srgb, var(--accent-text) 40%, transparent);
      border-block-start-color: var(--accent-text);
      border-radius: 50%;
      animation: db-spin 0.7s linear infinite;
    }

    .db-inv__spinner--dark {
      border-color: var(--border);
      border-block-start-color: var(--accent);
    }

    @keyframes db-spin { to { transform: rotate(360deg); } }

    @container inv-page (max-width: 768px) {
      .db-inv { padding-inline: 1rem; padding-block: 1.25rem; }
      .db-inv__title { font-size: 1.125rem; }
    }
  `],
})
export class InventoryComponent implements OnInit {
  private readonly productsSvc = inject(ProductsService);
  private readonly inventorySvc = inject(InventoryService);

  readonly products = signal<Product[]>([]);
  readonly rows = signal<InventoryRow[]>([]);
  readonly loadingVariants = signal(false);
  readonly error = signal(false);

  selectedProductId = '';
  private readonly defaultBranchId = 'default';

  ngOnInit(): void {
    this.productsSvc.getAll({ pageSize: 200 }).subscribe({
      next: (res) => this.products.set(res.items),
    });
  }

  onProductChange(productId: string): void {
    if (!productId) { this.rows.set([]); return; }
    this.loadingVariants.set(true);
    this.error.set(false);

    this.inventorySvc.getVariants(productId).subscribe({
      next: (variants) => {
        this.rows.set(variants.map((v) => ({
          variant: v,
          branchId: this.defaultBranchId,
          quantity: v.quantity,
          lowStockThreshold: null,
          saving: false,
        })));
        this.loadingVariants.set(false);
      },
      error: () => { this.error.set(true); this.loadingVariants.set(false); },
    });
  }

  setQty(index: number, value: number): void {
    this.rows.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, quantity: value } : r)),
    );
  }

  setThreshold(index: number, value: number | null): void {
    this.rows.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, lowStockThreshold: value } : r)),
    );
  }

  saveRow(index: number): void {
    const row = this.rows()[index];
    const pid = this.selectedProductId;

    this.rows.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, saving: true } : r)),
    );

    this.inventorySvc.updateInventory(pid, row.variant.id, {
      branchId: row.branchId,
      quantity: row.quantity,
      lowStockThreshold: row.lowStockThreshold,
    }).subscribe({
      next: () => {
        this.rows.update((rows) =>
          rows.map((r, i) => (i === index ? { ...r, saving: false } : r)),
        );
      },
      error: () => {
        this.rows.update((rows) =>
          rows.map((r, i) => (i === index ? { ...r, saving: false } : r)),
        );
      },
    });
  }

  stockStatus(row: InventoryRow): 'out' | 'low' | 'in_stock' {
    if (row.quantity === 0) return 'out';
    if (row.lowStockThreshold != null && row.quantity <= row.lowStockThreshold) return 'low';
    return 'in_stock';
  }

  stockStatusKey(row: InventoryRow): string {
    const s = this.stockStatus(row);
    return s === 'out' ? 'inventory.status_out' : s === 'low' ? 'inventory.status_low' : 'inventory.status_in_stock';
  }

  isLow(row: InventoryRow): boolean {
    return row.quantity > 0 && row.lowStockThreshold != null && row.quantity <= row.lowStockThreshold;
  }

  formatAttrs(json: string): string {
    try {
      const obj = JSON.parse(json);
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ') || '—';
    } catch {
      return json || '—';
    }
  }
}
