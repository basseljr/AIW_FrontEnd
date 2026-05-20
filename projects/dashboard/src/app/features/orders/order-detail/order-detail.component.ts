import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { OrdersService } from '../../../core/services/orders.service';
import {
  OrderDetail,
  OrderLineItem,
  OrderStatus,
  ParsedAddress,
} from '../../../core/models/order.model';

/** All possible statuses in display order */
const DELIVERY_FLOW: OrderStatus[] = [
  'new',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
];

const PICKUP_FLOW: OrderStatus[] = [
  'new',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
];

interface TimelineStep {
  status: OrderStatus;
  state: 'completed' | 'current' | 'future';
  timestamp: string | null;
}

@Component({
  selector: 'db-order-detail',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page wrapper -->
    <div class="od-page">

      <!-- ─── Page header ─────────────────────────────────────────── -->
      <header class="od-page__header">
        <div class="od-page__header-start">
          <button
            class="od-back-btn"
            type="button"
            (click)="goBack()"
            [attr.aria-label]="'order_detail.back' | translate"
          >
            <svg class="icon-flip-rtl" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>

          <div class="od-page__title-group">
            <h1 class="od-page__title">
              @if (order()) {
                {{ 'order_detail.title' | translate }}
                <span class="od-order-number numeric-identifier">#{{ order()!.orderNumber }}</span>
              } @else {
                {{ 'order_detail.title' | translate }}
              }
            </h1>
            @if (order()) {
              <div class="od-page__meta">
                <span
                  class="od-status-badge"
                  [attr.data-status]="order()!.status"
                >
                  {{ 'orders.status_' + order()!.status | translate }}
                </span>
                <span class="od-page__meta-sep" aria-hidden="true">·</span>
                <span class="od-page__placed-at">
                  {{ formatDateTime(order()!.createdAt) }}
                </span>
              </div>
            }
          </div>
        </div>

        <div class="od-page__header-end">
          @if (order()) {
            <button
              class="od-btn od-btn--ghost"
              type="button"
              (click)="printReceipt()"
              [attr.aria-label]="'order_detail.print' | translate"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              {{ 'order_detail.print' | translate }}
            </button>
          }
        </div>
      </header>

      <!-- ─── Success banner ──────────────────────────────────────── -->
      @if (showSuccessBanner()) {
        <div class="od-banner od-banner--success" role="status" aria-live="polite">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          {{ 'order_detail.update_success' | translate }}
        </div>
      }

      <!-- ─── Update error banner ─────────────────────────────────── -->
      @if (updateError()) {
        <div class="od-banner od-banner--error" role="alert" aria-live="assertive">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          {{ 'order_detail.update_error' | translate }}
        </div>
      }

      <!-- ─── Loading skeleton ────────────────────────────────────── -->
      @if (loading()) {
        <div class="od-skeleton-layout" aria-busy="true" [attr.aria-label]="'order_detail.title' | translate">
          <div class="od-skeleton-col-main">
            <div class="od-card od-card--skeleton">
              <div class="od-skel od-skel--h2"></div>
              <div class="od-skel od-skel--body"></div>
              <div class="od-skel od-skel--body od-skel--short"></div>
            </div>
            <div class="od-card od-card--skeleton">
              <div class="od-skel od-skel--h2"></div>
              <div class="od-skel od-skel--row"></div>
              <div class="od-skel od-skel--row"></div>
              <div class="od-skel od-skel--row"></div>
            </div>
          </div>
          <div class="od-skeleton-col-side">
            <div class="od-card od-card--skeleton">
              <div class="od-skel od-skel--h2"></div>
              <div class="od-skel od-skel--timeline"></div>
            </div>
          </div>
        </div>
      }

      <!-- ─── Error state ─────────────────────────────────────────── -->
      @if (!loading() && error()) {
        <div class="od-empty-state" role="alert">
          <div class="od-empty-state__icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <p class="od-empty-state__text">{{ 'order_detail.not_found' | translate }}</p>
          <button class="od-btn od-btn--primary" type="button" (click)="goBack()">
            {{ 'order_detail.go_back' | translate }}
          </button>
        </div>
      }

      <!-- ─── Main content ─────────────────────────────────────────── -->
      @if (!loading() && !error() && order()) {
        <div class="od-layout" id="od-printable">

          <!-- ════════════════════ LEFT COLUMN ════════════════════ -->
          <div class="od-col-main">

            <!-- Order Info card -->
            <section class="od-card" aria-labelledby="od-order-info-title">
              <h2 class="od-card__title" id="od-order-info-title">
                {{ 'order_detail.order_info' | translate }}
              </h2>
              <dl class="od-dl">
                <div class="od-dl__row">
                  <dt class="od-dl__term">{{ 'order_detail.order_number' | translate }}</dt>
                  <dd class="od-dl__def numeric-identifier">#{{ order()!.orderNumber }}</dd>
                </div>
                <div class="od-dl__row">
                  <dt class="od-dl__term">{{ 'order_detail.order_type' | translate }}</dt>
                  <dd class="od-dl__def">
                    {{ 'orders.type_' + order()!.orderType | translate }}
                  </dd>
                </div>
                <div class="od-dl__row">
                  <dt class="od-dl__term">{{ 'order_detail.placed_at' | translate }}</dt>
                  <dd class="od-dl__def">{{ formatDateTime(order()!.createdAt) }}</dd>
                </div>
                @if (order()!.branchNameEn) {
                  <div class="od-dl__row">
                    <dt class="od-dl__term">{{ 'order_detail.branch' | translate }}</dt>
                    <dd class="od-dl__def">{{ order()!.branchNameEn }}</dd>
                  </div>
                }
                @if (order()!.notes) {
                  <div class="od-dl__row">
                    <dt class="od-dl__term">{{ 'order_detail.notes' | translate }}</dt>
                    <dd class="od-dl__def od-dl__def--notes">{{ order()!.notes }}</dd>
                  </div>
                }
              </dl>
            </section>

            <!-- Customer Info card -->
            <section class="od-card" aria-labelledby="od-customer-title">
              <h2 class="od-card__title" id="od-customer-title">
                {{ 'order_detail.customer_info' | translate }}
              </h2>
              <dl class="od-dl">
                <div class="od-dl__row">
                  <dt class="od-dl__term">{{ 'order_detail.item_name' | translate : { field: '' } }}</dt>
                  <dd class="od-dl__def">
                    @if (order()!.customer.isGuestCustomer) {
                      <span class="od-badge od-badge--neutral">
                        {{ 'order_detail.guest' | translate }}
                      </span>
                    }
                    {{ order()!.customer.name }}
                  </dd>
                </div>
                @if (order()!.customer.email) {
                  <div class="od-dl__row">
                    <dt class="od-dl__term">{{ 'order_detail.email' | translate }}</dt>
                    <dd class="od-dl__def">{{ order()!.customer.email }}</dd>
                  </div>
                }
                @if (order()!.customer.phone) {
                  <div class="od-dl__row">
                    <dt class="od-dl__term">{{ 'order_detail.phone' | translate }}</dt>
                    <dd class="od-dl__def numeric-identifier">{{ order()!.customer.phone }}</dd>
                  </div>
                }
              </dl>
            </section>

            <!-- Delivery / Address Info -->
            @if (parsedAddress() && order()!.orderType === 'delivery') {
              <section class="od-card" aria-labelledby="od-delivery-title">
                <h2 class="od-card__title" id="od-delivery-title">
                  {{ 'order_detail.delivery_info' | translate }}
                </h2>
                <dl class="od-dl">
                  @if (parsedAddress()!.block) {
                    <div class="od-dl__row">
                      <dt class="od-dl__term">{{ 'order_detail.addr_block' | translate }}</dt>
                      <dd class="od-dl__def">{{ parsedAddress()!.block }}</dd>
                    </div>
                  }
                  @if (parsedAddress()!.street) {
                    <div class="od-dl__row">
                      <dt class="od-dl__term">{{ 'order_detail.addr_street' | translate }}</dt>
                      <dd class="od-dl__def">{{ parsedAddress()!.street }}</dd>
                    </div>
                  }
                  @if (parsedAddress()!.area) {
                    <div class="od-dl__row">
                      <dt class="od-dl__term">{{ 'order_detail.addr_area' | translate }}</dt>
                      <dd class="od-dl__def">{{ parsedAddress()!.area }}</dd>
                    </div>
                  }
                  @if (parsedAddress()!.apartment) {
                    <div class="od-dl__row">
                      <dt class="od-dl__term">{{ 'order_detail.addr_apartment' | translate }}</dt>
                      <dd class="od-dl__def">{{ parsedAddress()!.apartment }}</dd>
                    </div>
                  }
                  @if (parsedAddress()!.instructions) {
                    <div class="od-dl__row">
                      <dt class="od-dl__term">{{ 'order_detail.addr_instructions' | translate }}</dt>
                      <dd class="od-dl__def od-dl__def--notes">{{ parsedAddress()!.instructions }}</dd>
                    </div>
                  }
                </dl>
              </section>
            }

            @if (order()!.orderType === 'dine_in') {
              <section class="od-card od-card--dine-in" aria-labelledby="od-table-title">
                <h2 class="od-card__title" id="od-table-title">
                  {{ 'order_detail.table' | translate }}
                </h2>
                @if (parsedAddress()) {
                  <p class="od-table-info">{{ parsedAddress()!.area }}</p>
                }
              </section>
            }

            <!-- Line Items card -->
            <section class="od-card" aria-labelledby="od-items-title">
              <h2 class="od-card__title" id="od-items-title">
                {{ 'order_detail.items' | translate }}
              </h2>
              <div class="od-items">
                <div class="od-items__header" aria-hidden="true">
                  <span>{{ 'order_detail.item_name' | translate }}</span>
                  <span class="od-items__header-qty">{{ 'order_detail.item_qty' | translate }}</span>
                  <span class="od-items__header-unit">{{ 'order_detail.item_unit' | translate }}</span>
                  <span class="od-items__header-total">{{ 'order_detail.item_total' | translate }}</span>
                </div>
                @for (item of order()!.lineItems; track item.orderItemId) {
                  <div class="od-item">
                    <div class="od-item__info">
                      <span class="od-item__name">{{ itemName(item) }}</span>
                      @if (parseModifiers(item.modifiersJson).length > 0) {
                        <span class="od-item__modifiers">
                          @for (mod of parseModifiers(item.modifiersJson); track $index) {
                            <span class="od-item__modifier">{{ mod }}</span>
                          }
                        </span>
                      }
                      @if (item.notes) {
                        <span class="od-item__note">{{ item.notes }}</span>
                      }
                    </div>
                    <span class="od-item__qty">{{ item.quantity }}</span>
                    <span class="od-item__unit numeric-identifier">{{ formatCurrency(item.unitPrice, order()!.currency) }}</span>
                    <span class="od-item__total numeric-identifier">{{ formatCurrency(item.totalPrice, order()!.currency) }}</span>
                  </div>
                }
              </div>
            </section>

            <!-- Payment summary card -->
            <section class="od-card" aria-labelledby="od-payment-title">
              <h2 class="od-card__title" id="od-payment-title">
                {{ 'order_detail.payment' | translate }}
              </h2>
              <dl class="od-summary">
                <div class="od-summary__row">
                  <dt>{{ 'order_detail.subtotal' | translate }}</dt>
                  <dd class="numeric-identifier">{{ formatCurrency(order()!.subtotal, order()!.currency) }}</dd>
                </div>
                @if (order()!.deliveryFee > 0) {
                  <div class="od-summary__row">
                    <dt>{{ 'order_detail.delivery_fee' | translate }}</dt>
                    <dd class="numeric-identifier">{{ formatCurrency(order()!.deliveryFee, order()!.currency) }}</dd>
                  </div>
                }
                @if (order()!.discountAmount > 0) {
                  <div class="od-summary__row od-summary__row--discount">
                    <dt>{{ 'order_detail.discount' | translate }}</dt>
                    <dd class="numeric-identifier">-{{ formatCurrency(order()!.discountAmount, order()!.currency) }}</dd>
                  </div>
                }
                @if (order()!.incentives.couponCode) {
                  <div class="od-summary__row od-summary__row--coupon">
                    <dt>{{ 'order_detail.coupon' | translate }}</dt>
                    <dd class="od-coupon-badge">{{ order()!.incentives.couponCode }}</dd>
                  </div>
                }
                @if (order()!.incentives.walletAmountApplied > 0) {
                  <div class="od-summary__row od-summary__row--discount">
                    <dt>{{ 'order_detail.wallet_applied' | translate }}</dt>
                    <dd class="numeric-identifier">-{{ formatCurrency(order()!.incentives.walletAmountApplied, order()!.currency) }}</dd>
                  </div>
                }
                @if (order()!.incentives.loyaltyPointsRedeemed > 0) {
                  <div class="od-summary__row od-summary__row--discount">
                    <dt>{{ 'order_detail.loyalty_redeemed' | translate }}</dt>
                    <dd class="numeric-identifier">{{ order()!.incentives.loyaltyPointsRedeemed }} pts</dd>
                  </div>
                }
                @if (order()!.taxAmount > 0) {
                  <div class="od-summary__row">
                    <dt>{{ 'order_detail.tax' | translate }}</dt>
                    <dd class="numeric-identifier">{{ formatCurrency(order()!.taxAmount, order()!.currency) }}</dd>
                  </div>
                }
                <div class="od-summary__row od-summary__row--total">
                  <dt>{{ 'order_detail.total' | translate }}</dt>
                  <dd class="numeric-identifier">{{ formatCurrency(order()!.totalAmount, order()!.currency) }}</dd>
                </div>
              </dl>
            </section>

          </div><!-- /od-col-main -->

          <!-- ════════════════════ RIGHT COLUMN ════════════════════ -->
          <div class="od-col-side">

            <!-- Status Timeline card -->
            <section class="od-card" aria-labelledby="od-timeline-title">
              <h2 class="od-card__title" id="od-timeline-title">
                {{ 'order_detail.timeline' | translate }}
              </h2>
              <ol class="od-timeline" [attr.aria-label]="'order_detail.timeline' | translate">
                @for (step of timelineSteps(); track step.status; let last = $last) {
                  <li
                    class="od-timeline__step"
                    [attr.data-state]="step.state"
                    [attr.aria-current]="step.state === 'current' ? 'step' : null"
                  >
                    <div class="od-timeline__connector" [class.od-timeline__connector--hidden]="last" aria-hidden="true"></div>
                    <div class="od-timeline__dot" aria-hidden="true">
                      @if (step.state === 'completed') {
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      }
                    </div>
                    <div class="od-timeline__content">
                      <span class="od-timeline__label">
                        {{ 'orders.status_' + step.status | translate }}
                      </span>
                      @if (step.timestamp) {
                        <time class="od-timeline__time" [dateTime]="step.timestamp">
                          {{ formatDateTime(step.timestamp) }}
                        </time>
                      }
                    </div>
                  </li>
                }
              </ol>
            </section>

            <!-- Action Buttons card -->
            @if (canShowActions()) {
              <section class="od-card od-card--actions" aria-labelledby="od-actions-title">
                <h2 class="od-card__title od-sr-only" id="od-actions-title">{{ 'order_detail.actions' | translate }}</h2>

                @if (updating()) {
                  <div class="od-updating-indicator" role="status" aria-live="polite">
                    <span class="od-spinner" aria-hidden="true"></span>
                    {{ 'order_detail.updating' | translate }}
                  </div>
                }

                <div class="od-actions">
                  <!-- Primary action button per status -->
                  @switch (order()!.status) {
                    @case ('new') {
                      <button
                        class="od-btn od-btn--primary od-btn--full"
                        type="button"
                        [disabled]="updating()"
                        (click)="updateStatus('confirmed')"
                      >
                        {{ 'order_detail.confirm_order' | translate }}
                      </button>
                    }
                    @case ('confirmed') {
                      <button
                        class="od-btn od-btn--primary od-btn--full"
                        type="button"
                        [disabled]="updating()"
                        (click)="updateStatus('preparing')"
                      >
                        {{ 'order_detail.start_preparing' | translate }}
                      </button>
                    }
                    @case ('preparing') {
                      <button
                        class="od-btn od-btn--primary od-btn--full"
                        type="button"
                        [disabled]="updating()"
                        (click)="updateStatus('ready')"
                      >
                        {{ 'order_detail.mark_ready' | translate }}
                      </button>
                    }
                    @case ('ready') {
                      <button
                        class="od-btn od-btn--success od-btn--full"
                        type="button"
                        [disabled]="updating()"
                        (click)="updateStatus('delivered')"
                      >
                        {{ 'order_detail.mark_delivered' | translate }}
                      </button>
                    }
                    @default {
                      <!-- out_for_delivery: no primary action needed, just cancel -->
                    }
                  }

                  <!-- Cancel button — always visible unless terminal state -->
                  <button
                    class="od-btn od-btn--danger-outline od-btn--full"
                    type="button"
                    [disabled]="updating()"
                    (click)="openCancelModal()"
                  >
                    {{ 'order_detail.cancel_order' | translate }}
                  </button>
                </div>
              </section>
            }

          </div><!-- /od-col-side -->

        </div><!-- /od-layout -->
      }

    </div><!-- /od-page -->

    <!-- ─── Cancel Modal overlay ────────────────────────────────────── -->
    @if (showCancelModal()) {
      <div
        class="od-modal-backdrop"
        (click)="closeCancelModal()"
        (keydown.escape)="closeCancelModal()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'order_detail.cancel_title' | translate"
        tabindex="-1"
      >
        <div class="od-modal" (click)="$event.stopPropagation()">
          <header class="od-modal__header">
            <h3 class="od-modal__title">{{ 'order_detail.cancel_title' | translate }}</h3>
            <button
              class="od-modal__close-btn"
              type="button"
              [attr.aria-label]="'order_detail.cancel_dismiss' | translate"
              (click)="closeCancelModal()"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </header>

          <div class="od-modal__body">
            <label class="od-label" for="od-cancel-reason">
              {{ 'order_detail.cancel_reason_label' | translate }}
            </label>
            <textarea
              id="od-cancel-reason"
              class="ui-input ui-input--textarea"
              [placeholder]="'order_detail.cancel_reason_placeholder' | translate"
              [value]="cancelReason()"
              (input)="cancelReason.set($any($event.target).value)"
              rows="4"
            ></textarea>
          </div>

          <footer class="od-modal__footer">
            <button
              class="od-btn od-btn--ghost"
              type="button"
              [disabled]="updating()"
              (click)="closeCancelModal()"
            >
              {{ 'order_detail.cancel_dismiss' | translate }}
            </button>
            <button
              class="od-btn od-btn--danger"
              type="button"
              [disabled]="updating() || cancelReason().trim().length === 0"
              (click)="confirmCancel()"
            >
              @if (updating()) {
                <span class="od-spinner od-spinner--sm" aria-hidden="true"></span>
              }
              {{ 'order_detail.cancel_confirm' | translate }}
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [
    `
      /* ────────────────────────── Layout ─────────────────────────── */
      .od-page {
        padding: 1.5rem 2rem;
        max-inline-size: 90rem;
        margin-inline: auto;
      }

      @media (max-width: 767px) {
        .od-page {
          padding: 1rem;
        }
      }

      .od-page__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-block-end: 1.5rem;
        flex-wrap: wrap;
      }

      .od-page__header-start {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        flex: 1;
        min-inline-size: 0;
      }

      .od-page__header-end {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
      }

      .od-page__title-group {
        min-inline-size: 0;
      }

      .od-page__title {
        font-size: clamp(1.1rem, 2.5vw, 1.5rem);
        font-weight: 700;
        color: var(--text);
        margin: 0 0 0.375rem;
        letter-spacing: -0.02em;
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .od-order-number {
        font-size: 0.875em;
        color: var(--text-muted);
        font-weight: 500;
      }

      .od-page__meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .od-page__meta-sep {
        color: var(--border-strong);
        font-size: 0.75rem;
      }

      .od-page__placed-at {
        font-size: 0.8125rem;
        color: var(--text-subtle);
      }

      /* Two-column layout */
      .od-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 1.25rem;
        align-items: start;
      }

      @media (max-width: 1199px) {
        .od-layout {
          grid-template-columns: 1fr 300px;
        }
      }

      @media (max-width: 899px) {
        .od-layout {
          grid-template-columns: 1fr;
        }

        .od-col-side {
          order: -1;
        }
      }

      .od-col-main {
        display: flex;
        flex-direction: column;
        gap: 1.125rem;
      }

      .od-col-side {
        display: flex;
        flex-direction: column;
        gap: 1.125rem;
        position: sticky;
        inset-block-start: calc(3.5rem + 1.25rem);
      }

      @media (max-width: 899px) {
        .od-col-side {
          position: static;
        }
      }

      /* ────────────────────────── Card ───────────────────────────── */
      .od-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        padding: 1.25rem 1.5rem;
      }

      .od-card__title {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--text);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin: 0 0 1rem;
        padding-block-end: 0.75rem;
        border-block-end: 1px solid var(--border);
      }

      .od-card--actions {
        padding: 1.25rem;
      }

      /* ────────────────────────── Definition list ────────────────── */
      .od-dl {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .od-dl__row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.75rem;
        padding-block: 0.5625rem;
        border-block-end: 1px solid var(--border);
      }

      .od-dl__row:last-child {
        border-block-end: none;
      }

      .od-dl__term {
        font-size: 0.8125rem;
        color: var(--text-subtle);
        font-weight: 500;
        flex-shrink: 0;
      }

      .od-dl__def {
        font-size: 0.875rem;
        color: var(--text);
        font-weight: 500;
        text-align: end;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .od-dl__def--notes {
        font-size: 0.8125rem;
        color: var(--text-muted);
        text-align: start;
        font-weight: 400;
        font-style: italic;
        line-height: 1.5;
        justify-content: flex-start;
      }

      /* ────────────────────────── Line items ─────────────────────── */
      .od-items {
        display: flex;
        flex-direction: column;
      }

      .od-items__header {
        display: grid;
        grid-template-columns: 1fr 3rem 5rem 5rem;
        gap: 0.5rem;
        padding-block-end: 0.5rem;
        border-block-end: 1px solid var(--border);
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-subtle);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .od-items__header-qty,
      .od-items__header-unit,
      .od-items__header-total {
        text-align: end;
      }

      .od-item {
        display: grid;
        grid-template-columns: 1fr 3rem 5rem 5rem;
        gap: 0.5rem;
        padding-block: 0.75rem;
        border-block-end: 1px solid var(--border);
        align-items: start;
      }

      .od-item:last-child {
        border-block-end: none;
      }

      .od-item__info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .od-item__name {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text);
        line-height: 1.4;
      }

      .od-item__modifiers {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      .od-item__modifier {
        font-size: 0.75rem;
        color: var(--text-subtle);
        background: var(--surface-alt);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding-block: 0.125rem;
        padding-inline: 0.375rem;
        line-height: 1.4;
      }

      .od-item__note {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-style: italic;
        line-height: 1.4;
      }

      .od-item__qty {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text);
        text-align: end;
      }

      .od-item__unit {
        font-size: 0.8125rem;
        color: var(--text-muted);
        text-align: end;
      }

      .od-item__total {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text);
        text-align: end;
      }

      /* ────────────────────────── Payment summary ─────────────────── */
      .od-summary {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .od-summary__row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.75rem;
        padding-block: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      .od-summary__row dd {
        font-weight: 500;
        color: var(--text);
        margin: 0;
      }

      .od-summary__row dt {
        margin: 0;
      }

      .od-summary__row--discount dd {
        color: var(--success);
      }

      .od-summary__row--total {
        margin-block-start: 0.5rem;
        padding-block-start: 0.75rem;
        border-block-start: 2px solid var(--border);
        font-size: 1rem;
        font-weight: 700;
        color: var(--text);
      }

      .od-summary__row--total dd {
        font-size: 1.125rem;
        color: var(--text);
      }

      .od-coupon-badge {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--accent);
        background: color-mix(in srgb, var(--accent) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
        border-radius: var(--radius-pill);
        padding-block: 0.125rem;
        padding-inline: 0.5rem;
        letter-spacing: 0.04em;
      }

      /* ────────────────────────── Status timeline ─────────────────── */
      .od-timeline {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
      }

      .od-timeline__step {
        display: grid;
        grid-template-columns: 1.75rem 1fr;
        grid-template-rows: auto 1fr;
        gap-inline: 0.75rem;
        position: relative;
      }

      .od-timeline__connector {
        grid-column: 1;
        grid-row: 2;
        inline-size: 2px;
        min-block-size: 0.75rem;
        background: var(--border);
        margin-inline: auto;
        margin-block-start: 2px;
      }

      .od-timeline__connector--hidden {
        visibility: hidden;
      }

      .od-timeline__step[data-state='completed'] .od-timeline__connector {
        background: var(--success);
      }

      .od-timeline__step[data-state='current'] .od-timeline__connector {
        background: linear-gradient(to bottom, var(--accent), var(--border));
      }

      .od-timeline__dot {
        grid-column: 1;
        grid-row: 1;
        inline-size: 1.75rem;
        block-size: 1.75rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border: 2px solid var(--border);
        background: var(--surface-alt);
        color: var(--text-subtle);
        transition: background var(--motion-base), border-color var(--motion-base);
      }

      .od-timeline__step[data-state='completed'] .od-timeline__dot {
        background: var(--success);
        border-color: var(--success);
        color: white;
      }

      .od-timeline__step[data-state='current'] .od-timeline__dot {
        background: var(--accent);
        border-color: var(--accent);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
      }

      .od-timeline__content {
        grid-column: 2;
        grid-row: 1;
        padding-block: 0.25rem;
        padding-block-end: 0.875rem;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .od-timeline__label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-muted);
        line-height: 1.4;
      }

      .od-timeline__step[data-state='completed'] .od-timeline__label {
        color: var(--text);
      }

      .od-timeline__step[data-state='current'] .od-timeline__label {
        color: var(--accent);
        font-weight: 700;
      }

      .od-timeline__time {
        font-size: 0.75rem;
        color: var(--text-subtle);
        line-height: 1.4;
      }

      /* ────────────────────────── Actions ────────────────────────── */
      .od-actions {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }

      .od-updating-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin-block-end: 0.75rem;
      }

      /* ────────────────────────── Buttons ────────────────────────── */
      .od-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding-block: 0.625rem;
        padding-inline: 1.25rem;
        border-radius: var(--radius-control);
        font-size: 0.875rem;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        border: 1.5px solid transparent;
        transition:
          background-color var(--motion-fast),
          border-color var(--motion-fast),
          opacity var(--motion-fast),
          color var(--motion-fast);
        text-decoration: none;
        line-height: 1;
      }

      .od-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        pointer-events: none;
      }

      .od-btn--full {
        inline-size: 100%;
      }

      .od-btn--primary {
        background: var(--accent);
        color: var(--on-accent);
        border-color: var(--accent);
      }

      .od-btn--primary:hover:not(:disabled) {
        background: var(--accent-hover);
        border-color: var(--accent-hover);
      }

      .od-btn--success {
        background: var(--success);
        color: white;
        border-color: var(--success);
      }

      .od-btn--success:hover:not(:disabled) {
        filter: brightness(0.92);
      }

      .od-btn--danger {
        background: var(--danger);
        color: white;
        border-color: var(--danger);
      }

      .od-btn--danger:hover:not(:disabled) {
        filter: brightness(0.92);
      }

      .od-btn--danger-outline {
        background: transparent;
        color: var(--danger);
        border-color: color-mix(in srgb, var(--danger) 35%, transparent);
      }

      .od-btn--danger-outline:hover:not(:disabled) {
        background: color-mix(in srgb, var(--danger) 7%, transparent);
        border-color: var(--danger);
      }

      .od-btn--ghost {
        background: transparent;
        color: var(--text-muted);
        border-color: var(--border);
      }

      .od-btn--ghost:hover:not(:disabled) {
        background: var(--surface-alt);
        color: var(--text);
      }

      /* Back button */
      .od-back-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: 2.25rem;
        block-size: 2.25rem;
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: var(--radius-control);
        color: var(--text-muted);
        cursor: pointer;
        flex-shrink: 0;
        margin-block-start: 0.125rem;
        transition: background-color var(--motion-fast), color var(--motion-fast), border-color var(--motion-fast);
      }

      .od-back-btn:hover {
        background: var(--surface-alt);
        color: var(--text);
        border-color: var(--border-strong);
      }

      /* ────────────────────────── Status badge ───────────────────── */
      .od-status-badge {
        display: inline-flex;
        align-items: center;
        padding-block: 0.2rem;
        padding-inline: 0.625rem;
        border-radius: var(--radius-pill);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        background: color-mix(in srgb, var(--text-muted) 10%, transparent);
        color: var(--text-muted);
        border: 1px solid transparent;
      }

      .od-status-badge[data-status='new'] {
        background: color-mix(in srgb, var(--info) 12%, transparent);
        color: var(--info);
        border-color: color-mix(in srgb, var(--info) 25%, transparent);
      }

      .od-status-badge[data-status='confirmed'],
      .od-status-badge[data-status='preparing'] {
        background: color-mix(in srgb, var(--warning) 12%, transparent);
        color: var(--warning);
        border-color: color-mix(in srgb, var(--warning) 25%, transparent);
      }

      .od-status-badge[data-status='ready'],
      .od-status-badge[data-status='out_for_delivery'] {
        background: color-mix(in srgb, var(--accent) 12%, transparent);
        color: var(--accent);
        border-color: color-mix(in srgb, var(--accent) 25%, transparent);
      }

      .od-status-badge[data-status='delivered'] {
        background: color-mix(in srgb, var(--success) 12%, transparent);
        color: var(--success);
        border-color: color-mix(in srgb, var(--success) 25%, transparent);
      }

      .od-status-badge[data-status='cancelled'] {
        background: color-mix(in srgb, var(--danger) 10%, transparent);
        color: var(--danger);
        border-color: color-mix(in srgb, var(--danger) 20%, transparent);
      }

      /* ────────────────────────── Badges ─────────────────────────── */
      .od-badge {
        display: inline-flex;
        align-items: center;
        padding-block: 0.125rem;
        padding-inline: 0.5rem;
        border-radius: var(--radius-pill);
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .od-badge--neutral {
        background: var(--surface-alt);
        color: var(--text-subtle);
        border: 1px solid var(--border);
      }

      /* ────────────────────────── Banner ─────────────────────────── */
      .od-banner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding-block: 0.625rem;
        padding-inline: 1rem;
        border-radius: var(--radius-control);
        font-size: 0.875rem;
        font-weight: 600;
        margin-block-end: 1rem;
        animation: od-slidein 200ms ease-out both;
      }

      .od-banner--success {
        background: color-mix(in srgb, var(--success) 10%, transparent);
        color: var(--success);
        border: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
      }

      .od-banner--error {
        background: color-mix(in srgb, var(--danger) 10%, transparent);
        color: var(--danger);
        border: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
      }

      @keyframes od-slidein {
        from {
          opacity: 0;
          transform: translateY(-0.5rem);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* ────────────────────────── Spinner ────────────────────────── */
      .od-spinner {
        inline-size: 1rem;
        block-size: 1rem;
        border: 2px solid color-mix(in srgb, currentColor 25%, transparent);
        border-block-start-color: currentColor;
        border-radius: 50%;
        animation: od-spin 0.65s linear infinite;
        flex-shrink: 0;
      }

      .od-spinner--sm {
        inline-size: 0.875rem;
        block-size: 0.875rem;
      }

      @keyframes od-spin {
        to { transform: rotate(360deg); }
      }

      /* ────────────────────────── Cancel modal ───────────────────── */
      .od-modal-backdrop {
        position: fixed;
        inset: 0;
        background: var(--overlay-scrim);
        z-index: 300;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        animation: od-fadein 150ms ease-out both;
      }

      @keyframes od-fadein {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      .od-modal {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        inline-size: 100%;
        max-inline-size: 30rem;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
        animation: od-modal-pop 180ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }

      @keyframes od-modal-pop {
        from {
          opacity: 0;
          transform: scale(0.94);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .od-modal__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.125rem 1.25rem;
        border-block-end: 1px solid var(--border);
      }

      .od-modal__title {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
      }

      .od-modal__close-btn {
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
        transition: background-color var(--motion-fast), color var(--motion-fast);
        flex-shrink: 0;
      }

      .od-modal__close-btn:hover {
        background: var(--surface-alt);
        color: var(--text);
      }

      .od-modal__body {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .od-modal__footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.625rem;
        padding: 1rem 1.25rem;
        border-block-start: 1px solid var(--border);
      }

      .od-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text);
        display: block;
      }

      /* ────────────────────────── Skeleton ───────────────────────── */
      .od-skeleton-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 1.25rem;
        align-items: start;
      }

      @media (max-width: 899px) {
        .od-skeleton-layout {
          grid-template-columns: 1fr;
        }
      }

      .od-skeleton-col-main,
      .od-skeleton-col-side {
        display: flex;
        flex-direction: column;
        gap: 1.125rem;
      }

      .od-card--skeleton {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .od-skel {
        border-radius: 6px;
        background: linear-gradient(
          90deg,
          var(--border) 25%,
          var(--surface-alt) 50%,
          var(--border) 75%
        );
        background-size: 200% 100%;
        animation: od-shimmer 1.4s ease-in-out infinite;
      }

      .od-skel--h2 {
        block-size: 1.125rem;
        inline-size: 40%;
      }

      .od-skel--body {
        block-size: 0.875rem;
        inline-size: 90%;
      }

      .od-skel--short {
        inline-size: 65%;
      }

      .od-skel--row {
        block-size: 2.5rem;
      }

      .od-skel--timeline {
        block-size: 12rem;
      }

      @keyframes od-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* ────────────────────────── Empty/Error state ──────────────── */
      .od-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 4rem 2rem;
        gap: 1rem;
        color: var(--text-muted);
      }

      .od-empty-state__icon {
        color: var(--border-strong);
      }

      .od-empty-state__text {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-muted);
      }

      /* ────────────────────────── Utility ────────────────────────── */
      .od-sr-only {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      .od-table-info {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
      }

      /* ────────────────────────── Print styles ───────────────────── */
      @media print {
        :host {
          --surface: #fff;
          --text: #000;
          --border: #ccc;
        }

        .od-page__header-end,
        .od-col-side,
        .od-banner,
        .od-modal-backdrop,
        .od-back-btn,
        .od-page__meta {
          display: none !important;
        }

        .od-layout {
          display: block;
        }

        .od-page {
          padding: 0;
        }

        .od-card {
          border: none;
          border-radius: 0;
          padding: 0;
          margin-block-end: 1rem;
        }

        .od-page__title {
          font-size: 1.25rem;
        }

        .od-items__header,
        .od-item {
          page-break-inside: avoid;
        }
      }
    `,
  ],
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly langToggle = inject(LanguageToggleService);

  /** Loaded order */
  readonly order = signal<OrderDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  /** Status update */
  readonly updating = signal(false);
  readonly updateError = signal(false);
  readonly showSuccessBanner = signal(false);

  /** Cancel modal */
  readonly showCancelModal = signal(false);
  readonly cancelReason = signal('');

  /** Parsed address from JSON string */
  readonly parsedAddress = computed<ParsedAddress | null>(() => {
    const addr = this.order()?.addressJson;
    if (!addr) return null;
    try {
      return JSON.parse(addr) as ParsedAddress;
    } catch {
      return null;
    }
  });

  /** Whether we should show action buttons */
  readonly canShowActions = computed(() => {
    const status = this.order()?.status;
    return status !== 'delivered' && status !== 'cancelled';
  });

  /** Build timeline steps based on order type and current status */
  readonly timelineSteps = computed<TimelineStep[]>(() => {
    const ord = this.order();
    if (!ord) return [];

    const flow =
      ord.orderType === 'delivery' ? DELIVERY_FLOW : PICKUP_FLOW;

    const currentIdx = flow.indexOf(ord.status);

    // If status is cancelled, show completed new step then cancelled as current
    if (ord.status === 'cancelled') {
      const steps: TimelineStep[] = [
        { status: 'new', state: 'completed', timestamp: ord.createdAt },
        { status: 'cancelled', state: 'current', timestamp: ord.updatedAt },
      ];
      return steps;
    }

    return flow.map((status, idx): TimelineStep => {
      if (idx < currentIdx) {
        return { status, state: 'completed', timestamp: null };
      }
      if (idx === currentIdx) {
        return {
          status,
          state: 'current',
          timestamp: idx === 0 ? ord.createdAt : ord.updatedAt,
        };
      }
      return { status, state: 'future', timestamp: null };
    });
  });

  private successTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadOrder(id);
  }

  private loadOrder(id: string): void {
    this.loading.set(true);
    this.error.set(false);

    this.ordersService.getOrderDetail(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  updateStatus(newStatus: OrderStatus): void {
    const ord = this.order();
    if (!ord || this.updating()) return;

    this.updating.set(true);
    this.updateError.set(false);

    this.ordersService
      .updateOrderStatus(ord.orderId, { newStatus })
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.updating.set(false);
          this.triggerSuccessBanner();
        },
        error: () => {
          this.updating.set(false);
          this.updateError.set(true);
        },
      });
  }

  openCancelModal(): void {
    this.cancelReason.set('');
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
  }

  confirmCancel(): void {
    const ord = this.order();
    const reason = this.cancelReason().trim();
    if (!ord || this.updating() || !reason) return;

    this.updating.set(true);
    this.updateError.set(false);

    this.ordersService
      .updateOrderStatus(ord.orderId, {
        newStatus: 'cancelled',
        cancellationReason: reason,
      })
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.updating.set(false);
          this.showCancelModal.set(false);
          this.triggerSuccessBanner();
        },
        error: () => {
          this.updating.set(false);
          this.updateError.set(true);
          this.showCancelModal.set(false);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  printReceipt(): void {
    window.print();
  }

  itemName(item: OrderLineItem): string {
    return this.langToggle.current() === 'ar' ? item.nameAr : item.nameEn;
  }

  parseModifiers(json: string | null): string[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) return parsed as string[];
      return [];
    } catch {
      return [];
    }
  }

  formatCurrency(amount: number, currency?: string): string {
    const cur = currency ?? 'KWD';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: cur,
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
      }).format(amount);
    } catch {
      return `${amount.toFixed(3)} ${cur}`;
    }
  }

  formatDateTime(iso: string): string {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  private triggerSuccessBanner(): void {
    if (this.successTimer) clearTimeout(this.successTimer);
    this.showSuccessBanner.set(true);
    this.successTimer = setTimeout(() => {
      this.showSuccessBanner.set(false);
    }, 3000);
  }
}
