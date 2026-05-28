import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { PaymentsService } from '../../core/services/payments.service';
import {
  PaymentFilters,
  PaymentListResult,
  PaymentSummary,
  PaymentTransaction,
  PaymentTransactionDetail,
} from '../../core/models/payments.model';

const DEFAULT_FILTERS: PaymentFilters = {
  startDate: '',
  endDate: '',
  method: '',
  status: '',
  search: '',
  page: 1,
  pageSize: 25,
};

@Component({
  selector: 'db-payments',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="db-pay">
  <header class="db-pay__header">
    <h1 class="db-pay__title">{{ 'payments_page.title' | translate }}</h1>
  </header>

  <!-- Summary Cards -->
  <div class="db-pay__summary-grid">
    @if (loading()) {
      @for (_ of [1,2,3,4]; track $index) {
        <div class="db-pay__card db-pay__card--sk" aria-hidden="true">
          <span class="db-pay__sk db-pay__sk--label"></span>
          <span class="db-pay__sk db-pay__sk--value"></span>
        </div>
      }
    } @else if (summary()) {
      <div class="db-pay__card">
        <p class="db-pay__card-label">{{ 'payments_page.total_revenue' | translate }}</p>
        <p class="db-pay__card-value">{{ formatKwd(summary()!.totalRevenue) }}</p>
      </div>
      <div class="db-pay__card">
        <p class="db-pay__card-label">{{ 'payments_page.successful_transactions' | translate }}</p>
        <p class="db-pay__card-value db-pay__card-value--success">{{ summary()!.successfulCount }}</p>
      </div>
      <div class="db-pay__card">
        <p class="db-pay__card-label">{{ 'payments_page.failed_transactions' | translate }}</p>
        <p class="db-pay__card-value db-pay__card-value--danger">{{ summary()!.failedCount }}</p>
      </div>
      <div class="db-pay__card">
        <p class="db-pay__card-label">{{ 'payments_page.refunds_issued' | translate }}</p>
        <p class="db-pay__card-value db-pay__card-value--warning">{{ summary()!.refundCount }}</p>
      </div>
    }
  </div>

  <!-- Filters -->
  <div class="db-pay__filters">
    <div class="db-pay__filter-row">
      <div class="db-pay__filter-group">
        <label class="db-pay__filter-label" for="pay-start">{{ 'payments_page.filter_from' | translate }}</label>
        <input
          id="pay-start"
          class="ui-input db-pay__date-input"
          type="date"
          [ngModel]="filters().startDate"
          (ngModelChange)="onFilterChange('startDate', $event)"
        />
      </div>
      <div class="db-pay__filter-group">
        <label class="db-pay__filter-label" for="pay-end">{{ 'payments_page.filter_to' | translate }}</label>
        <input
          id="pay-end"
          class="ui-input db-pay__date-input"
          type="date"
          [ngModel]="filters().endDate"
          (ngModelChange)="onFilterChange('endDate', $event)"
        />
      </div>
      <div class="db-pay__filter-group">
        <label class="db-pay__filter-label" for="pay-method">{{ 'payments_page.method' | translate }}</label>
        <select
          id="pay-method"
          class="ui-input ui-input--select"
          [ngModel]="filters().method"
          (ngModelChange)="onFilterChange('method', $event)"
        >
          <option value="">{{ 'payments_page.all_methods' | translate }}</option>
          <option value="cash">{{ 'payments_page.method_cash' | translate }}</option>
          <option value="knet">{{ 'payments_page.method_knet' | translate }}</option>
          <option value="card">{{ 'payments_page.method_card' | translate }}</option>
          <option value="tap">{{ 'payments_page.method_card' | translate }} (Tap)</option>
          <option value="myfatoorah">MyFatoorah</option>
        </select>
      </div>
      <div class="db-pay__filter-group">
        <label class="db-pay__filter-label" for="pay-status">{{ 'payments_page.status' | translate }}</label>
        <select
          id="pay-status"
          class="ui-input ui-input--select"
          [ngModel]="filters().status"
          (ngModelChange)="onFilterChange('status', $event)"
        >
          <option value="">{{ 'payments_page.all_statuses' | translate }}</option>
          <option value="paid">{{ 'payments_page.status_paid' | translate }}</option>
          <option value="pending">{{ 'payments_page.status_pending' | translate }}</option>
          <option value="failed">{{ 'payments_page.status_failed' | translate }}</option>
          <option value="refunded">{{ 'payments_page.status_refunded' | translate }}</option>
          <option value="partially_refunded">{{ 'payments_page.status_partially_refunded' | translate }}</option>
        </select>
      </div>
      <div class="db-pay__search-group">
        <label class="db-pay__filter-label" for="pay-search">{{ 'payments_page.search_label' | translate }}</label>
        <div class="db-pay__search-wrap">
          <svg class="db-pay__search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M13 13l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            id="pay-search"
            class="ui-input db-pay__search-input"
            type="search"
            [attr.placeholder]="'payments_page.search_placeholder' | translate"
            [ngModel]="filters().search"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>
      </div>
      <div class="db-pay__filter-actions">
        <button class="db-pay__export-btn" type="button" (click)="exportCsv()">
          {{ 'payments_page.export_csv' | translate }}
        </button>
      </div>
    </div>
  </div>

  <!-- Error -->
  @if (error()) {
    <div class="db-pay__error" role="alert">
      {{ 'payments_page.load_error' | translate }}
      <button class="db-pay__retry" type="button" (click)="loadPayments()">
        {{ 'common.retry' | translate }}
      </button>
    </div>
  }

  <!-- Table -->
  <div class="db-pay__table-wrap">
    <table class="db-pay__table" role="table">
      <thead class="db-pay__thead">
        <tr>
          <th class="db-pay__th" scope="col">{{ 'payments_page.transaction_id' | translate }}</th>
          <th class="db-pay__th" scope="col">{{ 'payments_page.order_number' | translate }}</th>
          <th class="db-pay__th" scope="col">{{ 'payments_page.customer' | translate }}</th>
          <th class="db-pay__th db-pay__th--num" scope="col">{{ 'payments_page.amount' | translate }}</th>
          <th class="db-pay__th" scope="col">{{ 'payments_page.method' | translate }}</th>
          <th class="db-pay__th" scope="col">{{ 'payments_page.status' | translate }}</th>
          <th class="db-pay__th db-pay__th--num" scope="col">{{ 'payments_page.date' | translate }}</th>
          <th class="db-pay__th db-pay__th--actions" scope="col">
            <span class="db-pay__sr">{{ 'payments_page.actions' | translate }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        @if (loading()) {
          @for (_ of [1,2,3,4,5]; track $index) {
            <tr class="db-pay__row db-pay__row--sk" aria-hidden="true">
              @for (__ of [1,2,3,4,5,6,7,8]; track $index) {
                <td class="db-pay__td"><span class="db-pay__sk db-pay__sk--cell"></span></td>
              }
            </tr>
          }
        } @else if (transactions().length === 0 && !error()) {
          <tr>
            <td class="db-pay__empty-cell" colspan="8" role="status">
              {{ 'payments_page.no_transactions' | translate }}
            </td>
          </tr>
        } @else {
          @for (tx of transactions(); track tx.id) {
            <tr class="db-pay__row" (click)="viewDetail(tx)" style="cursor:pointer">
              <td class="db-pay__td db-pay__td--code numeric-identifier">
                {{ shortId(tx.transactionId) }}
              </td>
              <td class="db-pay__td db-pay__td--code numeric-identifier">
                {{ tx.orderNumber || '—' }}
              </td>
              <td class="db-pay__td">{{ tx.customerName }}</td>
              <td class="db-pay__td db-pay__td--num numeric-identifier">{{ formatKwd(tx.amount) }}</td>
              <td class="db-pay__td">
                <span class="db-pay__method-badge" [class]="'db-pay__method-badge--' + normalizeGateway(tx.gateway)">
                  {{ translateGateway(tx.gateway) }}
                </span>
              </td>
              <td class="db-pay__td">
                <span class="db-pay__status-badge" [class]="'db-pay__status-badge--' + tx.status">
                  {{ translateStatus(tx.status) }}
                </span>
              </td>
              <td class="db-pay__td db-pay__td--num db-pay__td--date">{{ formatDate(tx.processedAt) }}</td>
              <td class="db-pay__td db-pay__td--actions">
                <button
                  class="db-pay__view-btn"
                  type="button"
                  (click)="viewDetail(tx); $event.stopPropagation()"
                >{{ 'payments_page.view_details' | translate }}</button>
              </td>
            </tr>
          }
        }
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  @if (!loading() && totalCount() > filters().pageSize) {
    <div class="db-pay__pagination">
      <span class="db-pay__page-info">
        {{ paginationLabel() }}
      </span>
      <div class="db-pay__page-btns">
        <button
          class="db-pay__page-btn"
          type="button"
          [disabled]="filters().page <= 1"
          (click)="changePage(-1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button
          class="db-pay__page-btn"
          type="button"
          [disabled]="!hasNextPage()"
          (click)="changePage(1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  }
</div>

<!-- Detail Panel -->
@if (selectedTransaction()) {
  <div class="db-pay__overlay" (click)="closeDetail()" aria-hidden="true"></div>
  <aside class="db-pay__detail-panel" role="complementary">
    <div class="db-pay__detail-header">
      <h2 class="db-pay__detail-title">{{ 'payments_page.transaction_detail' | translate }}</h2>
      <button class="db-pay__detail-close" type="button" [attr.aria-label]="'common.close' | translate" (click)="closeDetail()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div class="db-pay__detail-body">
      <dl class="db-pay__dl">
        <div class="db-pay__dl-row">
          <dt>{{ 'payments_page.transaction_id' | translate }}</dt>
          <dd class="numeric-identifier">{{ selectedTransaction()!.transactionId }}</dd>
        </div>
        @if (selectedTransaction()!.orderNumber) {
          <div class="db-pay__dl-row">
            <dt>{{ 'payments_page.order_number' | translate }}</dt>
            <dd class="numeric-identifier">{{ selectedTransaction()!.orderNumber }}</dd>
          </div>
        }
        <div class="db-pay__dl-row">
          <dt>{{ 'payments_page.customer' | translate }}</dt>
          <dd>{{ selectedTransaction()!.customerName }}</dd>
        </div>
        <div class="db-pay__dl-row">
          <dt>{{ 'payments_page.amount' | translate }}</dt>
          <dd class="numeric-identifier">{{ formatKwd(selectedTransaction()!.amount) }}</dd>
        </div>
        <div class="db-pay__dl-row">
          <dt>{{ 'payments_page.method' | translate }}</dt>
          <dd>{{ translateGateway(selectedTransaction()!.gateway) }}</dd>
        </div>
        <div class="db-pay__dl-row">
          <dt>{{ 'payments_page.operation_type' | translate }}</dt>
          <dd>{{ selectedTransaction()!.operationType }}</dd>
        </div>
        <div class="db-pay__dl-row">
          <dt>{{ 'payments_page.status' | translate }}</dt>
          <dd>
            <span class="db-pay__status-badge" [class]="'db-pay__status-badge--' + selectedTransaction()!.status">
              {{ translateStatus(selectedTransaction()!.status) }}
            </span>
          </dd>
        </div>
        @if (selectedTransaction()!.gatewayPaymentId) {
          <div class="db-pay__dl-row">
            <dt>{{ 'payments_page.gateway_payment_id' | translate }}</dt>
            <dd class="db-pay__dl-code numeric-identifier">{{ selectedTransaction()!.gatewayPaymentId }}</dd>
          </div>
        }
        @if (selectedTransaction()!.gatewayTransactionId) {
          <div class="db-pay__dl-row">
            <dt>{{ 'payments_page.gateway_transaction_id' | translate }}</dt>
            <dd class="db-pay__dl-code numeric-identifier">{{ selectedTransaction()!.gatewayTransactionId }}</dd>
          </div>
        }
        <div class="db-pay__dl-row">
          <dt>{{ 'payments_page.date' | translate }}</dt>
          <dd class="numeric-identifier">{{ formatDateFull(selectedTransaction()!.processedAt) }}</dd>
        </div>
      </dl>
    </div>
  </aside>
}
  `,
  styles: [`
    .db-pay {
      padding-block: 2rem;
      padding-inline: 2rem;
    }

    .db-pay__header { margin-block-end: 1.5rem; }

    .db-pay__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    /* Summary grid */
    .db-pay__summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
      margin-block-end: 1.5rem;
    }

    .db-pay__card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 1.125rem;
    }

    .db-pay__card--sk {
      min-block-size: 76px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.5rem;
    }

    .db-pay__card-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 0 0.25rem;
    }

    .db-pay__card-value {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      font-variant-numeric: tabular-nums;
    }

    .db-pay__card-value--success { color: var(--success); }
    .db-pay__card-value--danger  { color: var(--danger); }
    .db-pay__card-value--warning { color: var(--warning); }

    /* Skeletons */
    .db-pay__sk {
      display: block;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-pay-shimmer 1.4s infinite;
    }

    .db-pay__sk--label { block-size: 10px; inline-size: 90px; }
    .db-pay__sk--value { block-size: 28px; inline-size: 110px; }
    .db-pay__sk--cell  { block-size: 14px; inline-size: 80px; }

    @keyframes db-pay-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Filters */
    .db-pay__filters {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 1rem;
      margin-block-end: 1rem;
    }

    .db-pay__filter-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 0.75rem;
    }

    .db-pay__filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-inline-size: 130px;
    }

    .db-pay__search-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      min-inline-size: 200px;
    }

    .db-pay__filter-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .db-pay__date-input { min-inline-size: 0; }

    .db-pay__search-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .db-pay__search-icon {
      position: absolute;
      inset-inline-start: 0.625rem;
      inline-size: 1rem;
      block-size: 1rem;
      color: var(--text-subtle);
      pointer-events: none;
      flex-shrink: 0;
    }

    .db-pay__search-input {
      padding-inline-start: 2.125rem;
    }

    .db-pay__filter-actions {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      margin-inline-start: auto;
    }

    .db-pay__export-btn {
      padding-block: 0.625rem;
      padding-inline: 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      background: var(--surface);
      color: var(--text);
      cursor: pointer;
      white-space: nowrap;
      transition: background-color var(--motion-fast) ease;
    }

    .db-pay__export-btn:hover { background: var(--surface-alt); }

    /* Error */
    .db-pay__error {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: color-mix(in srgb, var(--danger) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--danger) 20%, transparent);
      border-radius: var(--radius-card);
      color: var(--danger);
      font-size: 0.875rem;
      margin-block-end: 1rem;
    }

    .db-pay__retry {
      padding-block: 0.25rem;
      padding-inline: 0.75rem;
      font-size: 0.8125rem;
      font-family: inherit;
      font-weight: 600;
      background: var(--accent);
      color: var(--on-accent);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    /* Table */
    .db-pay__table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow-x: auto;
      margin-block-end: 1rem;
    }

    .db-pay__table {
      inline-size: 100%;
      min-inline-size: 700px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-pay__thead {
      background: var(--surface-alt);
      border-block-end: 1px solid var(--border);
    }

    .db-pay__th {
      padding-block: 0.625rem;
      padding-inline: 0.875rem;
      text-align: start;
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .db-pay__th--num    { text-align: end; }
    .db-pay__th--actions { inline-size: 100px; }

    .db-pay__row { border-block-end: 1px solid var(--border); }
    .db-pay__row:last-child { border-block-end: none; }
    .db-pay__row:hover { background: var(--surface-alt); }
    .db-pay__row--sk { pointer-events: none; }

    .db-pay__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem;
      color: var(--text);
      vertical-align: middle;
    }

    .db-pay__td--code {
      font-family: monospace;
      font-size: 0.8125rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .db-pay__td--num  { text-align: end; font-variant-numeric: tabular-nums; }
    .db-pay__td--date { color: var(--text-muted); font-size: 0.8125rem; white-space: nowrap; }
    .db-pay__td--actions { text-align: end; }

    .db-pay__empty-cell {
      padding-block: 3rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    /* Method badges */
    .db-pay__method-badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.1875rem;
      padding-inline: 0.5625rem;
      border-radius: 999px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    .db-pay__method-badge--cash {
      background: color-mix(in srgb, var(--text-subtle) 12%, transparent);
      color: var(--text-subtle);
    }

    .db-pay__method-badge--knet {
      background: color-mix(in srgb, var(--info) 12%, transparent);
      color: var(--info);
    }

    .db-pay__method-badge--card,
    .db-pay__method-badge--tap,
    .db-pay__method-badge--myfatoorah {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
    }

    .db-pay__method-badge--applepay,
    .db-pay__method-badge--apple_pay {
      background: color-mix(in srgb, var(--text) 10%, transparent);
      color: var(--text);
    }

    /* Status badges */
    .db-pay__status-badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.1875rem;
      padding-inline: 0.5625rem;
      border-radius: 999px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: capitalize;
      white-space: nowrap;
    }

    .db-pay__status-badge--paid {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
    }

    .db-pay__status-badge--pending {
      background: color-mix(in srgb, var(--warning) 12%, transparent);
      color: var(--warning);
    }

    .db-pay__status-badge--failed,
    .db-pay__status-badge--cancelled,
    .db-pay__status-badge--error {
      background: color-mix(in srgb, var(--danger) 10%, transparent);
      color: var(--danger);
    }

    .db-pay__status-badge--refunded,
    .db-pay__status-badge--partially_refunded {
      background: color-mix(in srgb, var(--text-subtle) 12%, transparent);
      color: var(--text-subtle);
    }

    /* View button */
    .db-pay__view-btn {
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--accent);
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      text-decoration: none;
      white-space: nowrap;
    }

    .db-pay__view-btn:hover { text-decoration: underline; }

    /* Screen reader only */
    .db-pay__sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
    }

    /* Pagination */
    .db-pay__pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding-block: 0.5rem;
    }

    .db-pay__page-info {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .db-pay__page-btns { display: flex; gap: 0.375rem; }

    .db-pay__page-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      inline-size: 2rem;
      block-size: 2rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      background: var(--surface);
      color: var(--text-muted);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-pay__page-btn:hover:not(:disabled) { background: var(--surface-alt); color: var(--text); }
    .db-pay__page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Detail panel */
    .db-pay__overlay {
      position: fixed;
      inset: 0;
      background: var(--overlay-scrim);
      z-index: 200;
    }

    .db-pay__detail-panel {
      position: fixed;
      inset-block: 0;
      inset-inline-end: 0;
      inline-size: min(480px, 100vw);
      background: var(--surface);
      border-inline-start: 1px solid var(--border);
      z-index: 201;
      display: flex;
      flex-direction: column;
      animation: db-pay-slide-in var(--motion-base) ease;
    }

    @keyframes db-pay-slide-in {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    [dir='rtl'] .db-pay__detail-panel {
      inset-inline-end: auto;
      inset-inline-start: 0;
      border-inline-start: none;
      border-inline-end: 1px solid var(--border);
      animation-name: db-pay-slide-in-rtl;
    }

    @keyframes db-pay-slide-in-rtl {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }

    .db-pay__detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.375rem;
      border-block-end: 1px solid var(--border);
      flex-shrink: 0;
    }

    .db-pay__detail-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-pay__detail-close {
      display: flex;
      align-items: center;
      justify-content: center;
      inline-size: 2rem;
      block-size: 2rem;
      border: none;
      background: transparent;
      color: var(--text-muted);
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-pay__detail-close:hover { background: var(--surface-alt); color: var(--text); }

    .db-pay__detail-body {
      overflow-y: auto;
      flex: 1;
      padding: 1.375rem;
    }

    /* Definition list */
    .db-pay__dl { display: flex; flex-direction: column; gap: 0; }

    .db-pay__dl-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      padding-block: 0.75rem;
      border-block-end: 1px solid var(--border);
      align-items: start;
    }

    .db-pay__dl-row:last-child { border-block-end: none; }

    .db-pay__dl-row dt {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-subtle);
    }

    .db-pay__dl-row dd {
      font-size: 0.875rem;
      color: var(--text);
      margin: 0;
      word-break: break-all;
    }

    .db-pay__dl-code {
      font-family: monospace;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    @media (max-width: 640px) {
      .db-pay { padding-block: 1rem; padding-inline: 1rem; }
      .db-pay__filter-row { flex-direction: column; align-items: stretch; }
      .db-pay__filter-actions { margin-inline-start: 0; }
    }
  `],
})
export class PaymentsComponent implements OnInit {
  private readonly paymentsService = inject(PaymentsService);

  readonly transactions = signal<PaymentTransaction[]>([]);
  readonly summary = signal<PaymentSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly totalCount = signal(0);
  readonly selectedTransaction = signal<PaymentTransaction | null>(null);
  readonly filters = signal<PaymentFilters>({ ...DEFAULT_FILTERS });

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading.set(true);
    this.error.set(false);
    this.paymentsService.getPayments(this.filters()).subscribe({
      next: (result) => {
        this.transactions.set(result.items);
        this.totalCount.set(result.totalCount);
        this.summary.set({
          totalRevenue: result.totalRevenue,
          successfulCount: result.successfulCount,
          failedCount: result.failedCount,
          refundCount: result.refundCount,
          totalCount: result.totalCount,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  onFilterChange(key: keyof PaymentFilters, value: string): void {
    this.filters.update((f) => ({ ...f, [key]: value, page: 1 }));
    this.loadPayments();
  }

  onSearchChange(value: string): void {
    clearTimeout(this.searchTimeout);
    this.filters.update((f) => ({ ...f, search: value, page: 1 }));
    this.searchTimeout = setTimeout(() => this.loadPayments(), 400);
  }

  changePage(delta: number): void {
    const current = this.filters().page;
    const next = current + delta;
    if (next < 1) return;
    this.filters.update((f) => ({ ...f, page: next }));
    this.loadPayments();
  }

  hasNextPage(): boolean {
    const { page, pageSize } = this.filters();
    return page * pageSize < this.totalCount();
  }

  paginationLabel(): string {
    const { page, pageSize } = this.filters();
    const total = this.totalCount();
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}–${to} / ${total}`;
  }

  viewDetail(tx: PaymentTransaction): void {
    this.selectedTransaction.set(tx);
  }

  closeDetail(): void {
    this.selectedTransaction.set(null);
  }

  exportCsv(): void {
    const rows = this.transactions();
    if (!rows.length) return;
    const header = [
      'Transaction ID',
      'Order #',
      'Customer',
      'Amount (KWD)',
      'Gateway',
      'Operation',
      'Status',
      'Processed At',
    ];
    const csvContent = [
      header,
      ...rows.map((t) => [
        t.transactionId,
        t.orderNumber,
        t.customerName,
        t.amount.toFixed(3),
        t.gateway,
        t.operationType,
        t.status,
        t.processedAt ?? '',
      ]),
    ]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  shortId(id: string): string {
    if (!id) return '—';
    return id.length > 12 ? `${id.slice(0, 8)}…` : id;
  }

  formatKwd(value: number): string {
    if (value == null || isNaN(value)) return '—';
    return `${Number(value).toFixed(3)} KD`;
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return '—';
    }
  }

  formatDateFull(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return '—';
    }
  }

  normalizeGateway(gateway: string): string {
    return (gateway || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  translateGateway(gateway: string): string {
    const g = (gateway || '').toLowerCase();
    if (g === 'cash') return 'Cash';
    if (g === 'knet') return 'KNET';
    if (g === 'card') return 'Card';
    if (g === 'tap') return 'Card';
    if (g === 'myfatoorah') return 'Card';
    if (g === 'applepay' || g === 'apple_pay') return 'Apple Pay';
    return gateway || '—';
  }

  translateStatus(status: string): string {
    const s = (status || '').toLowerCase();
    const map: Record<string, string> = {
      paid: 'Paid',
      pending: 'Pending',
      failed: 'Failed',
      cancelled: 'Cancelled',
      error: 'Error',
      refunded: 'Refunded',
      partially_refunded: 'Part. Refunded',
    };
    return map[s] ?? status;
  }
}
