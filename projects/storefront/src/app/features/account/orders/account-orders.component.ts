import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { LanguageToggleService } from '@shared/i18n';
import { ApiClient, API_BASE_URL } from '@shared/api';
import { AccountService } from '../../../core/services/account.service';
import { TenantConfigService } from '../../../core/services/tenant-config.service';
import { OrderSummary } from '../../../core/models/auth.model';

@Component({
  selector: 'sf-account-orders',
  standalone: true,
  imports: [RouterLink, TranslateModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="orders">
      <h1 class="orders__title">{{ 'account.orders_title' | translate }}</h1>

      @if (loading()) {
        <div class="orders__loading">{{ 'common.loading' | translate }}</div>
      } @else if (items().length === 0) {
        <!-- Empty state -->
        <div class="orders__empty">
          <svg class="orders__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
          </svg>
          <p class="orders__empty-title">{{ 'account.no_orders' | translate }}</p>
          <p class="orders__empty-sub">{{ 'account.no_orders_sub' | translate }}</p>
          <a class="orders__cta" [routerLink]="['/', activeLang(), catalogPath()]">
            {{ 'home.shop_now' | translate }}
          </a>
        </div>
      } @else {
        <!-- Order list -->
        <div class="orders__list">
          @for (order of items(); track order.id) {
            <div class="orders__row">
              <div class="orders__row-main">
                <div class="orders__row-number">
                  {{ 'account.order_number' | translate: { number: order.orderNumber } }}
                </div>
                <div class="orders__row-date">
                  {{ 'account.order_placed' | translate: { date: (order.placedAt | date: 'mediumDate') } }}
                </div>
              </div>
              <div class="orders__row-right">
                <span class="orders__status-badge" [class]="statusClass(order.status)">
                  {{ statusLabel(order.status) | translate }}
                </span>
                <span class="orders__total">
                  {{ 'account.order_total' | translate: { amount: order.totalAmount.toFixed(3) } }}
                </span>
                <button
                  class="orders__reorder-btn"
                  type="button"
                  (click)="reorder(order)"
                >
                  {{ 'account.reorder' | translate }}
                </button>
                @if (order.status === 'delivered') {
                  <button
                    class="orders__refund-btn"
                    type="button"
                    [disabled]="refundingId() === order.id"
                    (click)="requestRefund(order)"
                  >
                    @if (refundingId() === order.id) {
                      {{ 'common.loading' | translate }}
                    } @else if (refundedIds().has(order.id)) {
                      {{ 'account.refund_requested' | translate }}
                    } @else {
                      {{ 'account.request_refund' | translate }}
                    }
                  </button>
                }
              </div>
            </div>
          }
        </div>

        @if (toastMsg()) {
          <div class="orders__toast" role="status">{{ toastMsg() | translate }}</div>
        }

        @if (hasMore()) {
          <div class="orders__more-row">
            <button
              class="orders__load-more"
              type="button"
              [disabled]="loadingMore()"
              (click)="loadMore()"
            >
              @if (loadingMore()) {
                {{ 'common.loading' | translate }}
              } @else {
                {{ 'account.load_more_orders' | translate }}
              }
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .orders {
        padding-block-end: 2rem;
      }

      .orders__title {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        margin-block-end: 1.5rem;
        letter-spacing: -0.02em;
      }

      .orders__loading {
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.6;
        font-size: 0.9375rem;
      }

      /* Empty state */
      .orders__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-block: 4rem;
        text-align: center;
        gap: 0.75rem;
      }
      .orders__empty-icon {
        inline-size: 4rem;
        block-size: 4rem;
        color: var(--color-outline-variant, #d6c4ad);
        margin-block-end: 0.5rem;
      }
      .orders__empty-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
      }
      .orders__empty-sub {
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.6;
        margin: 0;
      }
      .orders__cta {
        margin-block-start: 0.5rem;
        display: inline-block;
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        padding-block: 0.625rem;
        padding-inline: 1.5rem;
        border-radius: var(--border-radius-full, 9999px);
        font-size: 0.875rem;
        font-weight: 700;
        text-decoration: none;
        transition: opacity 0.2s;
      }
      .orders__cta:hover { opacity: 0.9; }

      /* Order list */
      .orders__list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .orders__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        background: #fff;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        padding-block: 1rem;
        padding-inline: 1.25rem;
        flex-wrap: wrap;
      }

      .orders__row-main {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .orders__row-number {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
      }

      .orders__row-date {
        font-size: 0.8125rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.6;
      }

      .orders__row-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      /* Status badge */
      .orders__status-badge {
        display: inline-block;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding-block: 0.2rem;
        padding-inline: 0.625rem;
        border-radius: var(--border-radius-full, 9999px);
        white-space: nowrap;
      }
      .orders__status-badge--warning {
        background: #fef9c3;
        color: var(--color-warning, #b45309);
      }
      .orders__status-badge--primary {
        background: rgba(128, 86, 0, 0.12);
        color: var(--color-primary);
      }
      .orders__status-badge--success {
        background: #dcfce7;
        color: var(--color-success, #16a34a);
      }
      .orders__status-badge--error {
        background: #fef2f2;
        color: var(--color-error, #dc2626);
      }

      .orders__total {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        white-space: nowrap;
      }

      .orders__reorder-btn {
        background: transparent;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-full, 9999px);
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-primary);
        padding-block: 0.3rem;
        padding-inline: 0.875rem;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
        white-space: nowrap;
      }
      .orders__reorder-btn:hover {
        background: var(--color-surface-container, #f4ede5);
      }

      /* Toast */
      .orders__toast {
        margin-block-start: 1rem;
        background: #fef2f2;
        color: var(--color-error, #dc2626);
        border: 1px solid #fecaca;
        border-radius: var(--border-radius-md, 8px);
        padding-block: 0.625rem;
        padding-inline: 1rem;
        font-size: 0.875rem;
      }

      .orders__more-row {
        display: flex;
        justify-content: center;
        margin-block-start: 1.5rem;
      }

      .orders__load-more {
        background: transparent;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-full, 9999px);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
        padding-block: 0.625rem;
        padding-inline: 2rem;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
      }
      .orders__load-more:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .orders__load-more:not(:disabled):hover {
        background: var(--color-surface-container, #f4ede5);
      }

      .orders__refund-btn {
        background: transparent;
        border: 1.5px solid #fecaca;
        border-radius: var(--border-radius-full, 9999px);
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-error, #dc2626);
        padding-block: 0.3rem;
        padding-inline: 0.875rem;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
        white-space: nowrap;
      }
      .orders__refund-btn:hover:not(:disabled) {
        background: #fef2f2;
      }
      .orders__refund-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class AccountOrdersComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly apiClient = inject(ApiClient);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly lang = inject(LanguageToggleService);
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly router = inject(Router);

  readonly activeLang = this.lang.current;

  readonly catalogPath = computed(() => {
    const type = this.tenantConfig.config()?.businessType;
    if (type === 'retail') return 'shop';
    if (type === 'service') return 'services';
    return 'menu';
  });
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly items = signal<OrderSummary[]>([]);
  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly toastMsg = signal<string>('');
  readonly refundingId = signal<string | null>(null);
  readonly refundedIds = signal<Set<string>>(new Set());

  readonly hasMore = computed(() => this.items().length < this.totalCount());

  ngOnInit(): void {
    this.loadOrders(1);
  }

  private loadOrders(page: number): void {
    this.accountService.getOrders(page, this.pageSize).subscribe({
      next: (res) => {
        const items = res?.items ?? [];
        if (page === 1) {
          this.items.set(items);
        } else {
          this.items.update((prev) => [...prev, ...items]);
        }
        this.totalCount.set(res?.totalCount ?? 0);
        this.page.set(page);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.loadOrders(this.page() + 1);
  }

  statusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'confirmed':
        return 'orders__status-badge orders__status-badge--warning';
      case 'preparing':
      case 'ready':
      case 'out_for_delivery':
        return 'orders__status-badge orders__status-badge--primary';
      case 'delivered':
        return 'orders__status-badge orders__status-badge--success';
      case 'cancelled':
      case 'rejected':
        return 'orders__status-badge orders__status-badge--error';
      default:
        return 'orders__status-badge orders__status-badge--warning';
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'account.order_status_pending',
      confirmed: 'account.order_status_confirmed',
      preparing: 'account.order_status_preparing',
      ready: 'account.order_status_ready',
      out_for_delivery: 'account.order_status_out_for_delivery',
      delivered: 'account.order_status_delivered',
      cancelled: 'account.order_status_cancelled',
      rejected: 'account.order_status_rejected',
    };
    return map[status.toLowerCase()] ?? 'account.order_status_pending';
  }

  reorder(order: OrderSummary): void {
    this.toastMsg.set('');
    this.http
      .post(`${this.baseUrl}/storefront/orders/${order.id}/reorder`, {}, { withCredentials: true })
      .subscribe({
        next: () => this.router.navigate(['/', this.activeLang(), 'cart']),
        error: () => {
          this.toastMsg.set('account.reorder_unavailable');
          setTimeout(() => this.toastMsg.set(''), 3500);
        },
      });
  }

  requestRefund(order: OrderSummary): void {
    if (this.refundedIds().has(order.id)) return;
    this.refundingId.set(order.id);
    this.apiClient
      .post<unknown>(`/storefront/orders/${order.id}/refund-request`, {})
      .subscribe({
        next: () => {
          this.refundingId.set(null);
          this.refundedIds.update((ids) => new Set([...ids, order.id]));
        },
        error: () => {
          this.refundingId.set(null);
          this.toastMsg.set('account.refund_error');
          setTimeout(() => this.toastMsg.set(''), 3500);
        },
      });
  }
}
