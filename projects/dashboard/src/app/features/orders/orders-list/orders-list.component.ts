import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { OrdersService } from '../../../core/services/orders.service';
import { OrderHubService, OrderHubNewOrderEvent } from '../../../core/services/order-hub.service';
import { LanguageToggleService } from '@shared/i18n';
import {
  OrderListItem,
  OrderFilters,
  OrderStatus,
  OrderType,
  PaymentStatus,
} from '../../../core/models/order.model';

const SHIMMER_ROWS = [1, 2, 3, 4, 5];

@Component({
  selector: 'db-orders-list',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-ol" [class.db-ol--rtl]="langToggle.isRtl()">

      <!-- Page header -->
      <header class="db-ol__header">
        <h1 class="db-ol__title">{{ 'orders.title' | translate }}</h1>
        @if (hubService.connected()) {
          <span class="db-ol__live-dot" aria-label="Live" title="Live"></span>
        }
      </header>

      <!-- Filters bar -->
      <div class="db-ol__filters" role="search">

        <!-- Search -->
        <div class="db-ol__search-wrap">
          <svg class="db-ol__search-icon" width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            #searchEl
            class="db-ol__input db-ol__search"
            type="search"
            [placeholder]="'orders.search_placeholder' | translate"
            [value]="searchInput()"
            (input)="onSearchChange(searchEl.value)"
            [attr.aria-label]="'orders.search_placeholder' | translate"
          />
        </div>

        <!-- Status filter -->
        <select
          class="db-ol__input db-ol__select"
          [ngModel]="filters().status"
          (ngModelChange)="updateFilter('status', $event)"
          [attr.aria-label]="'orders.filter_status' | translate"
        >
          <option value="">{{ 'orders.filter_status' | translate }}</option>
          <option value="new">{{ 'orders.status_new' | translate }}</option>
          <option value="confirmed">{{ 'orders.status_confirmed' | translate }}</option>
          <option value="preparing">{{ 'orders.status_preparing' | translate }}</option>
          <option value="ready">{{ 'orders.status_ready' | translate }}</option>
          <option value="out_for_delivery">{{ 'orders.status_out_for_delivery' | translate }}</option>
          <option value="delivered">{{ 'orders.status_delivered' | translate }}</option>
          <option value="cancelled">{{ 'orders.status_cancelled' | translate }}</option>
        </select>

        <!-- Order type filter -->
        <select
          class="db-ol__input db-ol__select"
          [ngModel]="filters().orderType"
          (ngModelChange)="updateFilter('orderType', $event)"
          [attr.aria-label]="'orders.filter_type' | translate"
        >
          <option value="">{{ 'orders.filter_type' | translate }}</option>
          <option value="delivery">{{ 'orders.type_delivery' | translate }}</option>
          <option value="pickup">{{ 'orders.type_pickup' | translate }}</option>
          <option value="dine_in">{{ 'orders.type_dine_in' | translate }}</option>
        </select>

        <!-- Payment status filter -->
        <select
          class="db-ol__input db-ol__select"
          [ngModel]="filters().paymentStatus"
          (ngModelChange)="updateFilter('paymentStatus', $event)"
          [attr.aria-label]="'orders.filter_payment' | translate"
        >
          <option value="">{{ 'orders.filter_payment' | translate }}</option>
          <option value="pending">{{ 'orders.payment_pending' | translate }}</option>
          <option value="paid">{{ 'orders.payment_paid' | translate }}</option>
          <option value="failed">{{ 'orders.payment_failed' | translate }}</option>
          <option value="refunded">{{ 'orders.payment_refunded' | translate }}</option>
          <option value="partially_refunded">{{ 'orders.payment_partially_refunded' | translate }}</option>
        </select>

        <!-- Date from -->
        <input
          class="db-ol__input db-ol__date"
          type="date"
          [ngModel]="filters().fromDate"
          (ngModelChange)="updateFilter('fromDate', $event)"
          [attr.aria-label]="'orders.filter_date_from' | translate"
        />

        <!-- Date to -->
        <input
          class="db-ol__input db-ol__date"
          type="date"
          [ngModel]="filters().toDate"
          (ngModelChange)="updateFilter('toDate', $event)"
          [attr.aria-label]="'orders.filter_date_to' | translate"
        />
      </div>

      <!-- Table wrapper (scrollable on mobile) -->
      <div class="db-ol__table-wrap">
        <table class="db-ol__table" role="table">
          <thead class="db-ol__thead">
            <tr>
              <th class="db-ol__th" scope="col">{{ 'orders.col_order' | translate }}</th>
              <th class="db-ol__th" scope="col">{{ 'orders.col_customer' | translate }}</th>
              <th class="db-ol__th" scope="col">{{ 'orders.col_type' | translate }}</th>
              <th class="db-ol__th db-ol__th--num" scope="col">{{ 'orders.col_items' | translate }}</th>
              <th class="db-ol__th db-ol__th--num" scope="col">{{ 'orders.col_total' | translate }}</th>
              <th class="db-ol__th" scope="col">{{ 'orders.col_payment' | translate }}</th>
              <th class="db-ol__th" scope="col">{{ 'orders.col_status' | translate }}</th>
              <th class="db-ol__th" scope="col">{{ 'orders.col_time' | translate }}</th>
              <th class="db-ol__th db-ol__th--actions" scope="col">
                <span class="db-ol__sr">{{ 'orders.col_actions' | translate }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="db-ol__tbody">

            <!-- Loading skeleton -->
            @if (loading()) {
              @for (_ of shimmerRows; track $index) {
                <tr class="db-ol__row db-ol__row--skeleton" aria-hidden="true">
                  <td class="db-ol__td"><span class="db-ol__sk db-ol__sk--order"></span></td>
                  <td class="db-ol__td"><span class="db-ol__sk db-ol__sk--customer"></span></td>
                  <td class="db-ol__td"><span class="db-ol__sk db-ol__sk--badge"></span></td>
                  <td class="db-ol__td db-ol__td--num"><span class="db-ol__sk db-ol__sk--narrow"></span></td>
                  <td class="db-ol__td db-ol__td--num"><span class="db-ol__sk db-ol__sk--narrow"></span></td>
                  <td class="db-ol__td"><span class="db-ol__sk db-ol__sk--badge"></span></td>
                  <td class="db-ol__td"><span class="db-ol__sk db-ol__sk--badge"></span></td>
                  <td class="db-ol__td"><span class="db-ol__sk db-ol__sk--narrow"></span></td>
                  <td class="db-ol__td db-ol__td--actions"></td>
                </tr>
              }
            }

            <!-- Populated rows -->
            @if (!loading()) {
              @for (order of items(); track order.orderId) {
                <tr
                  class="db-ol__row"
                  [class.db-ol__row--new]="highlightedIds().has(order.orderId)"
                  [attr.data-order-id]="order.orderId"
                >
                  <!-- Order number -->
                  <td class="db-ol__td">
                    <span class="db-ol__order-num numeric-identifier">#{{ order.orderNumber }}</span>
                  </td>

                  <!-- Customer -->
                  <td class="db-ol__td">
                    <span class="db-ol__customer-name">
                      {{ order.isGuestCustomer
                          ? ('orders.guest' | translate)
                          : order.customerName }}
                    </span>
                    @if (order.isGuestCustomer) {
                      <span class="db-ol__guest-tag">{{ 'orders.guest' | translate }}</span>
                    }
                  </td>

                  <!-- Order type -->
                  <td class="db-ol__td">
                    <span
                      class="db-ol__type-badge"
                      [attr.data-type]="order.orderType"
                    >
                      <span class="db-ol__type-dot" aria-hidden="true"></span>
                      {{ getOrderTypeKey(order.orderType) | translate }}
                    </span>
                  </td>

                  <!-- Items count -->
                  <td class="db-ol__td db-ol__td--num">
                    <span class="db-ol__items-count numeric-identifier">{{ order.itemsCount }}</span>
                  </td>

                  <!-- Total -->
                  <td class="db-ol__td db-ol__td--num">
                    <span class="db-ol__amount numeric-identifier">
                      {{ formatAmount(order.totalAmount) }}
                    </span>
                  </td>

                  <!-- Payment status -->
                  <td class="db-ol__td">
                    <span
                      class="db-ol__badge"
                      [attr.data-payment]="order.paymentStatus"
                    >{{ getPaymentKey(order.paymentStatus) | translate }}</span>
                  </td>

                  <!-- Order status -->
                  <td class="db-ol__td">
                    <span
                      class="db-ol__badge"
                      [attr.data-status]="order.status"
                    >{{ getStatusKey(order.status) | translate }}</span>
                  </td>

                  <!-- Time -->
                  <td class="db-ol__td">
                    <span class="db-ol__time numeric-identifier">{{ relativeTime(order.createdAt) }}</span>
                  </td>

                  <!-- Actions -->
                  <td class="db-ol__td db-ol__td--actions">
                    <a
                      class="db-ol__view-btn"
                      [routerLink]="['/orders', order.orderId]"
                      [attr.aria-label]="'orders.view' | translate"
                    >{{ 'orders.view' | translate }}</a>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>

        <!-- Empty state -->
        @if (!loading() && !error() && items().length === 0) {
          <div class="db-ol__empty" role="status">
            <svg class="db-ol__empty-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect x="8" y="12" width="32" height="28" rx="3" stroke="var(--border-strong)" stroke-width="2"/>
              <path d="M16 20h16M16 26h10" stroke="var(--border-strong)" stroke-width="2" stroke-linecap="round"/>
              <circle cx="36" cy="36" r="8" fill="var(--surface-alt)" stroke="var(--border-strong)" stroke-width="2"/>
              <path d="M33 36h6M36 33v6" stroke="var(--border-strong)" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p class="db-ol__empty-title">{{ 'orders.empty' | translate }}</p>
            <p class="db-ol__empty-sub">{{ 'orders.empty_sub' | translate }}</p>
          </div>
        }

        <!-- Error state -->
        @if (error() && !loading()) {
          <div class="db-ol__error" role="alert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ 'orders.error' | translate }}</span>
            <button class="db-ol__retry" type="button" (click)="reload()">
              {{ 'orders.retry' | translate }}
            </button>
          </div>
        }
      </div>

      <!-- Load more -->
      @if (!loading() && nextCursor() !== null && items().length > 0) {
        <div class="db-ol__load-more-wrap">
          <button
            class="db-ol__load-more"
            type="button"
            [disabled]="loadingMore()"
            (click)="loadMore()"
          >
            @if (loadingMore()) {
              <span class="db-ol__spinner" aria-hidden="true"></span>
            }
            {{ 'orders.load_more' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* ─── Layout ──────────────────────────────────────────────────── */
      .db-ol {
        padding-block: var(--space-xl, 2rem);
        padding-inline: var(--space-xl, 2rem);
        container-type: inline-size;
        container-name: orders-page;
      }

      /* ─── Header ──────────────────────────────────────────────────── */
      .db-ol__header {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        margin-block-end: 1.5rem;
      }

      .db-ol__title {
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
        letter-spacing: -0.025em;
        line-height: 1.3;
      }

      .db-ol__live-dot {
        display: inline-block;
        inline-size: 8px;
        block-size: 8px;
        border-radius: 50%;
        background: var(--success);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--success) 25%, transparent);
        animation: db-ol-pulse 2s ease-in-out infinite;
        flex-shrink: 0;
      }

      @keyframes db-ol-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(0.85); }
      }

      /* ─── Filters ─────────────────────────────────────────────────── */
      .db-ol__filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-block-end: 1.25rem;
        align-items: center;
      }

      .db-ol__input {
        font-family: inherit;
        font-size: 0.8125rem;
        color: var(--text);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-control);
        padding-block: 0.5rem;
        padding-inline: 0.75rem;
        outline: none;
        transition: border-color var(--motion-base) ease, box-shadow var(--motion-base) ease;
        block-size: 36px;
        box-sizing: border-box;
      }

      .db-ol__input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
      }

      .db-ol__input::placeholder {
        color: var(--text-subtle);
      }

      /* Search */
      .db-ol__search-wrap {
        position: relative;
        flex: 1;
        min-inline-size: 180px;
        max-inline-size: 280px;
      }

      .db-ol__search-icon {
        position: absolute;
        inset-block-start: 50%;
        inset-inline-start: 0.625rem;
        transform: translateY(-50%);
        color: var(--text-subtle);
        pointer-events: none;
      }

      .db-ol__search {
        inline-size: 100%;
        padding-inline-start: 2rem;
      }

      /* Select */
      .db-ol__select {
        padding-inline-end: 2rem;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: calc(100% - 0.625rem) 50%;
        cursor: pointer;
        min-inline-size: 130px;
      }

      [dir='rtl'] .db-ol__select {
        background-position: 0.625rem 50%;
        padding-inline-end: 0.75rem;
        padding-inline-start: 2rem;
      }

      /* Date inputs */
      .db-ol__date {
        min-inline-size: 130px;
        cursor: pointer;
      }

      /* ─── Table wrapper ───────────────────────────────────────────── */
      .db-ol__table-wrap {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      /* ─── Table ───────────────────────────────────────────────────── */
      .db-ol__table {
        inline-size: 100%;
        min-inline-size: 720px;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      .db-ol__thead {
        background: var(--surface-alt);
        border-block-end: 1px solid var(--border);
      }

      .db-ol__th {
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

      .db-ol__th--num {
        text-align: end;
      }

      .db-ol__th--actions {
        inline-size: 56px;
      }

      /* ─── Rows ────────────────────────────────────────────────────── */
      .db-ol__row {
        border-block-end: 1px solid var(--border);
        transition: background-color var(--motion-fast) ease;
      }

      .db-ol__row:last-child {
        border-block-end: none;
      }

      .db-ol__row:hover {
        background: var(--surface-alt);
      }

      /* New-order highlight: fades from a warning tint to transparent */
      .db-ol__row--new {
        animation: db-ol-row-highlight 3s ease-out forwards;
      }

      @keyframes db-ol-row-highlight {
        0%   { background-color: color-mix(in srgb, var(--warning) 15%, transparent); }
        100% { background-color: transparent; }
      }

      /* ─── Cells ───────────────────────────────────────────────────── */
      .db-ol__td {
        padding-block: 0.75rem;
        padding-inline: 0.875rem 0.5rem;
        vertical-align: middle;
        color: var(--text);
        white-space: nowrap;
      }

      .db-ol__td--num {
        text-align: end;
      }

      .db-ol__td--actions {
        text-align: end;
        padding-inline-end: 0.875rem;
      }

      /* ─── Cell content ────────────────────────────────────────────── */
      .db-ol__order-num {
        font-weight: 600;
        font-size: 0.8125rem;
        color: var(--accent);
      }

      .db-ol__customer-name {
        font-weight: 500;
        color: var(--text);
        max-inline-size: 140px;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: middle;
      }

      .db-ol__guest-tag {
        display: none; /* visible via customer-name fallback */
      }

      .db-ol__items-count {
        font-variant-numeric: tabular-nums;
        color: var(--text-muted);
        font-size: 0.875rem;
      }

      .db-ol__amount {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        font-size: 0.875rem;
        color: var(--text);
      }

      .db-ol__time {
        font-size: 0.8125rem;
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
      }

      /* ─── Type badge ──────────────────────────────────────────────── */
      .db-ol__type-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-muted);
      }

      .db-ol__type-dot {
        display: inline-block;
        inline-size: 7px;
        block-size: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .db-ol__type-badge[data-type='delivery'] .db-ol__type-dot {
        background: var(--accent);
      }

      .db-ol__type-badge[data-type='pickup'] .db-ol__type-dot {
        background: var(--info);
      }

      .db-ol__type-badge[data-type='dine_in'] .db-ol__type-dot {
        background: var(--success);
      }

      /* ─── Status & payment badges ─────────────────────────────────── */
      .db-ol__badge {
        display: inline-flex;
        align-items: center;
        padding-block: 0.2rem;
        padding-inline: 0.5rem;
        border-radius: var(--radius-pill);
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
      }

      /* Order status badge colors */
      .db-ol__badge[data-status='new'] {
        background: color-mix(in srgb, var(--warning) 14%, transparent);
        color: var(--warning);
        outline: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
      }

      .db-ol__badge[data-status='confirmed'] {
        background: color-mix(in srgb, var(--accent) 10%, transparent);
        color: var(--accent);
        outline: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
      }

      .db-ol__badge[data-status='preparing'] {
        background: color-mix(in srgb, var(--info) 12%, transparent);
        color: var(--info);
        outline: 1px solid color-mix(in srgb, var(--info) 25%, transparent);
      }

      .db-ol__badge[data-status='ready'] {
        background: color-mix(in srgb, var(--success) 12%, transparent);
        color: var(--success);
        outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
      }

      .db-ol__badge[data-status='out_for_delivery'] {
        background: color-mix(in srgb, var(--accent) 10%, transparent);
        color: var(--accent);
        outline: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
      }

      .db-ol__badge[data-status='delivered'] {
        background: color-mix(in srgb, var(--success) 12%, transparent);
        color: var(--success);
        outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
      }

      .db-ol__badge[data-status='cancelled'] {
        background: color-mix(in srgb, var(--danger) 10%, transparent);
        color: var(--danger);
        outline: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
      }

      /* Payment badge colors */
      .db-ol__badge[data-payment='paid'] {
        background: color-mix(in srgb, var(--success) 12%, transparent);
        color: var(--success);
        outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
      }

      .db-ol__badge[data-payment='pending'] {
        background: color-mix(in srgb, var(--warning) 14%, transparent);
        color: var(--warning);
        outline: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
      }

      .db-ol__badge[data-payment='failed'] {
        background: color-mix(in srgb, var(--danger) 10%, transparent);
        color: var(--danger);
        outline: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
      }

      .db-ol__badge[data-payment='refunded'],
      .db-ol__badge[data-payment='partially_refunded'] {
        background: color-mix(in srgb, var(--info) 12%, transparent);
        color: var(--info);
        outline: 1px solid color-mix(in srgb, var(--info) 25%, transparent);
      }

      /* ─── View button ─────────────────────────────────────────────── */
      .db-ol__view-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding-block: 0.3125rem;
        padding-inline: 0.625rem;
        font-size: 0.8125rem;
        font-weight: 600;
        font-family: inherit;
        color: var(--accent);
        background: color-mix(in srgb, var(--accent) 8%, transparent);
        border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
        border-radius: var(--radius-control);
        text-decoration: none;
        white-space: nowrap;
        transition:
          background-color var(--motion-fast) ease,
          color var(--motion-fast) ease;
      }

      .db-ol__view-btn:hover {
        background: color-mix(in srgb, var(--accent) 14%, transparent);
        color: var(--accent-hover);
      }

      /* ─── Shimmer skeleton ────────────────────────────────────────── */
      .db-ol__row--skeleton {
        pointer-events: none;
      }

      .db-ol__sk {
        display: inline-block;
        block-size: 14px;
        border-radius: 4px;
        background: linear-gradient(
          90deg,
          var(--border) 25%,
          var(--surface-alt) 50%,
          var(--border) 75%
        );
        background-size: 200% 100%;
        animation: db-shimmer 1.4s infinite;
      }

      .db-ol__sk--order    { inline-size: 72px; }
      .db-ol__sk--customer { inline-size: 110px; }
      .db-ol__sk--badge    { inline-size: 68px; block-size: 20px; border-radius: 999px; }
      .db-ol__sk--narrow   { inline-size: 44px; }

      @keyframes db-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* ─── Empty state ─────────────────────────────────────────────── */
      .db-ol__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding-block: 4rem 3.5rem;
        gap: 0.75rem;
        text-align: center;
      }

      .db-ol__empty-icon {
        color: var(--border-strong);
        opacity: 0.7;
      }

      .db-ol__empty-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text);
        margin: 0;
      }

      .db-ol__empty-sub {
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin: 0;
        max-inline-size: 36ch;
        line-height: 1.55;
      }

      /* ─── Error state ─────────────────────────────────────────────── */
      .db-ol__error {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.625rem;
        padding-block: 2.5rem;
        color: var(--danger);
        font-size: 0.875rem;
        font-weight: 500;
      }

      .db-ol__retry {
        padding-block: 0.3125rem;
        padding-inline: 0.75rem;
        font-size: 0.8125rem;
        font-weight: 600;
        font-family: inherit;
        background: var(--accent);
        color: var(--on-accent);
        border: none;
        border-radius: var(--radius-control);
        cursor: pointer;
        transition: background-color var(--motion-base) ease;
      }

      .db-ol__retry:hover {
        background: var(--accent-hover);
      }

      /* ─── Load more ───────────────────────────────────────────────── */
      .db-ol__load-more-wrap {
        display: flex;
        justify-content: center;
        margin-block-start: 1.25rem;
      }

      .db-ol__load-more {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding-block: 0.5625rem;
        padding-inline: 1.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        font-family: inherit;
        color: var(--text);
        background: var(--surface);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-control);
        cursor: pointer;
        transition:
          background-color var(--motion-fast) ease,
          border-color var(--motion-fast) ease;
      }

      .db-ol__load-more:hover:not(:disabled) {
        background: var(--surface-alt);
        border-color: var(--accent);
      }

      .db-ol__load-more:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      /* Spinner for load-more */
      .db-ol__spinner {
        display: inline-block;
        inline-size: 14px;
        block-size: 14px;
        border: 2px solid var(--border);
        border-block-start-color: var(--accent);
        border-radius: 50%;
        animation: db-ol-spin 0.7s linear infinite;
        flex-shrink: 0;
      }

      @keyframes db-ol-spin {
        to { transform: rotate(360deg); }
      }

      /* ─── Screen-reader only ──────────────────────────────────────── */
      .db-ol__sr {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      }

      /* ─── Responsive ──────────────────────────────────────────────── */

      /* Compact filters on wide screens */
      @container orders-page (min-width: 1024px) {
        .db-ol__filters {
          flex-wrap: nowrap;
        }

        .db-ol__search-wrap {
          max-inline-size: 240px;
        }

        .db-ol__select {
          min-inline-size: 120px;
        }

        .db-ol__date {
          min-inline-size: 120px;
        }
      }

      /* Tighten up on tablet */
      @container orders-page (max-width: 768px) {
        .db-ol {
          padding-inline: 1rem;
          padding-block: 1.25rem;
        }

        .db-ol__filters {
          row-gap: 0.5rem;
        }

        .db-ol__search-wrap {
          max-inline-size: 100%;
          flex-basis: 100%;
        }
      }

      /* Small mobile */
      @container orders-page (max-width: 480px) {
        .db-ol {
          padding-inline: 0.75rem;
        }

        .db-ol__title {
          font-size: 1.125rem;
        }

        .db-ol__select,
        .db-ol__date {
          flex: 1;
          min-inline-size: 100px;
        }
      }
    `,
  ],
})
export class OrdersListComponent implements OnInit, OnDestroy {
  private readonly ordersService = inject(OrdersService);
  readonly hubService = inject(OrderHubService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly langToggle = inject(LanguageToggleService);

  // ── State signals ──────────────────────────────────────────────────────────
  readonly items = signal<OrderListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly nextCursor = signal<string | null>(null);
  readonly loadingMore = signal(false);

  /** Filters currently applied (bound to UI). */
  readonly filters = signal<{
    search: string;
    status: string;
    orderType: string;
    paymentStatus: string;
    fromDate: string;
    toDate: string;
  }>({
    search: '',
    status: '',
    orderType: '',
    paymentStatus: '',
    fromDate: '',
    toDate: '',
  });

  /** Separate signal for the search input so debounce can run before filter update. */
  readonly searchInput = signal('');

  /** Set of order IDs currently highlighted (newly arrived via SignalR). */
  readonly highlightedIds = signal<Set<string>>(new Set());

  // ── Internal ───────────────────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();
  readonly shimmerRows = SHIMMER_ROWS;

  /** Tracks which SignalR event arrays we've already processed (by length). */
  private lastNewOrderCount = 0;
  private lastStatusChangedCount = 0;

  constructor() {
    // Effects must be created in the injection context (constructor).
    // Watch new orders from SignalR hub signal.
    effect(() => {
      const events = this.hubService.newOrderEvents();
      if (events.length > this.lastNewOrderCount) {
        const freshEvents = events.slice(0, events.length - this.lastNewOrderCount);
        this.lastNewOrderCount = events.length;
        this.handleNewOrders(freshEvents.map((e) => this.mapHubEventToListItem(e)));
      }
    }, { allowSignalWrites: true });

    // Watch status-changed events from SignalR hub signal.
    effect(() => {
      const events = this.hubService.statusChangedEvents();
      if (events.length > this.lastStatusChangedCount) {
        const freshEvents = events.slice(0, events.length - this.lastStatusChangedCount);
        this.lastStatusChangedCount = events.length;
        this.handleStatusChanges(freshEvents);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.hubService.connect();

    // Debounced search input → update filters + URL + reload
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.filters.update((f) => ({ ...f, search: value }));
        this.updateUrlParams({ search: value || null, cursor: null });
        this.reload();
      });

    // Sync URL query params → filters → load.
    // ActivatedRoute is observable-based; we bridge it here rather than via effect().
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const next = {
        search:        params['search']        ?? '',
        status:        params['status']        ?? '',
        orderType:     params['orderType']     ?? '',
        paymentStatus: params['paymentStatus'] ?? '',
        fromDate:      params['fromDate']      ?? '',
        toDate:        params['toDate']        ?? '',
      };
      this.filters.set(next);
      this.searchInput.set(next.search);
      this.reload();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.hubService.disconnect();
  }

  // ── Search debounce ────────────────────────────────────────────────────────
  onSearchChange(value: string): void {
    this.searchInput.set(value);
    this.searchSubject.next(value);
  }

  // ── Filter sync ────────────────────────────────────────────────────────────
  updateFilter(
    key: 'search' | 'status' | 'orderType' | 'paymentStatus' | 'fromDate' | 'toDate',
    value: string,
  ): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    this.updateUrlParams({ [key]: value || null, cursor: null });
    this.reload();
  }

  private updateUrlParams(patch: Record<string, string | null>): void {
    const current = this.route.snapshot.queryParams;
    const merged: Record<string, string | null> = { ...current, ...patch };
    // Remove null / empty-string keys
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(merged)) {
      if (v != null && v !== '') cleaned[k] = v;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cleaned,
      replaceUrl: true,
    });
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  reload(): void {
    this.loading.set(true);
    this.error.set(false);
    this.nextCursor.set(null);

    const f = this.filters();
    const apiFilters: OrderFilters = {
      ...(f.search        ? { search:        f.search }        : {}),
      ...(f.status        ? { status:        f.status }        : {}),
      ...(f.orderType     ? { orderType:     f.orderType }     : {}),
      ...(f.paymentStatus ? { paymentStatus: f.paymentStatus } : {}),
      ...(f.fromDate      ? { fromUtc:       f.fromDate }      : {}),
      ...(f.toDate        ? { toUtc:         f.toDate }        : {}),
      limit: 25,
    };

    this.ordersService.getOrders(apiFilters).subscribe({
      next: (result) => {
        this.items.set(result.items);
        this.nextCursor.set(result.nextCursor);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loadingMore()) return;

    this.loadingMore.set(true);
    const f = this.filters();
    const apiFilters: OrderFilters = {
      ...(f.search        ? { search:        f.search }        : {}),
      ...(f.status        ? { status:        f.status }        : {}),
      ...(f.orderType     ? { orderType:     f.orderType }     : {}),
      ...(f.paymentStatus ? { paymentStatus: f.paymentStatus } : {}),
      ...(f.fromDate      ? { fromUtc:       f.fromDate }      : {}),
      ...(f.toDate        ? { toUtc:         f.toDate }        : {}),
      cursor,
      limit: 25,
    };

    this.ordersService.getOrders(apiFilters).subscribe({
      next: (result) => {
        this.items.update((prev) => [...prev, ...result.items]);
        this.nextCursor.set(result.nextCursor);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  // ── Real-time handlers ─────────────────────────────────────────────────────
  private handleNewOrders(newItems: OrderListItem[]): void {
    // Prepend new items and add to highlight set
    this.items.update((prev) => [...newItems, ...prev]);

    const ids = new Set<string>(this.highlightedIds());
    for (const item of newItems) {
      ids.add(item.orderId);
    }
    this.highlightedIds.set(ids);

    // Remove highlights after 3s
    for (const item of newItems) {
      setTimeout(() => {
        this.highlightedIds.update((set) => {
          const next = new Set(set);
          next.delete(item.orderId);
          return next;
        });
      }, 3000);
    }
  }

  private handleStatusChanges(
    events: Array<{ orderId: string; newStatus: OrderStatus }>
  ): void {
    this.items.update((prev) =>
      prev.map((order) => {
        const event = events.find((e) => e.orderId === order.orderId);
        return event ? { ...order, status: event.newStatus } : order;
      })
    );
  }

  private mapHubEventToListItem(e: OrderHubNewOrderEvent): OrderListItem {
    return {
      orderId:        e.orderId,
      orderNumber:    e.orderNumber,
      status:         e.status,
      orderType:      e.orderType as OrderType,
      itemsCount:     e.itemCount,
      totalAmount:    e.total,
      createdAt:      e.createdAt,
      customerName:   e.customerName ?? '',
      customerEmail:  null,
      customerPhone:  null,
      isGuestCustomer: !e.customerName,
      paymentStatus:  'pending',
    };
  }

  // ── Formatting helpers ─────────────────────────────────────────────────────
  formatAmount(amount: number): string {
    return amount.toFixed(3) + ' KWD';
  }

  relativeTime(isoString: string): string {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return diffSec + 's';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return diffMin + 'm';
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return diffHr + 'h';
      const diffDays = Math.floor(diffHr / 24);
      return diffDays + 'd';
    } catch {
      return '—';
    }
  }

  getStatusKey(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      new:              'orders.status_new',
      confirmed:        'orders.status_confirmed',
      preparing:        'orders.status_preparing',
      ready:            'orders.status_ready',
      out_for_delivery: 'orders.status_out_for_delivery',
      delivered:        'orders.status_delivered',
      cancelled:        'orders.status_cancelled',
    };
    return map[status] ?? status;
  }

  getOrderTypeKey(type: OrderType): string {
    const map: Record<OrderType, string> = {
      delivery: 'orders.type_delivery',
      pickup:   'orders.type_pickup',
      dine_in:  'orders.type_dine_in',
    };
    return map[type] ?? type;
  }

  getPaymentKey(status: PaymentStatus): string {
    const map: Record<PaymentStatus, string> = {
      pending:             'orders.payment_pending',
      paid:                'orders.payment_paid',
      failed:              'orders.payment_failed',
      refunded:            'orders.payment_refunded',
      partially_refunded:  'orders.payment_partially_refunded',
    };
    return map[status] ?? status;
  }
}
