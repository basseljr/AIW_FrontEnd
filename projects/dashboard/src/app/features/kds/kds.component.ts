import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { OrdersService } from '../../core/services/orders.service';
import {
  OrderHubService,
  OrderHubNewOrderEvent,
} from '../../core/services/order-hub.service';
import { OrderListItem } from '../../core/models/order.model';

export interface KdsCard {
  orderId: string;
  orderNumber: string;
  orderType: string;
  status: 'new' | 'confirmed' | 'preparing' | 'ready';
  customerName: string;
  itemsCount: number;
  totalAmount: number;
  createdAt: string;
  isNew: boolean;
}

@Component({
  selector: 'db-kds',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Connection status bar -->
    <div class="db-kds-status-bar" [class.db-kds-status-bar--connected]="hubService.connected()" [class.db-kds-status-bar--disconnected]="!hubService.connected()">
      <span class="db-kds-status-bar__dot" aria-hidden="true"></span>
      <span class="db-kds-status-bar__label">
        @if (hubService.connected()) {
          {{ 'kds.connected' | translate }}
        } @else {
          {{ 'kds.disconnected' | translate }}
        }
      </span>
    </div>

    <!-- Full-screen KDS board -->
    <div class="db-kds">

      <!-- Header -->
      <header class="db-kds__header">
        <h1 class="db-kds__title">{{ 'kds.title' | translate }}</h1>
      </header>

      <!-- Three-column board -->
      <div class="db-kds__board">

        <!-- NEW column -->
        <section class="db-kds-col db-kds-col--new" [attr.aria-label]="'kds.col_new' | translate">
          <div class="db-kds-col__head">
            <span class="db-kds-col__name">{{ 'kds.col_new' | translate }}</span>
            <span class="db-kds-col__badge">{{ newCards().length }}</span>
          </div>
          <div class="db-kds-col__cards">
            @if (newCards().length === 0) {
              <div class="db-kds-empty">
                <span class="db-kds-empty__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                </span>
                <p class="db-kds-empty__text">{{ 'kds.empty_col' | translate }}</p>
              </div>
            }
            @for (card of newCards(); track card.orderId) {
              <article
                class="db-kds-card db-kds-card--new-col"
                [class.db-kds-card--new-arrival]="card.isNew"
              >
                <div class="db-kds-card__top">
                  <div class="db-kds-card__meta">
                    <span class="db-kds-card__number numeric-identifier">#{{ card.orderNumber }}</span>
                    <span class="db-kds-card__type-badge db-kds-card__type-badge--{{ card.orderType }}">
                      {{ getOrderTypeKey(card.orderType) | translate }}
                    </span>
                  </div>
                  <span
                    class="db-kds-card__elapsed"
                    [class.db-kds-card__elapsed--urgent]="isUrgent(card.createdAt)"
                    aria-live="polite"
                  >{{ formatElapsed(card.createdAt) }}</span>
                </div>

                <div class="db-kds-card__body">
                  <p class="db-kds-card__customer">{{ card.customerName }}</p>
                  <p class="db-kds-card__items">
                    @if (card.itemsCount === 1) {
                      {{ 'kds.items' | translate: { count: card.itemsCount } }}
                    } @else {
                      {{ 'kds.items_plural' | translate: { count: card.itemsCount } }}
                    }
                  </p>
                </div>

                <div class="db-kds-card__actions">
                  <button
                    type="button"
                    class="db-kds-btn db-kds-btn--warning"
                    (click)="advanceStatus(card, 'confirmed')"
                    [disabled]="updatingIds().has(card.orderId)"
                  >
                    @if (updatingIds().has(card.orderId)) {
                      <span class="db-kds-btn__spinner" aria-hidden="true"></span>
                    }
                    {{ 'kds.confirm' | translate }}
                  </button>
                </div>
              </article>
            }
          </div>
        </section>

        <!-- PREPARING column -->
        <section class="db-kds-col db-kds-col--prep" [attr.aria-label]="'kds.col_preparing' | translate">
          <div class="db-kds-col__head">
            <span class="db-kds-col__name">{{ 'kds.col_preparing' | translate }}</span>
            <span class="db-kds-col__badge">{{ prepCards().length }}</span>
          </div>
          <div class="db-kds-col__cards">
            @if (prepCards().length === 0) {
              <div class="db-kds-empty">
                <span class="db-kds-empty__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M12 6v6l4 2"/></svg>
                </span>
                <p class="db-kds-empty__text">{{ 'kds.empty_col' | translate }}</p>
              </div>
            }
            @for (card of prepCards(); track card.orderId) {
              <article
                class="db-kds-card db-kds-card--prep-col"
                [class.db-kds-card--new-arrival]="card.isNew"
              >
                <div class="db-kds-card__top">
                  <div class="db-kds-card__meta">
                    <span class="db-kds-card__number numeric-identifier">#{{ card.orderNumber }}</span>
                    <span class="db-kds-card__type-badge db-kds-card__type-badge--{{ card.orderType }}">
                      {{ getOrderTypeKey(card.orderType) | translate }}
                    </span>
                  </div>
                  <span
                    class="db-kds-card__elapsed"
                    [class.db-kds-card__elapsed--urgent]="isUrgent(card.createdAt)"
                    aria-live="polite"
                  >{{ formatElapsed(card.createdAt) }}</span>
                </div>

                <div class="db-kds-card__body">
                  <p class="db-kds-card__customer">{{ card.customerName }}</p>
                  <p class="db-kds-card__items">
                    @if (card.itemsCount === 1) {
                      {{ 'kds.items' | translate: { count: card.itemsCount } }}
                    } @else {
                      {{ 'kds.items_plural' | translate: { count: card.itemsCount } }}
                    }
                  </p>
                </div>

                <div class="db-kds-card__actions">
                  @if (card.status === 'confirmed') {
                    <button
                      type="button"
                      class="db-kds-btn db-kds-btn--info"
                      (click)="advanceStatus(card, 'preparing')"
                      [disabled]="updatingIds().has(card.orderId)"
                    >
                      @if (updatingIds().has(card.orderId)) {
                        <span class="db-kds-btn__spinner" aria-hidden="true"></span>
                      }
                      {{ 'kds.start' | translate }}
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="db-kds-btn db-kds-btn--success"
                      (click)="advanceStatus(card, 'ready')"
                      [disabled]="updatingIds().has(card.orderId)"
                    >
                      @if (updatingIds().has(card.orderId)) {
                        <span class="db-kds-btn__spinner" aria-hidden="true"></span>
                      }
                      {{ 'kds.ready' | translate }}
                    </button>
                  }
                </div>
              </article>
            }
          </div>
        </section>

        <!-- READY column -->
        <section class="db-kds-col db-kds-col--ready" [attr.aria-label]="'kds.col_ready' | translate">
          <div class="db-kds-col__head">
            <span class="db-kds-col__name">{{ 'kds.col_ready' | translate }}</span>
            <span class="db-kds-col__badge">{{ readyCards().length }}</span>
          </div>
          <div class="db-kds-col__cards">
            @if (readyCards().length === 0) {
              <div class="db-kds-empty">
                <span class="db-kds-empty__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                </span>
                <p class="db-kds-empty__text">{{ 'kds.empty_col' | translate }}</p>
              </div>
            }
            @for (card of readyCards(); track card.orderId) {
              <article
                class="db-kds-card db-kds-card--ready-col"
                [class.db-kds-card--new-arrival]="card.isNew"
              >
                <div class="db-kds-card__top">
                  <div class="db-kds-card__meta">
                    <span class="db-kds-card__number numeric-identifier">#{{ card.orderNumber }}</span>
                    <span class="db-kds-card__type-badge db-kds-card__type-badge--{{ card.orderType }}">
                      {{ getOrderTypeKey(card.orderType) | translate }}
                    </span>
                  </div>
                  <span
                    class="db-kds-card__elapsed"
                    [class.db-kds-card__elapsed--urgent]="isUrgent(card.createdAt)"
                    aria-live="polite"
                  >{{ formatElapsed(card.createdAt) }}</span>
                </div>

                <div class="db-kds-card__body">
                  <p class="db-kds-card__customer">{{ card.customerName }}</p>
                  <p class="db-kds-card__items">
                    @if (card.itemsCount === 1) {
                      {{ 'kds.items' | translate: { count: card.itemsCount } }}
                    } @else {
                      {{ 'kds.items_plural' | translate: { count: card.itemsCount } }}
                    }
                  </p>
                </div>

                <div class="db-kds-card__actions">
                  <div class="db-kds-card__ready-badge" [attr.aria-label]="'kds.ready' | translate">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>
                    {{ 'kds.ready' | translate }}
                  </div>
                </div>
              </article>
            }
          </div>
        </section>

      </div>
    </div>
  `,
  styles: [
    `
      /* ─── Host: dark KDS surface ─────────────────────────────────────── */
      :host {
        display: flex;
        flex-direction: column;
        min-block-size: 100dvh;
        background: var(--surface);
        --surface: #0f172a;
        --surface-alt: #1e293b;
        --surface-card: #1e293b;
        --text: #f8fafc;
        --text-muted: #94a3b8;
        --text-subtle: #64748b;
        --border: rgba(148, 163, 184, 0.12);
        --border-card: rgba(148, 163, 184, 0.18);
        --warning: #f59e0b;
        --info: #0ea5e9;
        --success: #22c55e;
        --danger: #ef4444;
        --radius-card: 12px;
        --radius-control: 8px;
        overflow-x: hidden;
      }

      /* ─── Connection status bar ──────────────────────────────────────── */
      .db-kds-status-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding-block: 0.375rem;
        padding-inline: 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        background: rgba(15, 23, 42, 0.9);
        border-block-end: 1px solid var(--border);
        position: sticky;
        inset-block-start: 0;
        z-index: 20;
        backdrop-filter: blur(8px);
      }

      .db-kds-status-bar__dot {
        display: inline-block;
        inline-size: 8px;
        block-size: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .db-kds-status-bar--connected .db-kds-status-bar__dot {
        background: var(--success);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--success) 30%, transparent);
        animation: kds-dot-pulse 2s ease infinite;
      }

      .db-kds-status-bar--connected .db-kds-status-bar__label {
        color: var(--success);
      }

      .db-kds-status-bar--disconnected .db-kds-status-bar__dot {
        background: var(--warning);
        animation: kds-dot-blink 1s step-end infinite;
      }

      .db-kds-status-bar--disconnected .db-kds-status-bar__label {
        color: var(--warning);
      }

      @keyframes kds-dot-pulse {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.4; }
      }

      @keyframes kds-dot-blink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0; }
      }

      /* ─── Main layout ────────────────────────────────────────────────── */
      .db-kds {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        gap: 1rem;
        overflow-y: auto;
      }

      /* ─── Header ─────────────────────────────────────────────────────── */
      .db-kds__header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-block-end: 0.25rem;
      }

      .db-kds__title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
        letter-spacing: -0.01em;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      /* ─── Board (three columns) ──────────────────────────────────────── */
      .db-kds__board {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        align-items: start;
      }

      @media (max-width: 767px) {
        .db-kds__board {
          grid-template-columns: 1fr;
        }
      }

      /* ─── Column ─────────────────────────────────────────────────────── */
      .db-kds-col {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        min-block-size: 0;
      }

      .db-kds-col--new {
        border-block-start: 3px solid var(--warning);
      }

      .db-kds-col--prep {
        border-block-start: 3px solid var(--info);
      }

      .db-kds-col--ready {
        border-block-start: 3px solid var(--success);
      }

      .db-kds-col__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-block: 0.75rem;
        padding-inline: 0.25rem;
      }

      .db-kds-col__name {
        font-size: 0.8125rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }

      .db-kds-col--new .db-kds-col__name    { color: var(--warning); }
      .db-kds-col--prep .db-kds-col__name   { color: var(--info); }
      .db-kds-col--ready .db-kds-col__name  { color: var(--success); }

      .db-kds-col__badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-inline-size: 1.5rem;
        block-size: 1.5rem;
        padding-inline: 0.375rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        line-height: 1;
      }

      .db-kds-col--new  .db-kds-col__badge  { background: color-mix(in srgb, var(--warning) 20%, transparent); color: var(--warning); }
      .db-kds-col--prep .db-kds-col__badge  { background: color-mix(in srgb, var(--info) 20%, transparent);    color: var(--info); }
      .db-kds-col--ready .db-kds-col__badge { background: color-mix(in srgb, var(--success) 20%, transparent); color: var(--success); }

      .db-kds-col__cards {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      /* ─── Empty state ────────────────────────────────────────────────── */
      .db-kds-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding-block: 3rem;
        color: var(--text-subtle);
        border: 1px dashed var(--border-card);
        border-radius: var(--radius-card);
      }

      .db-kds-empty__icon {
        inline-size: 2.5rem;
        block-size: 2.5rem;
        opacity: 0.4;
      }

      .db-kds-empty__icon svg {
        inline-size: 100%;
        block-size: 100%;
      }

      .db-kds-empty__text {
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        opacity: 0.6;
      }

      /* ─── Card ───────────────────────────────────────────────────────── */
      .db-kds-card {
        background: var(--surface-card);
        border: 1px solid var(--border-card);
        border-radius: var(--radius-card);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        transition: transform 150ms ease, box-shadow 150ms ease;
      }

      .db-kds-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      /* Column-specific left accent bar */
      .db-kds-card--new-col   { border-inline-start: 3px solid var(--warning); }
      .db-kds-card--prep-col  { border-inline-start: 3px solid var(--info); }
      .db-kds-card--ready-col { border-inline-start: 3px solid var(--success); }

      /* New-arrival pulse animation */
      .db-kds-card--new-arrival {
        animation: kds-pulse 0.6s ease 2;
      }

      @keyframes kds-pulse {
        0%, 100% { box-shadow: none; }
        50%       { box-shadow: 0 0 0 4px color-mix(in srgb, var(--warning) 30%, transparent); }
      }

      /* ─── Card top row ───────────────────────────────────────────────── */
      .db-kds-card__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .db-kds-card__meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .db-kds-card__number {
        font-size: 1rem;
        font-weight: 800;
        color: var(--text);
        letter-spacing: -0.01em;
      }

      .db-kds-card__type-badge {
        display: inline-flex;
        align-items: center;
        padding-block: 0.125rem;
        padding-inline: 0.5rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .db-kds-card__type-badge--delivery {
        background: color-mix(in srgb, var(--info) 15%, transparent);
        color: var(--info);
      }

      .db-kds-card__type-badge--pickup {
        background: color-mix(in srgb, var(--warning) 15%, transparent);
        color: var(--warning);
      }

      .db-kds-card__type-badge--dine_in {
        background: color-mix(in srgb, var(--success) 15%, transparent);
        color: var(--success);
      }

      /* ─── Elapsed time ───────────────────────────────────────────────── */
      .db-kds-card__elapsed {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--text-muted);
        flex-shrink: 0;
        font-variant-numeric: tabular-nums;
        padding-block: 0.1875rem;
        padding-inline: 0.5rem;
        border-radius: 6px;
        background: color-mix(in srgb, var(--text-muted) 10%, transparent);
        transition: background-color 200ms, color 200ms;
      }

      .db-kds-card__elapsed--urgent {
        background: color-mix(in srgb, var(--danger) 18%, transparent);
        color: var(--danger);
        animation: kds-elapsed-throb 1.5s ease infinite;
      }

      @keyframes kds-elapsed-throb {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.6; }
      }

      /* ─── Card body ──────────────────────────────────────────────────── */
      .db-kds-card__body {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .db-kds-card__customer {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .db-kds-card__items {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--text-muted);
        font-weight: 500;
      }

      /* ─── Card actions ───────────────────────────────────────────────── */
      .db-kds-card__actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .db-kds-btn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4375rem;
        padding-block: 0.5625rem;
        padding-inline: 1rem;
        border: none;
        border-radius: var(--radius-control);
        font-size: 0.875rem;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: opacity 150ms ease, transform 100ms ease;
        letter-spacing: 0.01em;
      }

      .db-kds-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
      }

      .db-kds-btn:not(:disabled):hover  { opacity: 0.88; }
      .db-kds-btn:not(:disabled):active { transform: scale(0.97); }

      .db-kds-btn--warning {
        background: var(--warning);
        color: var(--surface);
      }

      .db-kds-btn--info {
        background: var(--info);
        color: var(--text);
      }

      .db-kds-btn--success {
        background: var(--success);
        color: var(--surface);
      }

      /* ─── Spinner inside button ──────────────────────────────────────── */
      .db-kds-btn__spinner {
        display: inline-block;
        inline-size: 0.875rem;
        block-size: 0.875rem;
        border: 2px solid currentColor;
        border-block-start-color: transparent;
        border-radius: 50%;
        animation: kds-spin 0.65s linear infinite;
        flex-shrink: 0;
      }

      @keyframes kds-spin {
        to { transform: rotate(360deg); }
      }

      /* ─── Ready badge ────────────────────────────────────────────────── */
      .db-kds-card__ready-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding-block: 0.5rem;
        padding-inline: 0.875rem;
        border-radius: var(--radius-control);
        background: color-mix(in srgb, var(--success) 15%, transparent);
        color: var(--success);
        font-size: 0.875rem;
        font-weight: 700;
        border: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
      }

      .db-kds-card__ready-badge svg {
        inline-size: 1rem;
        block-size: 1rem;
        flex-shrink: 0;
      }
    `,
  ],
})
export class KdsComponent implements OnInit, OnDestroy {
  private readonly ordersService = inject(OrdersService);
  readonly hubService = inject(OrderHubService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly kdsCards = signal<KdsCard[]>([]);
  readonly updatingIds = signal<Set<string>>(new Set());

  private intervalId: ReturnType<typeof setInterval> | null = null;

  /** Computed: cards in the New column (status === 'new'), sorted oldest first */
  readonly newCards = computed(() =>
    this.kdsCards()
      .filter((c) => c.status === 'new')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  );

  /** Computed: cards in the Preparing column (confirmed OR preparing), sorted oldest first */
  readonly prepCards = computed(() =>
    this.kdsCards()
      .filter((c) => c.status === 'confirmed' || c.status === 'preparing')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  );

  /** Computed: cards in the Ready column (status === 'ready'), sorted oldest first */
  readonly readyCards = computed(() =>
    this.kdsCards()
      .filter((c) => c.status === 'ready')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  );

  constructor() {
    // React to new order events from SignalR
    effect(() => {
      const events = this.hubService.newOrderEvents();
      if (events.length === 0) return;

      const latest = events[0];
      const existingIndex = this.kdsCards().findIndex((c) => c.orderId === latest.orderId);
      if (existingIndex !== -1) return; // already tracked

      const newCard = this.buildCardFromHubEvent(latest);

      this.kdsCards.update((cards) => [newCard, ...cards]);
      this.playBeep();

      // Clear isNew flag after 3 seconds
      setTimeout(() => {
        this.kdsCards.update((cards) =>
          cards.map((c) => (c.orderId === newCard.orderId ? { ...c, isNew: false } : c)),
        );
      }, 3000);
    }, { allowSignalWrites: true });

    // React to status changed events from SignalR
    effect(() => {
      const events = this.hubService.statusChangedEvents();
      if (events.length === 0) return;

      const latest = events[0];
      const targetStatus = latest.newStatus;

      const terminalStatuses: string[] = ['delivered', 'out_for_delivery', 'cancelled'];

      if (terminalStatuses.includes(targetStatus)) {
        // Remove card entirely
        this.kdsCards.update((cards) => cards.filter((c) => c.orderId !== latest.orderId));
        return;
      }

      if (['new', 'confirmed', 'preparing', 'ready'].includes(targetStatus)) {
        this.kdsCards.update((cards) =>
          cards.map((c) =>
            c.orderId === latest.orderId
              ? { ...c, status: targetStatus as KdsCard['status'] }
              : c,
          ),
        );
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadInitialOrders();
    this.hubService.connect();

    // Tick every second to keep elapsed time fresh (OnPush needs manual trigger)
    this.intervalId = setInterval(() => {
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.hubService.disconnect();
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  private loadInitialOrders(): void {
    forkJoin({
      newOrders: this.ordersService.getOrders({ status: 'new', limit: 50 }),
      confirmedOrders: this.ordersService.getOrders({ status: 'confirmed', limit: 50 }),
      preparingOrders: this.ordersService.getOrders({ status: 'preparing', limit: 50 }),
    }).subscribe({
      next: ({ newOrders, confirmedOrders, preparingOrders }) => {
        const all: KdsCard[] = [
          ...newOrders.items.map((o) => this.buildCardFromListItem(o, 'new')),
          ...confirmedOrders.items.map((o) => this.buildCardFromListItem(o, 'confirmed')),
          ...preparingOrders.items.map((o) => this.buildCardFromListItem(o, 'preparing')),
        ];
        this.kdsCards.set(all);
      },
      error: () => {
        // Silent: kdsCards stays empty — board shows empty columns
      },
    });
  }

  // ── Status transitions ────────────────────────────────────────────────────

  advanceStatus(card: KdsCard, nextStatus: KdsCard['status']): void {
    if (this.updatingIds().has(card.orderId)) return;

    this.updatingIds.update((s) => new Set([...s, card.orderId]));

    this.ordersService
      .updateOrderStatus(card.orderId, { newStatus: nextStatus })
      .subscribe({
        next: () => {
          this.kdsCards.update((cards) =>
            cards.map((c) =>
              c.orderId === card.orderId ? { ...c, status: nextStatus } : c,
            ),
          );
          this.updatingIds.update((s) => {
            const next = new Set(s);
            next.delete(card.orderId);
            return next;
          });
        },
        error: () => {
          this.updatingIds.update((s) => {
            const next = new Set(s);
            next.delete(card.orderId);
            return next;
          });
        },
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildCardFromListItem(
    item: OrderListItem,
    status: KdsCard['status'],
  ): KdsCard {
    return {
      orderId: item.orderId,
      orderNumber: item.orderNumber,
      orderType: item.orderType,
      status,
      customerName: item.customerName || '—',
      itemsCount: item.itemsCount,
      totalAmount: item.totalAmount,
      createdAt: item.createdAt,
      isNew: false,
    };
  }

  private buildCardFromHubEvent(event: OrderHubNewOrderEvent): KdsCard {
    const status: KdsCard['status'] = ['new', 'confirmed', 'preparing', 'ready'].includes(
      event.status,
    )
      ? (event.status as KdsCard['status'])
      : 'new';

    return {
      orderId: event.orderId,
      orderNumber: event.orderNumber,
      orderType: event.orderType,
      status,
      customerName: event.customerName || '—',
      itemsCount: event.itemCount,
      totalAmount: event.total,
      createdAt: event.createdAt,
      isNew: true,
    };
  }

  formatElapsed(createdAt: string): string {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const totalSec = Math.max(0, Math.floor(diffMs / 1000));
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  isUrgent(createdAt: string): boolean {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return diffMs > 15 * 60 * 1000; // > 15 minutes
  }

  getOrderTypeKey(orderType: string): string {
    const map: Record<string, string> = {
      delivery: 'kds.type_delivery',
      pickup: 'kds.type_pickup',
      dine_in: 'kds.type_dine_in',
    };
    return map[orderType] ?? 'kds.type_delivery';
  }

  private playBeep(): void {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      /* ignore if no audio context */
    }
  }
}
