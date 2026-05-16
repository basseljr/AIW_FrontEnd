import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { EmptyStateComponent, SkeletonComponent } from '@shared/ui';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'sf-cart-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslateModule, EmptyStateComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-cart">
      <div class="sf-cart__inner">
        <div class="sf-cart__header">
          <h1 class="sf-cart__title">{{ 'cart.title' | translate }}</h1>
          <p class="sf-cart__subtitle">
            {{ count() === 1
              ? ('common.items_count' | translate: { count: count() })
              : ('common.items_count_plural' | translate: { count: count() }) }}
          </p>
        </div>

        @if (loading()) {
          <div class="sf-cart__layout">
            <div class="sf-cart__items-col">
              @for (_ of [1,2]; track $index) {
                <div class="sf-cart__skeleton-card">
                  <ui-skeleton variant="block" height="140px" />
                </div>
              }
            </div>
            <div class="sf-cart__summary-col">
              <ui-skeleton variant="block" height="320px" />
            </div>
          </div>
        } @else if (items().length === 0) {
          <ui-empty-state
            icon="🛒"
            [title]="'cart.empty_title' | translate"
            [description]="'cart.empty_subtitle' | translate"
          />
          <div class="sf-cart__empty-cta">
            <a class="sf-cart__cta-btn" [routerLink]="['/', lang(), 'menu']">
              {{ 'cart.start_shopping' | translate }}
            </a>
          </div>
        } @else {
          <div class="sf-cart__layout">
            <!-- Items -->
            <div class="sf-cart__items-col">
              @for (item of items(); track item.itemId) {
                <div class="sf-cart__item">
                  <div class="sf-cart__item-image-wrap">
                    @if (item.imageUrl) {
                      <img
                        class="sf-cart__item-image"
                        [src]="item.imageUrl"
                        [alt]="lang() === 'ar' ? item.nameAr : item.nameEn"
                        loading="lazy"
                        width="160"
                        height="160"
                      />
                    } @else {
                      <div class="sf-cart__item-placeholder" aria-hidden="true">🍽️</div>
                    }
                  </div>

                  <div class="sf-cart__item-body">
                    <div class="sf-cart__item-top">
                      <div>
                        <h3 class="sf-cart__item-name">
                          {{ lang() === 'ar' ? item.nameAr : item.nameEn }}
                        </h3>
                        @if (item.selectedModifiers?.length) {
                          <p class="sf-cart__item-mods">
                            @for (mod of item.selectedModifiers!; track mod.optionId) {
                              <span>{{ lang() === 'ar' ? mod.optionNameAr : mod.optionNameEn }}</span>
                            }
                          </p>
                        }
                        @if (item.specialInstructions) {
                          <p class="sf-cart__item-note">{{ item.specialInstructions }}</p>
                        }
                      </div>
                      <button
                        class="sf-cart__item-remove"
                        type="button"
                        [attr.aria-label]="'common.remove' | translate"
                        (click)="removeItem(item.itemId, item.selectedVariantId)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>

                    <div class="sf-cart__item-bottom">
                      <div class="sf-cart__qty-ctrl">
                        <button
                          class="sf-cart__qty-btn"
                          type="button"
                          [attr.aria-label]="'cart.decrease_qty' | translate"
                          (click)="updateQty(item.itemId, item.quantity - 1, item.selectedVariantId)"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                        <span class="sf-cart__qty-val" [attr.aria-label]="item.quantity + ' items'">{{ item.quantity }}</span>
                        <button
                          class="sf-cart__qty-btn"
                          type="button"
                          [attr.aria-label]="'cart.increase_qty' | translate"
                          (click)="updateQty(item.itemId, item.quantity + 1, item.selectedVariantId)"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      </div>
                      <span class="sf-cart__item-price">
                        {{ lineTotal(item) | number: '1.3-3' }} {{ 'common.currency' | translate }}
                      </span>
                    </div>
                  </div>
                </div>
              }

              <a class="sf-cart__continue-link" [routerLink]="['/', lang(), 'menu']">
                ← {{ 'cart.continue_shopping' | translate }}
              </a>
            </div>

            <!-- Summary -->
            <div class="sf-cart__summary-col">
              <div class="sf-cart__summary">
                <h2 class="sf-cart__summary-title">{{ 'cart.order_summary' | translate }}</h2>

                <div class="sf-cart__summary-rows">
                  <div class="sf-cart__summary-row">
                    <span>{{ 'cart.subtotal' | translate }}</span>
                    <span>{{ total() | number: '1.3-3' }} {{ 'common.currency' | translate }}</span>
                  </div>
                  <div class="sf-cart__summary-row">
                    <span>{{ 'cart.delivery_fee' | translate }}</span>
                    <span class="sf-cart__summary-tbd">{{ 'cart.calculated_at_checkout' | translate }}</span>
                  </div>
                </div>

                <div class="sf-cart__summary-divider"></div>

                <div class="sf-cart__summary-total">
                  <span>{{ 'cart.total' | translate }}</span>
                  <span>{{ total() | number: '1.3-3' }} {{ 'common.currency' | translate }}</span>
                </div>

                <!-- Coupon code -->
                <div class="sf-cart__coupon">
                  <label class="sf-cart__coupon-label" for="coupon">{{ 'cart.promo_code' | translate }}</label>
                  <div class="sf-cart__coupon-row">
                    <input
                      id="coupon"
                      class="sf-cart__coupon-input"
                      type="text"
                      [placeholder]="'cart.promo_code_placeholder' | translate"
                    />
                    <button class="sf-cart__coupon-btn" type="button">{{ 'cart.apply' | translate }}</button>
                  </div>
                </div>

                <a
                  class="sf-cart__checkout-btn"
                  [routerLink]="['/', lang(), 'checkout']"
                >
                  {{ 'cart.proceed_to_checkout' | translate }}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>

                <div class="sf-cart__secure">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  {{ 'cart.secure_checkout' | translate }}
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .sf-cart {
      background: var(--color-background, #fff8f1);
      min-block-size: 80vh;
      padding-block: 2rem;
      padding-inline: 1.5rem;
    }
    .sf-cart__inner {
      max-inline-size: 80rem;
      margin-inline: auto;
    }
    .sf-cart__header {
      margin-block-end: 2rem;
    }
    .sf-cart__title {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      color: var(--color-primary, #805600);
      margin: 0 0 0.25rem;
      letter-spacing: -0.02em;
    }
    .sf-cart__subtitle {
      color: var(--color-on-surface-variant, #514534);
      margin: 0;
      font-size: 0.9375rem;
    }

    .sf-cart__layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    @media (min-width: 1024px) {
      .sf-cart__layout {
        grid-template-columns: 1fr minmax(0, 22rem);
        gap: 2.5rem;
      }
    }

    .sf-cart__items-col {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .sf-cart__item {
      background: var(--color-surface, #ffffff);
      border-radius: 16px;
      padding: 1rem 1.25rem;
      display: flex;
      gap: 1rem;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    }
    @media (min-width: 480px) {
      .sf-cart__item {
        gap: 1.5rem;
        padding: 1.25rem 1.5rem;
      }
    }

    .sf-cart__item-image-wrap {
      flex-shrink: 0;
      inline-size: 100px;
      block-size: 100px;
      border-radius: 12px;
      overflow: hidden;
      background: var(--color-surface-container, #f4ede5);
    }
    @media (min-width: 480px) {
      .sf-cart__item-image-wrap {
        inline-size: 140px;
        block-size: 140px;
      }
    }
    .sf-cart__item-image {
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }
    .sf-cart__item-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      inline-size: 100%;
      block-size: 100%;
      font-size: 2.5rem;
    }

    .sf-cart__item-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .sf-cart__item-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .sf-cart__item-name {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--color-on-surface, #1e1b17);
      margin: 0 0 0.25rem;
      line-height: 1.3;
    }
    .sf-cart__item-mods {
      font-size: 0.8125rem;
      color: var(--color-on-surface-variant, #514534);
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.5rem;
    }
    .sf-cart__item-note {
      font-size: 0.8125rem;
      color: var(--color-on-surface-variant, #514534);
      font-style: italic;
      margin: 0.25rem 0 0;
    }
    .sf-cart__item-remove {
      flex-shrink: 0;
      inline-size: 2rem;
      block-size: 2rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-on-surface-variant, #514534);
      border-radius: 8px;
      transition: color 0.15s, background-color 0.15s;
      padding: 0;
    }
    .sf-cart__item-remove svg { inline-size: 1.125rem; block-size: 1.125rem; }
    .sf-cart__item-remove:hover {
      color: var(--color-error, #dc2626);
      background: rgba(220,38,38,0.08);
    }

    .sf-cart__item-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .sf-cart__qty-ctrl {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--color-surface-container-high, #eee7df);
      border-radius: 9999px;
      padding: 0.25rem;
    }
    .sf-cart__qty-btn {
      inline-size: 2rem;
      block-size: 2rem;
      border-radius: 50%;
      background: transparent;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary, #805600);
      transition: background-color 0.15s;
    }
    .sf-cart__qty-btn svg { inline-size: 1rem; block-size: 1rem; }
    .sf-cart__qty-btn:hover { background: var(--color-surface, #fff); }
    .sf-cart__qty-val {
      min-inline-size: 1.75rem;
      text-align: center;
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--color-on-surface, #1e1b17);
    }

    .sf-cart__item-price {
      font-size: 1.125rem;
      font-weight: 900;
      color: var(--color-primary-container, #f2a922);
      white-space: nowrap;
    }

    .sf-cart__skeleton-card {
      background: var(--color-surface, #fff);
      border-radius: 16px;
      overflow: hidden;
    }

    .sf-cart__continue-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--color-primary, #805600);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      margin-block-start: 0.5rem;
    }
    .sf-cart__continue-link:hover { text-decoration: underline; }

    /* Summary */
    .sf-cart__summary-col {
      position: relative;
    }
    .sf-cart__summary {
      background: var(--color-surface, #ffffff);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    @media (min-width: 1024px) {
      .sf-cart__summary {
        position: sticky;
        inset-block-start: 5.5rem;
      }
    }
    .sf-cart__summary-title {
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--color-primary, #805600);
      margin: 0;
    }
    .sf-cart__summary-rows {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .sf-cart__summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9375rem;
      color: var(--color-on-surface-variant, #514534);
    }
    .sf-cart__summary-tbd {
      font-size: 0.8125rem;
      font-style: italic;
    }
    .sf-cart__summary-divider {
      block-size: 1px;
      background: var(--color-outline-variant, #d6c4ad);
    }
    .sf-cart__summary-total {
      display: flex;
      justify-content: space-between;
      font-size: 1.25rem;
      font-weight: 900;
      color: var(--color-primary, #805600);
    }

    .sf-cart__coupon {}
    .sf-cart__coupon-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-on-surface, #1e1b17);
      margin-block-end: 0.5rem;
    }
    .sf-cart__coupon-row {
      display: flex;
      gap: 0.5rem;
    }
    .sf-cart__coupon-input {
      flex: 1;
      padding-block: 0.625rem;
      padding-inline: 0.875rem;
      border: 1.5px solid var(--color-outline-variant, #d6c4ad);
      border-radius: 8px;
      background: var(--color-surface-container, #f4ede5);
      font-size: 0.875rem;
      font-family: inherit;
      color: var(--color-on-surface, #1e1b17);
      outline: none;
    }
    .sf-cart__coupon-input:focus { border-color: var(--color-primary, #805600); }
    .sf-cart__coupon-btn {
      padding-block: 0.625rem;
      padding-inline: 1rem;
      background: var(--color-surface-container, #f4ede5);
      border: 1.5px solid var(--color-outline-variant, #d6c4ad);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-primary, #805600);
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: background-color 0.15s;
    }
    .sf-cart__coupon-btn:hover { background: var(--color-primary-container, #f2a922); color: var(--color-on-primary-container, #634100); border-color: var(--color-primary-container, #f2a922); }

    .sf-cart__checkout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding-block: 1rem;
      background: var(--color-primary, #805600);
      color: var(--color-on-primary, #fff);
      border-radius: 9999px;
      font-size: 1rem;
      font-weight: 700;
      text-decoration: none;
      transition: background-color 0.2s;
    }
    .sf-cart__checkout-btn svg { inline-size: 1.125rem; block-size: 1.125rem; }
    .sf-cart__checkout-btn:hover { background: var(--color-primary-container, #f2a922); color: var(--color-on-primary-container, #634100); }

    .sf-cart__secure {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: var(--color-on-surface-variant, #514534);
    }
    .sf-cart__secure svg { inline-size: 1rem; block-size: 1rem; color: var(--color-primary, #805600); }

    .sf-cart__empty-cta {
      display: flex;
      justify-content: center;
      margin-block-start: 2rem;
    }
    .sf-cart__cta-btn {
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
      transition: background-color 0.2s;
    }
    .sf-cart__cta-btn:hover { background: var(--color-primary-container, #f2a922); color: var(--color-on-primary-container, #634100); }
  `],
})
export class CartPageComponent {
  private readonly cartService = inject(CartService);
  private readonly langToggle = inject(LanguageToggleService);

  readonly lang = this.langToggle.current;
  readonly items = this.cartService.items;
  readonly count = this.cartService.count;
  readonly total = this.cartService.total;
  readonly loading = this.cartService.loading;

  lineTotal(item: ReturnType<typeof this.cartService.items>[number]): number {
    const modTotal = (item.selectedModifiers ?? []).reduce((s, m) => s + m.price, 0);
    return (item.price + modTotal) * item.quantity;
  }

  removeItem(itemId: string, variantId?: string): void {
    this.cartService.removeItem(itemId, variantId);
  }

  updateQty(itemId: string, qty: number, variantId?: string): void {
    this.cartService.updateQuantity(itemId, qty, variantId);
  }
}
