import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent, EmptyStateComponent } from '@shared/ui';
import { CheckoutService } from '../../../core/services/checkout.service';
import { OrderConfirmation } from '../../../core/models/checkout.model';

@Component({
  selector: 'sf-order-confirmation',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslateModule, SkeletonComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-confirm">
      <div class="sf-confirm__inner">
        @if (loading()) {
          <div class="sf-confirm__skeleton">
            <ui-skeleton variant="block" height="300px" />
          </div>
        } @else if (!order()) {
          <ui-empty-state
            icon="❌"
            [title]="'confirm.not_found' | translate"
          />
          <div class="sf-confirm__cta-row">
            <a class="sf-confirm__cta-btn" [routerLink]="['/', lang(), '']">{{ 'confirm.go_home' | translate }}</a>
          </div>
        } @else {
          <div class="sf-confirm__layout">
            <!-- Left: confirmation card -->
            <div class="sf-confirm__main">
              <div class="sf-confirm__card">
                <!-- Success header -->
                <div class="sf-confirm__success-row">
                  <div class="sf-confirm__check-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div>
                    <h1 class="sf-confirm__title">{{ 'confirm.order_placed' | translate }}</h1>
                    <p class="sf-confirm__sub">{{ 'confirm.order_placed_sub' | translate }}</p>
                  </div>
                </div>

                <div class="sf-confirm__divider"></div>

                <!-- Order details cards -->
                <div class="sf-confirm__info-grid">
                  <div class="sf-confirm__info-card">
                    <div class="sf-confirm__info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    </div>
                    <div>
                      <p class="sf-confirm__info-label">{{ 'confirm.order_number' | translate }}</p>
                      <p class="sf-confirm__info-value sf-confirm__info-value--primary">{{ order()!.orderNumber }}</p>
                    </div>
                  </div>
                  <div class="sf-confirm__info-card">
                    <div class="sf-confirm__info-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div>
                      <p class="sf-confirm__info-label">{{ 'confirm.estimated_time' | translate }}</p>
                      <p class="sf-confirm__info-value sf-confirm__info-value--primary">
                        @if (order()!.estimatedMinutes) {
                          {{ order()!.estimatedMinutes }} {{ 'item_detail.minutes' | translate: { count: order()!.estimatedMinutes } }}
                        } @else {
                          {{ 'confirm.eta_tbd' | translate }}
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Action buttons -->
                <div class="sf-confirm__actions">
                  <a
                    class="sf-confirm__track-btn"
                    [routerLink]="['/', lang(), 'order-tracking', order()!.orderId]"
                    [queryParams]="{ token: order()!.trackingToken }"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div>
                      <p class="sf-confirm__btn-main">{{ 'confirm.track_order' | translate }}</p>
                      <p class="sf-confirm__btn-sub">{{ 'confirm.track_order_sub' | translate }}</p>
                    </div>
                  </a>
                  <a
                    class="sf-confirm__home-btn"
                    [routerLink]="['/', lang(), '']"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <div>
                      <p class="sf-confirm__btn-main">{{ 'confirm.return_home' | translate }}</p>
                      <p class="sf-confirm__btn-sub">{{ 'confirm.return_home_sub' | translate }}</p>
                    </div>
                  </a>
                </div>

                <!-- Info notice -->
                <div class="sf-confirm__notice">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {{ 'confirm.sms_email_notice' | translate }}
                </div>
              </div>
            </div>

            <!-- Right: order summary -->
            <div class="sf-confirm__summary-col">
              <div class="sf-confirm__summary">
                <h2 class="sf-confirm__summary-title">{{ 'cart.order_summary' | translate }}</h2>

                <div class="sf-confirm__summary-items">
                  @for (item of order()!.items; track item.itemId) {
                    <div class="sf-confirm__summary-item">
                      @if (item.imageUrl) {
                        <img class="sf-confirm__summary-img" [src]="item.imageUrl" [alt]="lang() === 'ar' ? item.nameAr : item.nameEn" loading="lazy" width="64" height="64" />
                      }
                      <div class="sf-confirm__summary-item-info">
                        <p class="sf-confirm__summary-item-name">{{ lang() === 'ar' ? item.nameAr : item.nameEn }}</p>
                        <p class="sf-confirm__summary-item-qty">{{ 'checkout.qty' | translate }}: {{ item.quantity }}</p>
                      </div>
                      <span class="sf-confirm__summary-item-price">{{ item.price * item.quantity | number: '1.3-3' }}</span>
                    </div>
                  }
                </div>

                <div class="sf-confirm__summary-rows">
                  <div class="sf-confirm__summary-row">
                    <span>{{ 'cart.subtotal' | translate }}</span>
                    <span>{{ order()!.subtotal | number: '1.3-3' }} {{ 'common.currency' | translate }}</span>
                  </div>
                  <div class="sf-confirm__summary-row">
                    <span>{{ 'cart.delivery_fee' | translate }}</span>
                    <span>{{ order()!.deliveryFee | number: '1.3-3' }} {{ 'common.currency' | translate }}</span>
                  </div>
                  @if (order()!.discount > 0) {
                    <div class="sf-confirm__summary-row sf-confirm__summary-row--discount">
                      <span>{{ 'cart.discount' | translate }}</span>
                      <span>-{{ order()!.discount | number: '1.3-3' }} {{ 'common.currency' | translate }}</span>
                    </div>
                  }
                </div>
                <div class="sf-confirm__summary-divider"></div>
                <div class="sf-confirm__summary-total">
                  <span>{{ 'cart.total' | translate }}</span>
                  <span>{{ order()!.total | number: '1.3-3' }} {{ 'common.currency' | translate }}</span>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .sf-confirm {
      background: var(--color-background, #fff8f1);
      min-block-size: 80vh;
      padding-block: 2rem;
      padding-inline: 1.5rem;
    }
    .sf-confirm__inner { max-inline-size: 80rem; margin-inline: auto; }

    .sf-confirm__layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    @media (min-width: 1024px) {
      .sf-confirm__layout { grid-template-columns: 1fr minmax(0, 22rem); gap: 2.5rem; }
    }

    .sf-confirm__card {
      background: var(--color-surface, #fff);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sf-confirm__success-row {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .sf-confirm__check-circle {
      inline-size: 4rem;
      block-size: 4rem;
      border-radius: 50%;
      background: rgba(34, 197, 94, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .sf-confirm__check-circle svg { inline-size: 1.75rem; block-size: 1.75rem; color: #16a34a; }
    .sf-confirm__title { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; color: var(--color-primary, #805600); margin: 0; }
    .sf-confirm__sub { font-size: 0.9375rem; color: var(--color-on-surface-variant, #514534); margin: 0.25rem 0 0; }

    .sf-confirm__divider { block-size: 1px; background: var(--color-outline-variant, #d6c4ad); }

    .sf-confirm__info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 480px) { .sf-confirm__info-grid { grid-template-columns: 1fr; } }
    .sf-confirm__info-card {
      background: var(--color-surface-container, #f4ede5);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .sf-confirm__info-icon {
      inline-size: 2.25rem;
      block-size: 2.25rem;
      border-radius: 50%;
      background: rgba(128,86,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .sf-confirm__info-icon svg { inline-size: 1rem; block-size: 1rem; color: var(--color-primary, #805600); }
    .sf-confirm__info-label { font-size: 0.75rem; color: var(--color-on-surface-variant, #514534); margin: 0; font-weight: 500; }
    .sf-confirm__info-value { font-size: 1rem; font-weight: 800; color: var(--color-on-surface, #1e1b17); margin: 0.125rem 0 0; }
    .sf-confirm__info-value--primary { color: var(--color-primary, #805600); }

    .sf-confirm__actions { display: flex; flex-direction: column; gap: 0.875rem; max-inline-size: 26rem; }
    .sf-confirm__track-btn,
    .sf-confirm__home-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      text-decoration: none;
      transition: opacity 0.15s;
    }
    .sf-confirm__track-btn {
      background: linear-gradient(135deg, var(--color-primary-container, #f2a922), #d39207);
      box-shadow: 0 6px 16px rgba(128,86,0,0.2);
    }
    .sf-confirm__track-btn svg { inline-size: 1.25rem; block-size: 1.25rem; color: var(--color-on-primary-container, #634100); }
    .sf-confirm__track-btn .sf-confirm__btn-main { color: var(--color-on-primary-container, #634100); }
    .sf-confirm__track-btn .sf-confirm__btn-sub { color: rgba(99,65,0,0.7); }
    .sf-confirm__home-btn {
      border: 2px solid var(--color-outline-variant, #d6c4ad);
      background: var(--color-surface-container, #f4ede5);
    }
    .sf-confirm__home-btn svg { inline-size: 1.25rem; block-size: 1.25rem; color: var(--color-on-surface-variant, #514534); }
    .sf-confirm__home-btn .sf-confirm__btn-main { color: var(--color-on-surface, #1e1b17); }
    .sf-confirm__home-btn .sf-confirm__btn-sub { color: var(--color-on-surface-variant, #514534); }
    .sf-confirm__btn-main { font-size: 0.9375rem; font-weight: 700; margin: 0; }
    .sf-confirm__btn-sub { font-size: 0.75rem; margin: 0.125rem 0 0; }

    .sf-confirm__notice {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      background: rgba(34,197,94,0.07);
      border: 1px solid rgba(34,197,94,0.25);
      border-radius: 10px;
      padding: 0.875rem 1rem;
      font-size: 0.875rem;
      color: var(--color-on-surface, #1e1b17);
    }
    .sf-confirm__notice svg { inline-size: 1.125rem; block-size: 1.125rem; color: #16a34a; flex-shrink: 0; margin-block-start: 0.0625rem; }

    /* Summary */
    .sf-confirm__summary {
      background: var(--color-surface, #fff);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    @media (min-width: 1024px) {
      .sf-confirm__summary { position: sticky; inset-block-start: 5.5rem; }
    }
    .sf-confirm__summary-title { font-size: 1.25rem; font-weight: 800; color: var(--color-primary, #805600); margin: 0; }
    .sf-confirm__summary-items { display: flex; flex-direction: column; gap: 0.75rem; }
    .sf-confirm__summary-item { display: flex; align-items: center; gap: 0.75rem; }
    .sf-confirm__summary-img { inline-size: 4rem; block-size: 4rem; border-radius: 10px; object-fit: cover; }
    .sf-confirm__summary-item-info { flex: 1; min-inline-size: 0; }
    .sf-confirm__summary-item-name { font-weight: 700; font-size: 0.875rem; margin: 0; color: var(--color-on-surface, #1e1b17); }
    .sf-confirm__summary-item-qty { font-size: 0.75rem; color: var(--color-on-surface-variant, #514534); margin: 0.125rem 0 0; }
    .sf-confirm__summary-item-price { font-weight: 700; font-size: 0.875rem; color: var(--color-primary-container, #f2a922); white-space: nowrap; }
    .sf-confirm__summary-rows { display: flex; flex-direction: column; gap: 0.5rem; }
    .sf-confirm__summary-row { display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--color-on-surface-variant, #514534); }
    .sf-confirm__summary-row--discount { color: #16a34a; }
    .sf-confirm__summary-divider { block-size: 1px; background: var(--color-outline-variant, #d6c4ad); }
    .sf-confirm__summary-total { display: flex; justify-content: space-between; font-size: 1.125rem; font-weight: 900; color: var(--color-primary, #805600); }

    .sf-confirm__skeleton { border-radius: 16px; overflow: hidden; }
    .sf-confirm__cta-row { display: flex; justify-content: center; margin-block-start: 2rem; }
    .sf-confirm__cta-btn {
      display: inline-flex;
      align-items: center;
      padding-block: 0.875rem;
      padding-inline: 2rem;
      background: var(--color-primary, #805600);
      color: var(--color-on-primary, #fff);
      border-radius: 9999px;
      font-size: 1rem;
      font-weight: 700;
      text-decoration: none;
    }
  `],
})
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly checkoutService = inject(CheckoutService);
  private readonly langToggle = inject(LanguageToggleService);

  readonly lang = this.langToggle.current;
  readonly loading = signal(true);
  readonly order = signal<OrderConfirmation | null>(null);

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
    this.checkoutService.getConfirmation(orderId).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
