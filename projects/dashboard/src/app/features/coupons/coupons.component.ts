import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { CouponsService } from '../../core/services/coupons.service';
import { Coupon, CouponRequest, CouponDiscountType } from '../../core/models/coupon.model';

interface CouponForm {
  id: string | null;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

function emptyCouponForm(): CouponForm {
  return {
    id: null,
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderAmount: 0,
    maxUses: null,
    validFrom: '',
    validUntil: '',
    isActive: true,
  };
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

@Component({
  selector: 'db-coupons',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-cp">
      <header class="db-cp__header">
        <h1 class="db-cp__title">{{ 'coupons.title' | translate }}</h1>
        <button class="db-cp__btn-primary" type="button" (click)="openAdd()">
          + {{ 'coupons.create_btn' | translate }}
        </button>
      </header>

      <!-- Filter bar -->
      <div class="db-cp__filters">
        @for (f of statusFilters; track f.value) {
          <button
            class="db-cp__filter-btn"
            type="button"
            [class.db-cp__filter-btn--active]="statusFilter() === f.value"
            (click)="statusFilter.set(f.value)"
          >{{ f.labelKey | translate }}</button>
        }
      </div>

      <!-- Error banner -->
      @if (formError()) {
        <div class="db-cp__error-banner" role="alert">
          {{ formError() }}
          <button class="db-cp__close-banner" type="button" (click)="formError.set(null)">✕</button>
        </div>
      }

      <!-- Table -->
      <div class="db-cp__table-wrap">
        <table class="db-cp__table" role="table">
          <thead class="db-cp__thead">
            <tr>
              <th class="db-cp__th" scope="col">{{ 'coupons.col_code' | translate }}</th>
              <th class="db-cp__th" scope="col">{{ 'coupons.col_type' | translate }}</th>
              <th class="db-cp__th db-cp__th--num" scope="col">{{ 'coupons.col_value' | translate }}</th>
              <th class="db-cp__th" scope="col">{{ 'coupons.col_usage' | translate }}</th>
              <th class="db-cp__th db-cp__th--num" scope="col">{{ 'coupons.col_min_order' | translate }}</th>
              <th class="db-cp__th" scope="col">{{ 'coupons.col_valid' | translate }}</th>
              <th class="db-cp__th" scope="col">{{ 'coupons.col_status' | translate }}</th>
              <th class="db-cp__th db-cp__th--actions" scope="col">
                <span class="db-cp__sr">{{ 'coupons.col_actions' | translate }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="db-cp__tbody">
            @if (loading()) {
              @for (_ of [1,2,3,4]; track $index) {
                <tr class="db-cp__row" aria-hidden="true">
                  @for (_ of [1,2,3,4,5,6,7]; track $index) {
                    <td class="db-cp__td"><span class="db-cp__sk"></span></td>
                  }
                  <td class="db-cp__td db-cp__td--actions"></td>
                </tr>
              }
            }
            @if (!loading()) {
              @for (coupon of filteredCoupons(); track coupon.id) {
                <tr class="db-cp__row">
                  <td class="db-cp__td">
                    <span class="db-cp__code">{{ coupon.code }}</span>
                  </td>
                  <td class="db-cp__td">
                    <span class="db-cp__type-badge" [attr.data-type]="coupon.discountType">
                      {{ discountTypeKey(coupon.discountType) | translate }}
                    </span>
                  </td>
                  <td class="db-cp__td db-cp__td--num">
                    <span class="db-cp__value">{{ formatValue(coupon) }}</span>
                  </td>
                  <td class="db-cp__td">
                    <span class="db-cp__usage">
                      {{ coupon.usedCount }}{{ coupon.maxUses ? '/' + coupon.maxUses : '' }}
                    </span>
                  </td>
                  <td class="db-cp__td db-cp__td--num">
                    <span class="db-cp__min">{{ coupon.minOrderAmount > 0 ? formatKd(coupon.minOrderAmount) : '—' }}</span>
                  </td>
                  <td class="db-cp__td">
                    <span class="db-cp__valid">{{ formatValidRange(coupon) }}</span>
                  </td>
                  <td class="db-cp__td">
                    <span class="db-cp__status-badge" [attr.data-status]="couponStatus(coupon)">
                      {{ couponStatusKey(coupon) | translate }}
                    </span>
                  </td>
                  <td class="db-cp__td db-cp__td--actions">
                    <div class="db-cp__row-actions">
                      <button
                        class="db-cp__toggle-btn"
                        type="button"
                        [title]="coupon.isActive ? 'Pause' : 'Activate'"
                        (click)="toggleCoupon(coupon.id)"
                      >{{ coupon.isActive ? '⏸' : '▶' }}</button>
                      <button
                        class="db-cp__edit-btn"
                        type="button"
                        (click)="openEdit(coupon)"
                      >{{ 'common.edit' | translate }}</button>
                      <button
                        class="db-cp__delete-btn"
                        type="button"
                        (click)="deleteCoupon(coupon.id)"
                      >{{ 'common.delete' | translate }}</button>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>

        @if (!loading() && !loadError() && filteredCoupons().length === 0) {
          <div class="db-cp__empty" role="status">
            <p>{{ 'coupons.no_coupons' | translate }}</p>
          </div>
        }

        @if (loadError() && !loading()) {
          <div class="db-cp__table-error" role="alert">
            <span>{{ 'coupons.error' | translate }}</span>
            <button class="db-cp__retry" type="button" (click)="load()">
              {{ 'coupons.retry' | translate }}
            </button>
          </div>
        }
      </div>

      <!-- Drawer -->
      @if (showForm()) {
        <div class="db-cp__overlay" (click)="closeForm()" aria-hidden="true"></div>
        <aside class="db-cp__drawer" role="dialog" [attr.aria-label]="(form().id ? 'coupons.form_edit_title' : 'coupons.form_add_title') | translate">
          <header class="db-cp__drawer-header">
            <h2 class="db-cp__drawer-title">
              {{ (form().id ? 'coupons.form_edit_title' : 'coupons.form_add_title') | translate }}
            </h2>
            <button class="db-cp__close-btn" type="button" (click)="closeForm()">✕</button>
          </header>

          <div class="db-cp__drawer-body">
            <!-- Code -->
            <div class="db-cp__field">
              <label class="db-cp__label" for="cp-code">{{ 'coupons.field_code' | translate }}</label>
              <div class="db-cp__code-row">
                <input
                  id="cp-code"
                  class="db-cp__input"
                  type="text"
                  [ngModel]="form().code"
                  (ngModelChange)="updateForm('code', $event.toUpperCase())"
                  placeholder="SAVE20"
                />
                <button class="db-cp__gen-btn" type="button" (click)="autoGenerate()">
                  {{ 'coupons.auto_generate' | translate }}
                </button>
              </div>
              <p class="db-cp__hint">{{ 'coupons.field_code_hint' | translate }}</p>
            </div>

            <!-- Discount Type -->
            <div class="db-cp__field">
              <label class="db-cp__label" for="cp-type">{{ 'coupons.field_type' | translate }}</label>
              <select
                id="cp-type"
                class="db-cp__input db-cp__select"
                [ngModel]="form().discountType"
                (ngModelChange)="updateForm('discountType', $event)"
              >
                <option value="percentage">{{ 'coupons.type_percentage' | translate }}</option>
                <option value="fixed">{{ 'coupons.type_fixed' | translate }}</option>
                <option value="free_delivery">{{ 'coupons.type_free_delivery' | translate }}</option>
              </select>
            </div>

            <!-- Discount Value (hidden for free_delivery) -->
            @if (form().discountType !== 'free_delivery') {
              <div class="db-cp__field">
                <label class="db-cp__label" for="cp-value">{{ 'coupons.field_value' | translate }}</label>
                <input
                  id="cp-value"
                  class="db-cp__input"
                  type="number"
                  min="0"
                  step="0.001"
                  [ngModel]="form().discountValue"
                  (ngModelChange)="updateForm('discountValue', +$event)"
                />
              </div>
            }

            <!-- Min Order -->
            <div class="db-cp__field">
              <label class="db-cp__label" for="cp-min">{{ 'coupons.field_min_order' | translate }}</label>
              <input
                id="cp-min"
                class="db-cp__input"
                type="number"
                min="0"
                step="0.001"
                [ngModel]="form().minOrderAmount"
                (ngModelChange)="updateForm('minOrderAmount', +$event)"
              />
            </div>

            <!-- Max Uses -->
            <div class="db-cp__field">
              <label class="db-cp__label" for="cp-max">{{ 'coupons.field_max_uses' | translate }}</label>
              <input
                id="cp-max"
                class="db-cp__input"
                type="number"
                min="0"
                [ngModel]="form().maxUses ?? 0"
                (ngModelChange)="updateForm('maxUses', +$event === 0 ? null : +$event)"
              />
            </div>

            <!-- Valid From -->
            <div class="db-cp__field">
              <label class="db-cp__label" for="cp-from">{{ 'coupons.field_valid_from' | translate }}</label>
              <input
                id="cp-from"
                class="db-cp__input"
                type="date"
                [ngModel]="form().validFrom"
                (ngModelChange)="updateForm('validFrom', $event)"
              />
            </div>

            <!-- Valid Until -->
            <div class="db-cp__field">
              <label class="db-cp__label" for="cp-until">{{ 'coupons.field_valid_until' | translate }}</label>
              <input
                id="cp-until"
                class="db-cp__input"
                type="date"
                [ngModel]="form().validUntil"
                (ngModelChange)="updateForm('validUntil', $event)"
              />
            </div>

            <!-- Is Active -->
            <div class="db-cp__field db-cp__field--toggle">
              <label class="db-cp__label" for="cp-active">{{ 'coupons.field_active' | translate }}</label>
              <input
                id="cp-active"
                class="db-cp__checkbox"
                type="checkbox"
                [ngModel]="form().isActive"
                (ngModelChange)="updateForm('isActive', $event)"
              />
            </div>
          </div>

          <footer class="db-cp__drawer-footer">
            <button
              class="db-cp__btn-primary"
              type="button"
              [disabled]="saving()"
              (click)="save()"
            >
              @if (saving()) { <span class="db-cp__spinner" aria-hidden="true"></span> }
              {{ 'common.save' | translate }}
            </button>
            <button class="db-cp__btn-ghost" type="button" (click)="closeForm()">
              {{ 'common.cancel' | translate }}
            </button>
          </footer>
        </aside>
      }
    </div>
  `,
  styles: [`
    .db-cp {
      padding-block: var(--space-xl, 2rem);
      padding-inline: var(--space-xl, 2rem);
      container-type: inline-size;
    }

    .db-cp__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-block-end: 1.25rem;
    }

    .db-cp__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-cp__btn-primary {
      padding-block: 0.5rem;
      padding-inline: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      background: var(--accent);
      color: var(--on-accent);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-base) ease;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }

    .db-cp__btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .db-cp__btn-primary:hover:not(:disabled) { background: var(--accent-hover); }

    .db-cp__btn-ghost {
      padding-block: 0.5rem;
      padding-inline: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text-muted);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-cp__filters {
      display: flex;
      gap: 0.375rem;
      margin-block-end: 1.25rem;
      flex-wrap: wrap;
    }

    .db-cp__filter-btn {
      padding-block: 0.375rem;
      padding-inline: 0.875rem;
      font-size: 0.8125rem;
      font-weight: 500;
      font-family: inherit;
      color: var(--text-muted);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
      cursor: pointer;
      transition: all var(--motion-fast) ease;
    }

    .db-cp__filter-btn--active {
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      color: var(--accent);
      border-color: color-mix(in srgb, var(--accent) 30%, transparent);
      font-weight: 600;
    }

    .db-cp__error-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-control);
      color: var(--error);
      font-size: 0.875rem;
      margin-block-end: 1rem;
    }

    .db-cp__close-banner {
      background: transparent;
      border: none;
      color: var(--error);
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
    }

    .db-cp__table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow-x: auto;
    }

    .db-cp__table {
      inline-size: 100%;
      min-inline-size: 720px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-cp__thead { background: var(--surface-alt); border-block-end: 1px solid var(--border); }

    .db-cp__th {
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

    .db-cp__th--num { text-align: end; }
    .db-cp__th--actions { inline-size: 140px; }

    .db-cp__row {
      border-block-end: 1px solid var(--border);
      transition: background-color var(--motion-fast) ease;
    }

    .db-cp__row:last-child { border-block-end: none; }
    .db-cp__row:hover { background: var(--surface-alt); }

    .db-cp__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem 0.5rem;
      vertical-align: middle;
      color: var(--text);
      white-space: nowrap;
    }

    .db-cp__td--num { text-align: end; }
    .db-cp__td--actions { text-align: end; padding-inline-end: 0.875rem; }

    .db-cp__code { font-weight: 700; font-family: monospace; font-size: 0.875rem; letter-spacing: 0.04em; color: var(--text); }
    .db-cp__value { font-weight: 600; font-variant-numeric: tabular-nums; }
    .db-cp__usage { color: var(--text-muted); font-size: 0.8125rem; }
    .db-cp__min { color: var(--text-muted); font-variant-numeric: tabular-nums; }
    .db-cp__valid { color: var(--text-muted); font-size: 0.8125rem; }

    .db-cp__type-badge {
      display: inline-flex;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
      background: color-mix(in srgb, var(--muted) 12%, transparent);
      color: var(--text-muted);
    }

    .db-cp__type-badge[data-type='percentage'] { background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent); }
    .db-cp__type-badge[data-type='fixed'] { background: color-mix(in srgb, var(--success) 10%, transparent); color: var(--success); }
    .db-cp__type-badge[data-type='free_delivery'] { background: color-mix(in srgb, var(--info) 10%, transparent); color: var(--info); }

    .db-cp__status-badge {
      display: inline-flex;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .db-cp__status-badge[data-status='active'] { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success); }
    .db-cp__status-badge[data-status='expired'] { background: color-mix(in srgb, var(--error) 10%, transparent); color: var(--error); }
    .db-cp__status-badge[data-status='paused'] { background: color-mix(in srgb, var(--warning) 12%, transparent); color: var(--warning); }

    .db-cp__row-actions { display: flex; align-items: center; gap: 0.375rem; justify-content: flex-end; }

    .db-cp__toggle-btn, .db-cp__edit-btn, .db-cp__delete-btn {
      padding-block: 0.25rem;
      padding-inline: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-cp__toggle-btn {
      background: color-mix(in srgb, var(--muted) 10%, transparent);
      color: var(--text-muted);
      border: 1px solid var(--border);
    }

    .db-cp__edit-btn {
      background: color-mix(in srgb, var(--accent) 8%, transparent);
      color: var(--accent);
      border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
    }

    .db-cp__delete-btn {
      background: color-mix(in srgb, var(--error) 8%, transparent);
      color: var(--error);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
    }

    .db-cp__sk {
      display: inline-block;
      block-size: 14px;
      inline-size: 80px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-cp-shimmer 1.4s infinite;
    }

    @keyframes db-cp-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .db-cp__empty { padding-block: 3rem; text-align: center; color: var(--text-muted); }
    .db-cp__table-error { display: flex; align-items: center; justify-content: center; gap: 0.625rem; padding-block: 2rem; color: var(--error); }
    .db-cp__retry { padding-block: 0.3125rem; padding-inline: 0.75rem; font-size: 0.8125rem; font-weight: 600; font-family: inherit; background: var(--accent); color: var(--on-accent); border: none; border-radius: var(--radius-control); cursor: pointer; }

    .db-cp__sr { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }

    /* Drawer */
    .db-cp__overlay {
      position: fixed;
      inset: 0;
      background: var(--overlay-scrim, rgba(0,0,0,0.4));
      z-index: 200;
    }

    .db-cp__drawer {
      position: fixed;
      inset-block: 0;
      inset-inline-end: 0;
      inline-size: min(480px, 100vw);
      background: var(--surface);
      border-inline-start: 1px solid var(--border);
      z-index: 201;
      display: flex;
      flex-direction: column;
      box-shadow: -8px 0 32px rgba(0,0,0,0.12);
    }

    [dir='rtl'] .db-cp__drawer {
      inset-inline-end: auto;
      inset-inline-start: 0;
      border-inline-start: none;
      border-inline-end: 1px solid var(--border);
      box-shadow: 8px 0 32px rgba(0,0,0,0.12);
    }

    .db-cp__drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-block-end: 1px solid var(--border);
      flex-shrink: 0;
    }

    .db-cp__drawer-title { font-size: 1rem; font-weight: 700; color: var(--text); margin: 0; }

    .db-cp__close-btn {
      inline-size: 2rem;
      block-size: 2rem;
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1rem;
      border-radius: var(--radius-control);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .db-cp__drawer-body { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .db-cp__drawer-footer { padding: 1rem 1.5rem; border-block-start: 1px solid var(--border); display: flex; gap: 0.75rem; flex-shrink: 0; }

    .db-cp__field { display: flex; flex-direction: column; gap: 0.375rem; }
    .db-cp__field--toggle { flex-direction: row; align-items: center; gap: 0.75rem; }

    .db-cp__label { font-size: 0.875rem; font-weight: 600; color: var(--text); }
    .db-cp__hint { font-size: 0.8125rem; color: var(--text-subtle); margin: 0; }

    .db-cp__input {
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.5rem;
      padding-inline: 0.75rem;
      outline: none;
      block-size: 38px;
      box-sizing: border-box;
      transition: border-color var(--motion-base) ease;
    }

    .db-cp__input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent); }

    .db-cp__select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 0.625rem) 50%;
      padding-inline-end: 2rem;
      cursor: pointer;
    }

    .db-cp__code-row { display: flex; gap: 0.5rem; }
    .db-cp__code-row .db-cp__input { flex: 1; }

    .db-cp__gen-btn {
      padding-block: 0.5rem;
      padding-inline: 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--accent);
      background: color-mix(in srgb, var(--accent) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
      border-radius: var(--radius-control);
      cursor: pointer;
      white-space: nowrap;
    }

    .db-cp__checkbox { inline-size: 18px; block-size: 18px; cursor: pointer; accent-color: var(--accent); }

    .db-cp__spinner {
      display: inline-block;
      inline-size: 14px;
      block-size: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-block-start-color: var(--on-accent);
      border-radius: 50%;
      animation: db-cp-spin 0.7s linear infinite;
    }

    @keyframes db-cp-spin { to { transform: rotate(360deg); } }
  `],
})
export class CouponsComponent implements OnInit {
  private readonly couponsService = inject(CouponsService);

  readonly allCoupons = signal<Coupon[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly statusFilter = signal('');
  readonly form = signal<CouponForm>(emptyCouponForm());

  readonly statusFilters = [
    { value: '', labelKey: 'coupons.filter_all' },
    { value: 'active', labelKey: 'coupons.filter_active' },
    { value: 'expired', labelKey: 'coupons.filter_expired' },
    { value: 'paused', labelKey: 'coupons.filter_paused' },
  ];

  readonly filteredCoupons = computed(() => {
    const status = this.statusFilter();
    const all = this.allCoupons();
    if (!status) return all;
    return all.filter((c) => this.couponStatus(c) === status);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.couponsService.getAll().subscribe({
      next: (data) => {
        this.allCoupons.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  openAdd(): void {
    this.form.set(emptyCouponForm());
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEdit(coupon: Coupon): void {
    this.form.set({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxUses: coupon.maxUses,
      validFrom: coupon.validFrom ? coupon.validFrom.substring(0, 10) : '',
      validUntil: coupon.validUntil ? coupon.validUntil.substring(0, 10) : '',
      isActive: coupon.isActive,
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.form.set(emptyCouponForm());
    this.formError.set(null);
  }

  updateForm<K extends keyof CouponForm>(key: K, value: CouponForm[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  autoGenerate(): void {
    this.updateForm('code', generateCode());
  }

  save(): void {
    const f = this.form();
    if (!f.code.trim()) {
      this.formError.set('Coupon code is required.');
      return;
    }

    const body: CouponRequest = {
      code: f.code.trim().toUpperCase(),
      discountType: f.discountType,
      discountValue: f.discountValue,
      minOrderAmount: f.minOrderAmount,
      maxUses: f.maxUses,
      validFrom: f.validFrom || null,
      validUntil: f.validUntil || null,
      isActive: f.isActive,
    };

    this.saving.set(true);
    this.formError.set(null);

    const obs = f.id
      ? this.couponsService.update(f.id, body)
      : this.couponsService.create(body);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.formError.set(err?.error?.message ?? 'An error occurred.');
        this.saving.set(false);
      },
    });
  }

  toggleCoupon(id: string): void {
    this.couponsService.toggle(id).subscribe({
      next: (updated) => {
        this.allCoupons.update((list) =>
          list.map((c) => (c.id === id ? updated : c))
        );
      },
    });
  }

  deleteCoupon(id: string): void {
    if (!confirm('Delete this coupon?')) return;
    this.couponsService.delete(id).subscribe({
      next: () => {
        this.allCoupons.update((list) => list.filter((c) => c.id !== id));
      },
    });
  }

  couponStatus(coupon: Coupon): string {
    if (!coupon.isActive) return 'paused';
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) return 'expired';
    return 'active';
  }

  couponStatusKey(coupon: Coupon): string {
    const s = this.couponStatus(coupon);
    const map: Record<string, string> = {
      active: 'coupons.status_active',
      expired: 'coupons.status_expired',
      paused: 'coupons.status_paused',
    };
    return map[s] ?? s;
  }

  discountTypeKey(type: string): string {
    const map: Record<string, string> = {
      percentage: 'coupons.type_percentage',
      fixed: 'coupons.type_fixed',
      free_delivery: 'coupons.type_free_delivery',
    };
    return map[type] ?? type;
  }

  formatValue(coupon: Coupon): string {
    if (coupon.discountType === 'percentage') return coupon.discountValue + '%';
    if (coupon.discountType === 'fixed') return this.formatKd(coupon.discountValue);
    return '—';
  }

  formatKd(amount: number): string {
    return amount.toFixed(3) + ' KD';
  }

  formatValidRange(coupon: Coupon): string {
    if (!coupon.validFrom && !coupon.validUntil) return '—';
    const from = coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString() : '∞';
    const until = coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : '∞';
    return `${from} – ${until}`;
  }
}
