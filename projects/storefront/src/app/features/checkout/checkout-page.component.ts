import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent } from '@shared/ui';
import { CartService } from '../../core/services/cart.service';
import { CheckoutService } from '../../core/services/checkout.service';
import {
  CheckoutDeliveryDetails,
  CheckoutAddress,
  OrderType,
  PaymentMethodOption,
  StorefrontBranch,
  DeliveryZone,
} from '../../core/models/checkout.model';

type CheckoutStep = 'delivery' | 'payment';

@Component({
  selector: 'sf-checkout-page',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe, TranslateModule, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-checkout">
      <div class="sf-checkout__inner">
        <h1 class="sf-checkout__title">{{ 'checkout.title' | translate }}</h1>

        <!-- Progress indicator -->
        <nav class="sf-checkout__progress" aria-label="Checkout progress">
          <div class="sf-checkout__step" [class.sf-checkout__step--active]="step() === 'delivery'" [class.sf-checkout__step--done]="step() === 'payment'">
            <div class="sf-checkout__step-bubble">
              @if (step() === 'payment') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              } @else {
                1
              }
            </div>
            <span class="sf-checkout__step-label">{{ 'checkout.step_delivery' | translate }}</span>
          </div>
          <div class="sf-checkout__progress-line" [class.sf-checkout__progress-line--done]="step() === 'payment'"></div>
          <div class="sf-checkout__step" [class.sf-checkout__step--active]="step() === 'payment'">
            <div class="sf-checkout__step-bubble">2</div>
            <span class="sf-checkout__step-label">{{ 'checkout.step_payment' | translate }}</span>
          </div>
          <div class="sf-checkout__progress-line"></div>
          <div class="sf-checkout__step">
            <div class="sf-checkout__step-bubble">3</div>
            <span class="sf-checkout__step-label">{{ 'checkout.step_confirmation' | translate }}</span>
          </div>
        </nav>

        @if (step() === 'delivery') {
          <!-- Step 1: Delivery Details -->
          <div class="sf-checkout__step-content">
            <div class="sf-checkout__card">
              <div class="sf-checkout__card-header">
                <div class="sf-checkout__card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="1"/><circle cx="12" cy="17" r="1"/><circle cx="20" cy="17" r="1"/></svg>
                </div>
                <div>
                  <h2 class="sf-checkout__card-title">{{ 'checkout.delivery_details' | translate }}</h2>
                  <p class="sf-checkout__card-sub">{{ 'checkout.delivery_subtitle' | translate }}</p>
                </div>
              </div>

              <!-- Order type -->
              <div class="sf-checkout__field">
                <label class="sf-checkout__label">{{ 'checkout.order_type' | translate }}</label>
                <div class="sf-checkout__order-type-row">
                  <label class="sf-checkout__type-btn" [class.sf-checkout__type-btn--active]="form.orderType === 'delivery'">
                    <input type="radio" name="orderType" value="delivery" [(ngModel)]="form.orderType" />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="1"/><circle cx="12" cy="17" r="1"/><circle cx="20" cy="17" r="1"/></svg>
                    {{ 'checkout.delivery' | translate }}
                  </label>
                  <label class="sf-checkout__type-btn" [class.sf-checkout__type-btn--active]="form.orderType === 'pickup'">
                    <input type="radio" name="orderType" value="pickup" [(ngModel)]="form.orderType" />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M20.91 8.84L8.56 2.23a1 1 0 0 0-.91 0L3.1 4.46a1 1 0 0 0-.56.89V9a1 1 0 0 0 1 1h16.91a1 1 0 0 0 .96-.72 1 1 0 0 0-.5-1.44z"/><path d="M4 10v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10"/><line x1="12" y1="10" x2="12" y2="21"/></svg>
                    {{ 'checkout.pickup' | translate }}
                  </label>
                </div>
              </div>

              <!-- Name + Phone -->
              <div class="sf-checkout__row-2">
                <div class="sf-checkout__field">
                  <label class="sf-checkout__label" for="fullName">{{ 'checkout.full_name' | translate }} *</label>
                  <input
                    id="fullName"
                    class="sf-checkout__input"
                    type="text"
                    [(ngModel)]="form.fullName"
                    [placeholder]="'checkout.full_name_placeholder' | translate"
                    required
                  />
                </div>
                <div class="sf-checkout__field">
                  <label class="sf-checkout__label" for="phone">{{ 'checkout.phone' | translate }} *</label>
                  <input
                    id="phone"
                    class="sf-checkout__input"
                    type="tel"
                    [(ngModel)]="form.phone"
                    placeholder="+965 XXXX XXXX"
                    required
                  />
                </div>
              </div>

              <!-- Email -->
              <div class="sf-checkout__field">
                <label class="sf-checkout__label" for="email">{{ 'checkout.email' | translate }} *</label>
                <input
                  id="email"
                  class="sf-checkout__input"
                  type="email"
                  [(ngModel)]="form.email"
                  [placeholder]="'checkout.email_placeholder' | translate"
                  required
                />
              </div>

              @if (form.orderType === 'delivery') {
                <!-- Structured address fields -->
                <div class="sf-checkout__row-2">
                  <div class="sf-checkout__field">
                    <label class="sf-checkout__label" for="addrBlock">{{ 'checkout.addr_block' | translate }} *</label>
                    <input id="addrBlock" class="sf-checkout__input" type="text" [(ngModel)]="form.block" [placeholder]="'checkout.addr_block_placeholder' | translate" required />
                  </div>
                  <div class="sf-checkout__field">
                    <label class="sf-checkout__label" for="addrStreet">{{ 'checkout.addr_street' | translate }} *</label>
                    <input id="addrStreet" class="sf-checkout__input" type="text" [(ngModel)]="form.street" [placeholder]="'checkout.addr_street_placeholder' | translate" required />
                  </div>
                </div>
                <div class="sf-checkout__row-2">
                  <div class="sf-checkout__field">
                    <label class="sf-checkout__label" for="addrArea">{{ 'checkout.addr_area' | translate }} *</label>
                    <input id="addrArea" class="sf-checkout__input" type="text" [(ngModel)]="form.area" [placeholder]="'checkout.addr_area_placeholder' | translate" required />
                  </div>
                  <div class="sf-checkout__field">
                    <label class="sf-checkout__label" for="addrApartment">{{ 'checkout.addr_apartment' | translate }} <span class="sf-checkout__optional">({{ 'item_detail.optional' | translate }})</span></label>
                    <input id="addrApartment" class="sf-checkout__input" type="text" [(ngModel)]="form.apartment" [placeholder]="'checkout.addr_apartment_placeholder' | translate" />
                  </div>
                </div>

                <!-- Delivery Zone -->
                <div class="sf-checkout__field">
                  <label class="sf-checkout__label">{{ 'checkout.delivery_zone' | translate }} *</label>
                  @if (loadingZones()) {
                    <ui-skeleton variant="block" height="80px" />
                  } @else if (deliveryZones().length === 0) {
                    <p class="sf-checkout__no-zones">{{ 'checkout.no_zones' | translate }}</p>
                  } @else {
                    <div class="sf-checkout__zones">
                      @for (zone of deliveryZones(); track zone.id) {
                        <label class="sf-checkout__zone-card" [class.sf-checkout__zone-card--active]="selectedZoneId() === zone.id">
                          <input type="radio" name="deliveryZone" [value]="zone.id" [checked]="selectedZoneId() === zone.id" (change)="selectedZoneId.set(zone.id)" />
                          <div class="sf-checkout__zone-info">
                            <p class="sf-checkout__zone-name">{{ lang() === 'ar' ? zone.nameAr : zone.nameEn }}</p>
                            <p class="sf-checkout__zone-meta">
                              {{ zone.deliveryFee | number:'1.3-3' }} {{ 'common.currency' | translate }}
                              &nbsp;·&nbsp;
                              ~{{ zone.estimatedTimeMinutes }} {{ 'checkout.minutes' | translate }}
                            </p>
                          </div>
                          @if (zone.minOrder > 0) {
                            <span class="sf-checkout__zone-min">{{ 'checkout.min_order' | translate }}: {{ zone.minOrder | number:'1.3-3' }}</span>
                          }
                        </label>
                      }
                    </div>
                  }
                </div>

                <!-- Map -->
                <div class="sf-checkout__field">
                  <label class="sf-checkout__label">{{ 'checkout.pin_location' | translate }}</label>
                  <div class="sf-checkout__map-wrap">
                    <div #mapContainer id="sf-checkout-map" class="sf-checkout__map"></div>
                  </div>
                  @if (pinLat() && pinLng()) {
                    <p class="sf-checkout__map-coords">
                      {{ 'checkout.pin_set' | translate }}: {{ pinLat() | number: '1.4-4' }}, {{ pinLng() | number: '1.4-4' }}
                    </p>
                  }
                </div>

                <!-- Delivery instructions -->
                <div class="sf-checkout__field">
                  <label class="sf-checkout__label" for="deliveryInstr">{{ 'checkout.delivery_instructions' | translate }} <span class="sf-checkout__optional">({{ 'item_detail.optional' | translate }})</span></label>
                  <textarea
                    id="deliveryInstr"
                    class="sf-checkout__textarea"
                    [(ngModel)]="form.deliveryInstructions"
                    [placeholder]="'checkout.delivery_instructions_placeholder' | translate"
                    rows="2"
                    maxlength="200"
                  ></textarea>
                </div>
              }

              <!-- Delivery time -->
              <div class="sf-checkout__field">
                <label class="sf-checkout__label" for="deliveryTime">{{ 'checkout.delivery_time' | translate }}</label>
                <select id="deliveryTime" class="sf-checkout__select" [(ngModel)]="form.deliveryTime">
                  <option value="asap">{{ 'checkout.asap' | translate }}</option>
                  <option value="30min">{{ 'checkout.in_30_min' | translate }}</option>
                  <option value="1h">{{ 'checkout.in_1h' | translate }}</option>
                  <option value="2h">{{ 'checkout.in_2h' | translate }}</option>
                </select>
              </div>

              <!-- Order notes -->
              <div class="sf-checkout__field">
                <label class="sf-checkout__label" for="orderNotes">{{ 'checkout.order_notes' | translate }} <span class="sf-checkout__optional">({{ 'item_detail.optional' | translate }})</span></label>
                <textarea
                  id="orderNotes"
                  class="sf-checkout__textarea"
                  [(ngModel)]="form.orderNotes"
                  [placeholder]="'checkout.order_notes_placeholder' | translate"
                  rows="2"
                  maxlength="500"
                ></textarea>
              </div>

              @if (detailsError(); as err) {
                <div class="sf-checkout__error" role="alert">{{ err | translate }}</div>
              }

              <div class="sf-checkout__actions">
                <a
                  class="sf-checkout__back-btn"
                  [routerLink]="['/', lang(), 'cart']"
                >
                  ← {{ 'checkout.back_to_cart' | translate }}
                </a>
                <button
                  class="sf-checkout__next-btn"
                  type="button"
                  [disabled]="!deliveryFormValid || submittingDetails()"
                  (click)="goToPayment()"
                >
                  @if (submittingDetails()) {
                    <span class="sf-checkout__spinner" aria-hidden="true"></span>
                    {{ 'checkout.saving' | translate }}
                  } @else {
                    {{ 'checkout.continue_to_payment' | translate }}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>
        }

        @if (step() === 'payment') {
          <!-- Step 2: Payment -->
          <div class="sf-checkout__step-content">
            <div class="sf-checkout__layout-2col">
              <!-- Payment methods + place order -->
              <div class="sf-checkout__payment-col">
                <div class="sf-checkout__card">
                  <h2 class="sf-checkout__card-title">{{ 'checkout.payment_method' | translate }}</h2>
                  <p class="sf-checkout__card-sub">{{ 'checkout.payment_subtitle' | translate }}</p>

                  @if (loadingMethods()) {
                    <ui-skeleton variant="block" height="200px" />
                  } @else if (paymentMethods().length === 0) {
                    <!-- No methods from API — show cash fallback -->
                    <label class="sf-checkout__method-option" [class.sf-checkout__method-option--active]="selectedMethod() === 'cash'">
                      <input type="radio" name="payMethod" value="cash" [checked]="selectedMethod() === 'cash'" (change)="selectedMethod.set('cash')" />
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      <div>
                        <p class="sf-checkout__method-name">{{ 'checkout.cash_on_delivery' | translate }}</p>
                        <p class="sf-checkout__method-desc">{{ 'checkout.cash_desc' | translate }}</p>
                      </div>
                    </label>
                  } @else {
                    @for (method of paymentMethods(); track method.key) {
                      <label class="sf-checkout__method-option" [class.sf-checkout__method-option--active]="selectedMethod() === method.key">
                        <input type="radio" name="payMethod" [value]="method.key" [checked]="selectedMethod() === method.key" (change)="selectedMethod.set(method.key)" />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        <div>
                          <p class="sf-checkout__method-name">{{ lang() === 'ar' ? (method.labelAr || method.label) : method.label }}</p>
                        </div>
                      </label>
                    }
                  }

                  <div class="sf-checkout__secure-msg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    {{ 'checkout.payment_secure' | translate }}
                  </div>
                </div>

                @if (paymentError()) {
                  <div class="sf-checkout__error" role="alert">
                    {{ paymentError() }}
                  </div>
                }

                <div class="sf-checkout__actions">
                  <button class="sf-checkout__back-btn sf-checkout__back-btn--btn" type="button" (click)="step.set('delivery')">
                    ← {{ 'checkout.back_to_delivery' | translate }}
                  </button>
                </div>
              </div>

              <!-- Order summary sidebar -->
              <div class="sf-checkout__summary-col">
                <div class="sf-checkout__summary">
                  <h2 class="sf-checkout__summary-title">{{ 'cart.order_summary' | translate }}</h2>

                  <div class="sf-checkout__summary-items">
                    @for (item of cartItems(); track item.itemId) {
                      <div class="sf-checkout__summary-item">
                        @if (item.imageUrl) {
                          <img class="sf-checkout__summary-img" [src]="item.imageUrl" [alt]="lang() === 'ar' ? item.nameAr : item.nameEn" loading="lazy" width="56" height="56" />
                        }
                        <div class="sf-checkout__summary-item-info">
                          <p class="sf-checkout__summary-item-name">{{ lang() === 'ar' ? item.nameAr : item.nameEn }}</p>
                          <p class="sf-checkout__summary-item-qty">{{ 'checkout.qty' | translate }}: {{ item.quantity }}</p>
                        </div>
                        <span class="sf-checkout__summary-item-price">{{ itemLineTotal(item) | number: '1.3-3' }}</span>
                      </div>
                    }
                  </div>

                  <div class="sf-checkout__summary-rows">
                    <div class="sf-checkout__summary-row">
                      <span>{{ 'cart.subtotal' | translate }}</span>
                      <span>{{ cartTotal() | number: '1.3-3' }} {{ 'common.currency' | translate }}</span>
                    </div>
                    <div class="sf-checkout__summary-row">
                      <span>{{ 'cart.delivery_fee' | translate }}</span>
                      <span class="sf-checkout__summary-tbd">{{ 'cart.calculated_at_checkout' | translate }}</span>
                    </div>
                  </div>

                  <div class="sf-checkout__summary-divider"></div>

                  <div class="sf-checkout__summary-total">
                    <span>{{ 'cart.total' | translate }}</span>
                    <span>{{ cartTotal() | number: '1.3-3' }} {{ 'common.currency' | translate }}</span>
                  </div>

                  <button
                    class="sf-checkout__place-order-btn"
                    type="button"
                    [disabled]="!selectedMethod() || placingOrder()"
                    (click)="placeOrder()"
                  >
                    @if (placingOrder()) {
                      <span class="sf-checkout__spinner" aria-hidden="true"></span>
                      {{ 'checkout.placing_order' | translate }}
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      {{ 'checkout.place_order' | translate }}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .sf-checkout {
      background: var(--color-background, #fff8f1);
      min-block-size: 80vh;
      padding-block: 2rem;
      padding-inline: 1.5rem;
    }
    .sf-checkout__inner {
      max-inline-size: 80rem;
      margin-inline: auto;
    }
    .sf-checkout__title {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      color: var(--color-primary, #805600);
      margin: 0 0 2rem;
      letter-spacing: -0.02em;
    }

    /* Progress */
    .sf-checkout__progress {
      display: flex;
      align-items: center;
      gap: 0;
      margin-block-end: 2.5rem;
      overflow: hidden;
    }
    .sf-checkout__step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      flex-shrink: 0;
    }
    .sf-checkout__step-bubble {
      inline-size: 2.5rem;
      block-size: 2.5rem;
      border-radius: 50%;
      background: var(--color-surface-container-high, #eee7df);
      color: var(--color-on-surface-variant, #514534);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9375rem;
      transition: background-color 0.25s, color 0.25s;
    }
    .sf-checkout__step-bubble svg { inline-size: 1rem; block-size: 1rem; }
    .sf-checkout__step--active .sf-checkout__step-bubble {
      background: var(--color-primary-container, #f2a922);
      color: var(--color-on-primary-container, #634100);
    }
    .sf-checkout__step--done .sf-checkout__step-bubble {
      background: var(--color-primary, #805600);
      color: var(--color-on-primary, #fff);
    }
    .sf-checkout__step-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-on-surface-variant, #514534);
      white-space: nowrap;
    }
    .sf-checkout__step--active .sf-checkout__step-label { color: var(--color-primary, #805600); }
    .sf-checkout__progress-line {
      flex: 1;
      block-size: 2px;
      background: var(--color-surface-container-high, #eee7df);
      margin-block-end: 1.25rem;
      transition: background-color 0.25s;
    }
    .sf-checkout__progress-line--done { background: var(--color-primary, #805600); }

    /* Card */
    .sf-checkout__card {
      background: var(--color-surface, #fff);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .sf-checkout__card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .sf-checkout__card-icon {
      inline-size: 3rem;
      block-size: 3rem;
      border-radius: 50%;
      background: rgba(128,86,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .sf-checkout__card-icon svg { inline-size: 1.25rem; block-size: 1.25rem; color: var(--color-primary, #805600); }
    .sf-checkout__card-title { font-size: 1.375rem; font-weight: 800; color: var(--color-primary, #805600); margin: 0; }
    .sf-checkout__card-sub { font-size: 0.875rem; color: var(--color-on-surface-variant, #514534); margin: 0.125rem 0 0; }

    .sf-checkout__field { display: flex; flex-direction: column; gap: 0.4rem; }
    .sf-checkout__label { font-size: 0.875rem; font-weight: 600; color: var(--color-on-surface, #1e1b17); }
    .sf-checkout__optional { font-weight: 400; color: var(--color-on-surface-variant, #514534); }

    .sf-checkout__input,
    .sf-checkout__textarea,
    .sf-checkout__select {
      padding-block: 0.75rem;
      padding-inline: 1rem;
      border: 1.5px solid var(--color-outline-variant, #d6c4ad);
      border-radius: 10px;
      background: var(--color-surface-container, #f4ede5);
      font-size: 0.9375rem;
      font-family: inherit;
      color: var(--color-on-surface, #1e1b17);
      outline: none;
      transition: border-color 0.15s;
    }
    .sf-checkout__input:focus,
    .sf-checkout__textarea:focus,
    .sf-checkout__select:focus { border-color: var(--color-primary, #805600); }
    .sf-checkout__textarea { resize: vertical; }
    .sf-checkout__select { cursor: pointer; appearance: none; }

    .sf-checkout__row-2 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    @media (min-width: 640px) {
      .sf-checkout__row-2 { grid-template-columns: 1fr 1fr; }
    }

    .sf-checkout__order-type-row { display: flex; gap: 0.75rem; }
    .sf-checkout__type-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding-block: 0.75rem;
      border: 2px solid var(--color-outline-variant, #d6c4ad);
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-on-surface-variant, #514534);
      background: var(--color-surface-container, #f4ede5);
      transition: border-color 0.15s, background-color 0.15s, color 0.15s;
    }
    .sf-checkout__type-btn input { display: none; }
    .sf-checkout__type-btn svg { inline-size: 1.125rem; block-size: 1.125rem; }
    .sf-checkout__type-btn--active { border-color: var(--color-primary, #805600); background: rgba(128,86,0,0.08); color: var(--color-primary, #805600); }

    /* Delivery Zones */
    .sf-checkout__zones { display: flex; flex-direction: column; gap: 0.5rem; }
    .sf-checkout__zone-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
      border: 2px solid var(--color-outline-variant, #d6c4ad);
      border-radius: 10px;
      cursor: pointer;
      transition: border-color 0.15s, background-color 0.15s;
    }
    .sf-checkout__zone-card input { display: none; }
    .sf-checkout__zone-card--active { border-color: var(--color-primary, #805600); background: rgba(128,86,0,0.06); }
    .sf-checkout__zone-info { flex: 1; min-inline-size: 0; }
    .sf-checkout__zone-name { font-weight: 700; font-size: 0.9375rem; color: var(--color-on-surface, #1e1b17); margin: 0; }
    .sf-checkout__zone-meta { font-size: 0.8125rem; color: var(--color-on-surface-variant, #514534); margin: 0.1875rem 0 0; }
    .sf-checkout__zone-min { font-size: 0.75rem; color: var(--color-on-surface-variant, #514534); white-space: nowrap; }
    .sf-checkout__no-zones { font-size: 0.875rem; color: var(--color-on-surface-variant, #514534); padding: 0.75rem 1rem; background: var(--color-surface-container, #f4ede5); border-radius: 10px; margin: 0; }

    /* Map */
    .sf-checkout__map-wrap { border-radius: 12px; overflow: hidden; border: 1.5px solid var(--color-outline-variant, #d6c4ad); }
    .sf-checkout__map { block-size: 280px; }
    .sf-checkout__map-coords { font-size: 0.8125rem; color: var(--color-on-surface-variant, #514534); margin: 0; }

    /* Actions */
    .sf-checkout__actions {
      display: flex;
      flex-direction: column-reverse;
      gap: 0.75rem;
      margin-block-start: 0.25rem;
    }
    @media (min-width: 640px) {
      .sf-checkout__actions { flex-direction: row; justify-content: space-between; align-items: center; }
    }
    .sf-checkout__back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--color-primary, #805600);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      border: none;
      background: none;
      cursor: pointer;
      font-family: inherit;
      padding: 0;
    }
    .sf-checkout__back-btn:hover { text-decoration: underline; }
    .sf-checkout__back-btn--btn { text-decoration: none; }
    .sf-checkout__back-btn--btn:hover { text-decoration: underline; }
    .sf-checkout__next-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding-block: 0.875rem;
      padding-inline: 2rem;
      background: var(--color-primary-container, #f2a922);
      color: var(--color-on-primary-container, #634100);
      border: none;
      border-radius: 9999px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.15s;
    }
    .sf-checkout__next-btn svg { inline-size: 1rem; block-size: 1rem; }
    .sf-checkout__next-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Payment layout */
    .sf-checkout__layout-2col {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    @media (min-width: 1024px) {
      .sf-checkout__layout-2col {
        grid-template-columns: 1fr minmax(0, 22rem);
        gap: 2.5rem;
      }
    }

    .sf-checkout__payment-col { display: flex; flex-direction: column; gap: 1.25rem; }

    .sf-checkout__method-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid var(--color-outline-variant, #d6c4ad);
      border-radius: 10px;
      cursor: pointer;
      transition: border-color 0.15s, background-color 0.15s;
    }
    .sf-checkout__method-option input { display: none; }
    .sf-checkout__method-option svg { inline-size: 1.25rem; block-size: 1.25rem; color: var(--color-on-surface-variant, #514534); flex-shrink: 0; }
    .sf-checkout__method-option--active { border-color: var(--color-primary, #805600); background: rgba(128,86,0,0.06); }
    .sf-checkout__method-option--active svg { color: var(--color-primary, #805600); }
    .sf-checkout__method-name { font-weight: 700; font-size: 0.9375rem; color: var(--color-on-surface, #1e1b17); margin: 0; }
    .sf-checkout__method-desc { font-size: 0.8125rem; color: var(--color-on-surface-variant, #514534); margin: 0.125rem 0 0; }

    .sf-checkout__secure-msg {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: var(--color-on-surface-variant, #514534);
      margin-block-start: 0.5rem;
    }
    .sf-checkout__secure-msg svg { inline-size: 1rem; block-size: 1rem; color: var(--color-primary, #805600); }

    .sf-checkout__error {
      padding: 0.875rem 1rem;
      background: rgba(220,38,38,0.08);
      border: 1.5px solid rgba(220,38,38,0.3);
      border-radius: 10px;
      font-size: 0.9375rem;
      color: var(--color-error, #dc2626);
    }

    /* Summary sidebar */
    .sf-checkout__summary-col { position: relative; }
    .sf-checkout__summary {
      background: var(--color-surface, #fff);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    @media (min-width: 1024px) {
      .sf-checkout__summary {
        position: sticky;
        inset-block-start: 5.5rem;
      }
    }
    .sf-checkout__summary-title { font-size: 1.25rem; font-weight: 800; color: var(--color-primary, #805600); margin: 0; }
    .sf-checkout__summary-items { display: flex; flex-direction: column; gap: 0.75rem; }
    .sf-checkout__summary-item { display: flex; align-items: center; gap: 0.75rem; }
    .sf-checkout__summary-img { inline-size: 3.5rem; block-size: 3.5rem; border-radius: 8px; object-fit: cover; }
    .sf-checkout__summary-item-info { flex: 1; min-inline-size: 0; }
    .sf-checkout__summary-item-name { font-weight: 700; font-size: 0.875rem; margin: 0; color: var(--color-on-surface, #1e1b17); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sf-checkout__summary-item-qty { font-size: 0.75rem; color: var(--color-on-surface-variant, #514534); margin: 0.125rem 0 0; }
    .sf-checkout__summary-item-price { font-weight: 700; font-size: 0.875rem; color: var(--color-primary-container, #f2a922); white-space: nowrap; }
    .sf-checkout__summary-rows { display: flex; flex-direction: column; gap: 0.625rem; }
    .sf-checkout__summary-row { display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--color-on-surface-variant, #514534); }
    .sf-checkout__summary-tbd { font-size: 0.8125rem; font-style: italic; }
    .sf-checkout__summary-divider { block-size: 1px; background: var(--color-outline-variant, #d6c4ad); }
    .sf-checkout__summary-total { display: flex; justify-content: space-between; font-size: 1.125rem; font-weight: 900; color: var(--color-primary, #805600); }

    .sf-checkout__place-order-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding-block: 1rem;
      background: linear-gradient(135deg, var(--color-primary-container, #f2a922), #d39207);
      color: var(--color-on-primary-container, #634100);
      border: none;
      border-radius: 9999px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 6px 16px rgba(128,86,0,0.2);
      transition: opacity 0.15s;
    }
    .sf-checkout__place-order-btn svg { inline-size: 1rem; block-size: 1rem; }
    .sf-checkout__place-order-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .sf-checkout__spinner {
      inline-size: 1rem;
      block-size: 1rem;
      border: 2px solid rgba(0,0,0,0.2);
      border-block-start-color: var(--color-on-primary-container, #634100);
      border-radius: 50%;
      animation: sf-spin 0.7s linear infinite;
    }
    @keyframes sf-spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class CheckoutPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly langToggle = inject(LanguageToggleService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly lang = this.langToggle.current;
  readonly cartItems = this.cartService.items;
  readonly cartTotal = this.cartService.total;
  readonly cartId = this.cartService.cartId;

  readonly step = signal<CheckoutStep>('delivery');
  readonly pinLat = signal<number | null>(null);
  readonly pinLng = signal<number | null>(null);
  readonly deliveryZones = signal<DeliveryZone[]>([]);
  readonly selectedZoneId = signal<string | null>(null);
  readonly loadingZones = signal(false);
  readonly paymentMethods = signal<PaymentMethodOption[]>([]);
  readonly selectedMethod = signal<string>('cash');
  readonly loadingMethods = signal(true);
  readonly submittingDetails = signal(false);
  readonly detailsError = signal<string | null>(null);
  readonly placingOrder = signal(false);
  readonly paymentError = signal<string | null>(null);

  private defaultBranch: StorefrontBranch | null = null;

  form: CheckoutDeliveryDetails = {
    orderType: 'delivery',
    fullName: '',
    phone: '',
    email: '',
    block: '',
    street: '',
    area: '',
    city: 'Kuwait City',
    apartment: '',
    deliveryInstructions: '',
    deliveryTime: 'asap',
    orderNotes: '',
  };

  get deliveryFormValid(): boolean {
    const f = this.form;
    const base = !!f.fullName.trim() && !!f.phone.trim() && !!f.email.trim();
    if (f.orderType === 'delivery') {
      return base && !!f.block.trim() && !!f.street.trim() && !!f.area.trim() && !!this.selectedZoneId();
    }
    return base;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapInstance: any = null;

  ngOnInit(): void {
    this.checkoutService.getBranches().subscribe((branches) => {
      if (branches.length > 0) {
        this.defaultBranch = branches[0];
        this.loadZonesForBranch(branches[0].id);
      }
      this.cdr.markForCheck();
    });
    this.checkoutService.getPaymentMethods().subscribe((methods) => {
      this.paymentMethods.set(methods);
      if (methods.length > 0) this.selectedMethod.set(methods[0].key);
      this.loadingMethods.set(false);
      this.cdr.markForCheck();
    });
  }

  private loadZonesForBranch(branchId: string): void {
    this.loadingZones.set(true);
    this.selectedZoneId.set(null);
    this.checkoutService.getDeliveryZones(branchId).subscribe((zones) => {
      this.deliveryZones.set(zones);
      if (zones.length === 1) this.selectedZoneId.set(zones[0].id);
      this.loadingZones.set(false);
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.step() === 'delivery') {
      this.initMap();
    }
  }

  private async initMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.mapContainer) return;

    const L = await import('leaflet');

    const defaultLat = 29.3759;
    const defaultLng = 47.9774;

    this.mapInstance = L.map(this.mapContainer.nativeElement, { zoomControl: true }).setView(
      [defaultLat, defaultLng],
      13,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.mapInstance);

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    const marker = L.marker([defaultLat, defaultLng], { draggable: true, icon }).addTo(this.mapInstance);
    this.pinLat.set(defaultLat);
    this.pinLng.set(defaultLng);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      this.pinLat.set(pos.lat);
      this.pinLng.set(pos.lng);
      this.form.lat = pos.lat;
      this.form.lng = pos.lng;
      this.cdr.markForCheck();
    });

    this.form.lat = defaultLat;
    this.form.lng = defaultLng;
  }

  goToPayment(): void {
    if (!this.deliveryFormValid || this.submittingDetails()) return;
    this.submittingDetails.set(true);
    this.detailsError.set(null);

    const deliveryAddress: CheckoutAddress | null = this.form.orderType === 'delivery'
      ? {
          street: this.form.street,
          block: this.form.block,
          area: this.form.area,
          city: this.form.city || 'Kuwait City',
          apartment: this.form.apartment || undefined,
          instructions: this.form.deliveryInstructions || undefined,
        }
      : null;

    this.checkoutService.setCheckoutDetails({
      cartId: this.cartId(),
      orderType: this.form.orderType,
      branchId: this.defaultBranch?.id ?? '',
      deliveryZoneId: this.form.orderType === 'delivery' ? this.selectedZoneId() : null,
      deliveryAddress,
      customerEmail: this.form.email || undefined,
      notes: this.form.orderNotes || undefined,
    }).subscribe({
      next: (res) => {
        this.submittingDetails.set(false);
        if (res === null) {
          this.detailsError.set('checkout.details_failed');
          this.cdr.markForCheck();
          return;
        }
        if (this.mapInstance) {
          this.mapInstance.remove();
          this.mapInstance = null;
        }
        this.step.set('payment');
        this.cdr.markForCheck();
      },
    });
  }

  itemLineTotal(item: ReturnType<typeof this.cartService.items>[number]): number {
    const modTotal = (item.selectedModifiers ?? []).reduce((s, m) => s + m.price, 0);
    return (item.price + modTotal) * item.quantity;
  }

  placeOrder(): void {
    if (!this.selectedMethod() || this.placingOrder()) return;
    this.placingOrder.set(true);
    this.paymentError.set(null);

    const lang = this.lang();
    const origin = isPlatformBrowser(this.platformId) ? window.location.origin : '';

    const deliveryAddress: CheckoutAddress | undefined = this.form.orderType === 'delivery'
      ? {
          street: this.form.street,
          block: this.form.block,
          area: this.form.area,
          city: this.form.city || 'Kuwait City',
          apartment: this.form.apartment || undefined,
          instructions: this.form.deliveryInstructions || undefined,
        }
      : undefined;

    this.checkoutService.initiatePayment({
      cartId: this.cartId(),
      branchId: this.defaultBranch?.id ?? '',
      orderType: this.form.orderType,
      deliveryZoneId: this.form.orderType === 'delivery' ? this.selectedZoneId() : null,
      deliveryAddress,
      customerName: this.form.fullName,
      customerPhone: this.form.phone,
      customerEmail: this.form.email || undefined,
      notes: this.form.orderNotes || undefined,
      providerKey: this.selectedMethod(),
      successUrl: `${origin}/${lang}/order-confirmation/`,
      failUrl: `${origin}/${lang}/checkout?payment=failed`,
      webhookUrl: '',
      language: lang,
    }).subscribe({
      next: (res) => {
        this.placingOrder.set(false);
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else {
          this.cartService.clear();
          this.router.navigate(['/', lang, 'order-confirmation', res.order.id]);
        }
      },
      error: () => {
        this.placingOrder.set(false);
        this.paymentError.set('checkout.payment_failed');
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  }
}
