import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { SettingsService } from '../../core/services/settings.service';
import {
  GeneralSettings,
  BusinessHour,
  DeliverySettings,
  SocialLinks,
  BrandingSettings,
  OrderSettings,
  NotificationSettings,
  TaxSettings,
  PaymentSettings,
  PaymentMethod,
} from '../../core/models/settings.model';

type SettingsTab = 'general' | 'branding' | 'delivery' | 'social' | 'seo' | 'payments' | 'orders' | 'notifications' | 'tax';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function dayIndex(name: string): number {
  const idx = DAY_NAMES.findIndex((d) => d.toLowerCase() === name?.toLowerCase());
  return idx >= 0 ? idx : 0;
}

function defaultBusinessHours(): BusinessHour[] {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day,
    openTime: '09:00',
    closeTime: '22:00',
    isClosed: false,
  }));
}

@Component({
  selector: 'db-settings',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-set">
      <header class="db-set__header">
        <h1 class="db-set__title">{{ 'settings_page.title' | translate }}</h1>
      </header>

      <!-- Tabs -->
      <div class="db-set__tabs" role="tablist">
        @for (tab of tabs; track tab.id) {
          <button
            class="db-set__tab"
            role="tab"
            [class.db-set__tab--active]="activeTab() === tab.id"
            (click)="switchTab(tab.id)"
          >{{ tab.labelKey | translate }}</button>
        }
      </div>

      <!-- Success banner -->
      @if (successMsg()) {
        <div class="db-set__success" role="status">
          {{ 'settings_page.save_success' | translate }}
        </div>
      }

      <!-- Error banner -->
      @if (saveError()) {
        <div class="db-set__error-banner" role="alert">
          {{ saveError() }}
        </div>
      }

      <!-- General tab -->
      @if (activeTab() === 'general') {
        <div class="db-set__panel">
          @if (generalLoading()) {
            <div class="db-set__loading-msg">{{ 'common.loading' | translate }}</div>
          } @else {
            <div class="db-set__field">
              <label class="db-set__label" for="prep-time">{{ 'settings_page.general_prep_time' | translate }}</label>
              <input
                id="prep-time"
                class="db-set__input db-set__input--narrow"
                type="number"
                min="0"
                [(ngModel)]="preparationTime"
              />
            </div>

            <div class="db-set__section-title">{{ 'settings_page.general_business_hours' | translate }}</div>
            <div class="db-set__hours-table">
              <div class="db-set__hours-header">
                <span>{{ 'settings_page.general_day' | translate }}</span>
                <span>{{ 'settings_page.general_open' | translate }}</span>
                <span>{{ 'settings_page.general_close' | translate }}</span>
                <span>{{ 'settings_page.general_closed' | translate }}</span>
              </div>
              @for (hour of businessHours; track hour.dayOfWeek) {
                <div class="db-set__hours-row">
                  <span class="db-set__day-name">{{ dayName(hour.dayOfWeek) }}</span>
                  <input
                    class="db-set__input db-set__input--time"
                    type="time"
                    [(ngModel)]="hour.openTime"
                    [disabled]="hour.isClosed"
                  />
                  <input
                    class="db-set__input db-set__input--time"
                    type="time"
                    [(ngModel)]="hour.closeTime"
                    [disabled]="hour.isClosed"
                  />
                  <input
                    class="db-set__checkbox"
                    type="checkbox"
                    [(ngModel)]="hour.isClosed"
                  />
                </div>
              }
            </div>

            <button
              class="db-set__save-btn"
              type="button"
              [disabled]="saving()"
              (click)="saveGeneral()"
            >
              @if (saving()) { <span class="db-set__spinner" aria-hidden="true"></span> }
              {{ 'settings_page.save_btn' | translate }}
            </button>
          }
        </div>
      }

      <!-- Branding tab -->
      @if (activeTab() === 'branding') {
        <div class="db-set__panel">
          @if (brandingLoading()) {
            <div class="db-set__loading-msg">{{ 'common.loading' | translate }}</div>
          } @else {
            <div class="db-set__field">
              <label class="db-set__label" for="primary-color">{{ 'settings_page.branding_primary_color' | translate }}</label>
              <input id="primary-color" class="db-set__input" type="text" [(ngModel)]="brandingPrimaryColor" placeholder="#F59E0B" />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="header-color">{{ 'settings_page.branding_header_color' | translate }}</label>
              <input id="header-color" class="db-set__input" type="text" [(ngModel)]="brandingHeaderColor" placeholder="#1a0a00" />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="logo-url">{{ 'settings_page.branding_logo_url' | translate }}</label>
              <input id="logo-url" class="db-set__input" type="url" [(ngModel)]="brandingLogoUrl" placeholder="https://..." />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="cover-url">{{ 'settings_page.branding_cover_url' | translate }}</label>
              <input id="cover-url" class="db-set__input" type="url" [(ngModel)]="brandingCoverUrl" placeholder="https://..." />
            </div>
            <button
              class="db-set__save-btn"
              type="button"
              [disabled]="saving()"
              (click)="saveBranding()"
            >
              @if (saving()) { <span class="db-set__spinner" aria-hidden="true"></span> }
              {{ 'settings_page.save_btn' | translate }}
            </button>
          }
        </div>
      }

      <!-- Delivery tab -->
      @if (activeTab() === 'delivery') {
        <div class="db-set__panel">
          @if (deliveryLoading()) {
            <div class="db-set__loading-msg">{{ 'common.loading' | translate }}</div>
          } @else {
            <div class="db-set__field">
              <label class="db-set__label" for="min-order">{{ 'settings_page.delivery_min_order' | translate }}</label>
              <input
                id="min-order"
                class="db-set__input db-set__input--narrow"
                type="number"
                min="0"
                step="0.001"
                [(ngModel)]="deliveryMinOrder"
              />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="free-threshold">{{ 'settings_page.delivery_free_threshold' | translate }}</label>
              <input
                id="free-threshold"
                class="db-set__input db-set__input--narrow"
                type="number"
                min="0"
                step="0.001"
                [ngModel]="deliveryFreeThreshold ?? ''"
                (ngModelChange)="deliveryFreeThreshold = $event === '' ? null : +$event"
              />
            </div>
            <button
              class="db-set__save-btn"
              type="button"
              [disabled]="saving()"
              (click)="saveDelivery()"
            >
              @if (saving()) { <span class="db-set__spinner" aria-hidden="true"></span> }
              {{ 'settings_page.save_btn' | translate }}
            </button>
          }
        </div>
      }

      <!-- Social Links tab -->
      @if (activeTab() === 'social') {
        <div class="db-set__panel">
          @if (socialLoading()) {
            <div class="db-set__loading-msg">{{ 'common.loading' | translate }}</div>
          } @else {
            @for (link of socialFields; track link.key) {
              <div class="db-set__field">
                <label class="db-set__label" [for]="'social-' + link.key">
                  {{ link.labelKey | translate }}
                </label>
                <input
                  [id]="'social-' + link.key"
                  class="db-set__input"
                  type="text"
                  [ngModel]="getSocialValue(link.key)"
                  (ngModelChange)="setSocialValue(link.key, $event)"
                  placeholder="https://..."
                />
              </div>
            }
            <button
              class="db-set__save-btn"
              type="button"
              [disabled]="saving()"
              (click)="saveSocial()"
            >
              @if (saving()) { <span class="db-set__spinner" aria-hidden="true"></span> }
              {{ 'settings_page.save_btn' | translate }}
            </button>
          }
        </div>
      }

      <!-- SEO tab -->
      @if (activeTab() === 'seo') {
        <div class="db-set__panel">
          @if (seoLoading()) {
            <div class="db-set__loading-msg">{{ 'common.loading' | translate }}</div>
          } @else {
            <div class="db-set__section-title">{{ 'settings_page.seo_meta_section' | translate }}</div>
            <div class="db-set__field">
              <label class="db-set__label" for="seo-title-en">{{ 'settings_page.seo_meta_title_en' | translate }}</label>
              <input id="seo-title-en" class="db-set__input" type="text" maxlength="120"
                [ngModel]="seoMetaTitleEn ?? ''" (ngModelChange)="seoMetaTitleEn = $event || null" />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="seo-title-ar">{{ 'settings_page.seo_meta_title_ar' | translate }}</label>
              <input id="seo-title-ar" class="db-set__input" type="text" dir="rtl" maxlength="120"
                [ngModel]="seoMetaTitleAr ?? ''" (ngModelChange)="seoMetaTitleAr = $event || null" />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="seo-desc-en">{{ 'settings_page.seo_meta_description_en' | translate }}</label>
              <textarea id="seo-desc-en" class="db-set__input db-set__textarea" maxlength="320"
                [ngModel]="seoMetaDescriptionEn ?? ''" (ngModelChange)="seoMetaDescriptionEn = $event || null"></textarea>
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="seo-desc-ar">{{ 'settings_page.seo_meta_description_ar' | translate }}</label>
              <textarea id="seo-desc-ar" class="db-set__textarea db-set__input" dir="rtl" maxlength="320"
                [ngModel]="seoMetaDescriptionAr ?? ''" (ngModelChange)="seoMetaDescriptionAr = $event || null"></textarea>
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="seo-keywords">{{ 'settings_page.seo_keywords' | translate }}</label>
              <input id="seo-keywords" class="db-set__input" type="text" maxlength="500"
                [ngModel]="seoKeywords ?? ''" (ngModelChange)="seoKeywords = $event || null"
                placeholder="keyword1, keyword2, keyword3" />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="seo-canonical">{{ 'settings_page.seo_canonical_url' | translate }}</label>
              <input id="seo-canonical" class="db-set__input" type="url" maxlength="2048"
                [ngModel]="seoCanonicalUrl ?? ''" (ngModelChange)="seoCanonicalUrl = $event || null"
                placeholder="https://example.com/page" />
            </div>

            <div class="db-set__section-title">{{ 'settings_page.seo_tracking_section' | translate }}</div>
            <div class="db-set__field">
              <label class="db-set__label" for="seo-ga">{{ 'settings_page.seo_google_analytics' | translate }}</label>
              <input id="seo-ga" class="db-set__input db-set__input--narrow" type="text" maxlength="64"
                [ngModel]="seoGoogleAnalyticsId ?? ''" (ngModelChange)="seoGoogleAnalyticsId = $event || null"
                placeholder="G-XXXXXXXXXX" />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="seo-fb">{{ 'settings_page.seo_facebook_pixel' | translate }}</label>
              <input id="seo-fb" class="db-set__input db-set__input--narrow" type="text" maxlength="64"
                [ngModel]="seoFacebookPixelId ?? ''" (ngModelChange)="seoFacebookPixelId = $event || null"
                placeholder="XXXXXXXXXXXXXXXXXX" />
            </div>

            <button class="db-set__save-btn" type="button" [disabled]="saving()" (click)="saveSeo()">
              @if (saving()) { <span class="db-set__spinner" aria-hidden="true"></span> }
              {{ 'settings_page.save_btn' | translate }}
            </button>
          }
        </div>
      }

      <!-- Payments tab -->
      @if (activeTab() === 'payments') {
        <div class="db-set__panel">
          @if (paymentsLoading()) {
            <div class="db-set__loading-msg">{{ 'common.loading' | translate }}</div>
          } @else {
            <div class="db-set__section-title">{{ 'settings_page.payments_methods_title' | translate }}</div>
            <div class="db-set__pay-list">
              @for (method of paymentMethods; track method.key) {
                <div class="db-set__pay-row">
                  <div class="db-set__pay-info">
                    <span class="db-set__pay-name">{{ ('settings_page.payment_method_' + method.key) | translate }}</span>
                    <span class="db-set__pay-key">{{ method.key }}</span>
                  </div>
                  <input class="db-set__checkbox" type="checkbox" [(ngModel)]="method.isEnabled" />
                </div>
              }
            </div>
            <button class="db-set__save-btn" type="button" [disabled]="saving()" (click)="savePayments()">
              @if (saving()) { <span class="db-set__spinner" aria-hidden="true"></span> }
              {{ 'settings_page.save_btn' | translate }}
            </button>
          }
        </div>
      }

      <!-- Notifications tab -->
      @if (activeTab() === 'notifications') {
        <div class="db-set__panel">
          @if (notificationsLoading()) {
            <div class="db-set__loading-msg">{{ 'common.loading' | translate }}</div>
          } @else {
            <div class="db-set__notif-grid">
              <div class="db-set__notif-header">
                <span></span>
                <span class="db-set__notif-ch">{{ 'settings_page.notif_email' | translate }}</span>
                <span class="db-set__notif-ch">{{ 'settings_page.notif_sms' | translate }}</span>
                <span class="db-set__notif-ch">{{ 'settings_page.notif_push' | translate }}</span>
              </div>
              @for (event of notifEvents; track event.key) {
                <div class="db-set__notif-row">
                  <span class="db-set__notif-event">{{ event.labelKey | translate }}</span>
                  <input class="db-set__checkbox" type="checkbox" [(ngModel)]="notifications[event.key].email" />
                  <input class="db-set__checkbox" type="checkbox" [(ngModel)]="notifications[event.key].sms" />
                  <input class="db-set__checkbox" type="checkbox" [(ngModel)]="notifications[event.key].push" />
                </div>
              }
            </div>
            <button class="db-set__save-btn" type="button" [disabled]="saving()" (click)="saveNotifications()">
              @if (saving()) { <span class="db-set__spinner" aria-hidden="true"></span> }
              {{ 'settings_page.save_btn' | translate }}
            </button>
          }
        </div>
      }

      <!-- Orders tab -->
      @if (activeTab() === 'orders') {
        <div class="db-set__panel">
          @if (ordersLoading()) {
            <div class="db-set__loading-msg">{{ 'common.loading' | translate }}</div>
          } @else {
            <div class="db-set__section-title">{{ 'settings_page.orders_order_types' | translate }}</div>
            <div class="db-set__toggle-row">
              <label class="db-set__toggle-label">{{ 'settings_page.orders_delivery' | translate }}</label>
              <input class="db-set__checkbox" type="checkbox" [(ngModel)]="ordersAllowDelivery" />
            </div>
            <div class="db-set__toggle-row">
              <label class="db-set__toggle-label">{{ 'settings_page.orders_pickup' | translate }}</label>
              <input class="db-set__checkbox" type="checkbox" [(ngModel)]="ordersAllowPickup" />
            </div>
            <div class="db-set__toggle-row">
              <label class="db-set__toggle-label">{{ 'settings_page.orders_dine_in' | translate }}</label>
              <input class="db-set__checkbox" type="checkbox" [(ngModel)]="ordersAllowDineIn" />
            </div>

            <div class="db-set__section-title">{{ 'settings_page.orders_automation' | translate }}</div>
            <div class="db-set__toggle-row">
              <label class="db-set__toggle-label">{{ 'settings_page.orders_auto_confirm' | translate }}</label>
              <input class="db-set__checkbox" type="checkbox" [(ngModel)]="ordersAutoConfirm" />
            </div>
            <div class="db-set__toggle-row">
              <label class="db-set__toggle-label">{{ 'settings_page.orders_scheduling' | translate }}</label>
              <input class="db-set__checkbox" type="checkbox" [(ngModel)]="ordersScheduling" />
            </div>

            <div class="db-set__field">
              <label class="db-set__label" for="order-prefix">{{ 'settings_page.orders_prefix' | translate }}</label>
              <input
                id="order-prefix"
                class="db-set__input db-set__input--narrow"
                type="text"
                maxlength="10"
                [ngModel]="ordersPrefix ?? ''"
                (ngModelChange)="ordersPrefix = $event || null"
                placeholder="ORD"
              />
            </div>

            <button
              class="db-set__save-btn"
              type="button"
              [disabled]="saving()"
              (click)="saveOrders()"
            >
              @if (saving()) { <span class="db-set__spinner" aria-hidden="true"></span> }
              {{ 'settings_page.save_btn' | translate }}
            </button>
          }
        </div>
      }

      <!-- Tax tab -->
      @if (activeTab() === 'tax') {
        <div class="db-set__panel">
          @if (taxLoading()) {
            <div class="db-set__loading-msg">{{ 'common.loading' | translate }}</div>
          } @else {
            <div class="db-set__toggle-row">
              <label class="db-set__toggle-label" for="tax-enabled">{{ 'settings_page.tax_enabled' | translate }}</label>
              <input id="tax-enabled" class="db-set__checkbox" type="checkbox" [(ngModel)]="taxEnabled" />
            </div>

            <div class="db-set__field">
              <label class="db-set__label" for="tax-name-en">{{ 'settings_page.tax_name_en' | translate }}</label>
              <input id="tax-name-en" class="db-set__input" type="text"
                [ngModel]="taxNameEn ?? ''" (ngModelChange)="taxNameEn = $event || null"
                placeholder="VAT" maxlength="100" />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="tax-name-ar">{{ 'settings_page.tax_name_ar' | translate }}</label>
              <input id="tax-name-ar" class="db-set__input" type="text" dir="rtl"
                [ngModel]="taxNameAr ?? ''" (ngModelChange)="taxNameAr = $event || null"
                placeholder="ضريبة القيمة المضافة" maxlength="100" />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="tax-rate">{{ 'settings_page.tax_rate' | translate }}</label>
              <input id="tax-rate" class="db-set__input db-set__input--narrow" type="number"
                min="0" max="100" step="0.01" [(ngModel)]="taxRate" />
            </div>
            <div class="db-set__toggle-row">
              <label class="db-set__toggle-label" for="tax-inclusive">{{ 'settings_page.tax_inclusive' | translate }}</label>
              <input id="tax-inclusive" class="db-set__checkbox" type="checkbox" [(ngModel)]="taxInclusive" />
            </div>
            <div class="db-set__field">
              <label class="db-set__label" for="tax-reg">{{ 'settings_page.tax_registration' | translate }}</label>
              <input id="tax-reg" class="db-set__input" type="text"
                [ngModel]="taxRegNumber ?? ''" (ngModelChange)="taxRegNumber = $event || null"
                maxlength="50" />
            </div>

            <button class="db-set__save-btn" type="button" [disabled]="saving()" (click)="saveTax()">
              @if (saving()) { <span class="db-set__spinner" aria-hidden="true"></span> }
              {{ 'settings_page.save_btn' | translate }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .db-set {
      padding-block: var(--space-xl, 2rem);
      padding-inline: var(--space-xl, 2rem);
      max-inline-size: 800px;
    }

    .db-set__header { margin-block-end: 1.5rem; }

    .db-set__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-set__tabs {
      display: flex;
      gap: 0;
      border-block-end: 1px solid var(--border);
      margin-block-end: 1.5rem;
      overflow-x: auto;
    }

    .db-set__tab {
      padding-block: 0.75rem;
      padding-inline: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-block-end: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: color var(--motion-fast), border-color var(--motion-fast);
    }

    .db-set__tab:hover { color: var(--text); }

    .db-set__tab--active {
      color: var(--accent);
      border-block-end-color: var(--accent);
      font-weight: 600;
    }

    .db-set__success {
      padding: 0.875rem 1rem;
      background: color-mix(in srgb, var(--success) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
      border-radius: var(--radius-control);
      color: var(--success);
      font-size: 0.875rem;
      font-weight: 500;
      margin-block-end: 1rem;
    }

    .db-set__error-banner {
      padding: 0.875rem 1rem;
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-control);
      color: var(--error);
      font-size: 0.875rem;
      margin-block-end: 1rem;
    }

    .db-set__panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    .db-set__panel--stub {
      align-items: center;
      padding-block: 3rem;
    }

    .db-set__stub-text {
      color: var(--text-muted);
      font-size: 0.9375rem;
      margin: 0;
    }

    .db-set__loading-msg { color: var(--text-muted); font-size: 0.875rem; }

    .db-set__field { display: flex; flex-direction: column; gap: 0.375rem; }

    .db-set__label { font-size: 0.875rem; font-weight: 600; color: var(--text); }

    .db-set__input {
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

    .db-set__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-set__input:disabled { opacity: 0.5; cursor: not-allowed; }

    .db-set__input--narrow { max-inline-size: 200px; }
    .db-set__input--time { max-inline-size: 140px; }

    .db-set__textarea {
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.5rem;
      padding-inline: 0.75rem;
      outline: none;
      block-size: auto;
      min-block-size: 80px;
      resize: vertical;
      box-sizing: border-box;
    }

    .db-set__textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-set__checkbox { inline-size: 18px; block-size: 18px; cursor: pointer; accent-color: var(--accent); }

    .db-set__section-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text);
      padding-block-end: 0.25rem;
      border-block-end: 1px solid var(--border);
    }

    .db-set__hours-table { display: flex; flex-direction: column; gap: 0.5rem; }

    .db-set__hours-header {
      display: grid;
      grid-template-columns: 120px 1fr 1fr 60px;
      gap: 0.75rem;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding-inline: 0.25rem;
    }

    .db-set__hours-row {
      display: grid;
      grid-template-columns: 120px 1fr 1fr 60px;
      gap: 0.75rem;
      align-items: center;
      padding: 0.5rem 0.25rem;
      border-radius: var(--radius-control);
      transition: background-color var(--motion-fast) ease;
    }

    .db-set__hours-row:hover { background: var(--surface-alt); }

    .db-set__day-name { font-size: 0.875rem; font-weight: 500; color: var(--text); }

    .db-set__save-btn {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding-block: 0.5rem;
      padding-inline: 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      background: var(--accent);
      color: var(--on-accent);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-base) ease;
    }

    .db-set__save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .db-set__save-btn:hover:not(:disabled) { background: var(--accent-hover); }

    .db-set__spinner {
      display: inline-block;
      inline-size: 14px;
      block-size: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-block-start-color: var(--on-accent);
      border-radius: 50%;
      animation: db-set-spin 0.7s linear infinite;
    }

    @keyframes db-set-spin { to { transform: rotate(360deg); } }

    .db-set__toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-block: 0.375rem;
    }
    .db-set__toggle-label { font-size: 0.875rem; color: var(--text); }

    .db-set__notif-grid { display: flex; flex-direction: column; gap: 0.25rem; }
    .db-set__notif-header, .db-set__notif-row {
      display: grid;
      grid-template-columns: 1fr 60px 60px 60px;
      gap: 0.5rem;
      align-items: center;
      padding-block: 0.375rem;
      padding-inline: 0.25rem;
    }
    .db-set__notif-header { font-size: 0.75rem; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; }
    .db-set__notif-row:hover { background: var(--surface-alt); border-radius: var(--radius-control); }
    .db-set__notif-ch { text-align: center; }
    .db-set__notif-event { font-size: 0.875rem; color: var(--text); }

    .db-set__pay-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .db-set__pay-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      background: var(--surface-alt);
    }
    .db-set__pay-info { display: flex; flex-direction: column; gap: 0.125rem; }
    .db-set__pay-name { font-size: 0.875rem; font-weight: 600; color: var(--text); }
    .db-set__pay-key { font-size: 0.75rem; color: var(--text-muted); }
  `],
})
export class SettingsComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);

  readonly activeTab = signal<SettingsTab>('general');
  readonly saving = signal(false);
  readonly successMsg = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly generalLoading = signal(false);
  readonly brandingLoading = signal(false);
  readonly deliveryLoading = signal(false);
  readonly socialLoading = signal(false);
  readonly seoLoading = signal(false);
  readonly ordersLoading = signal(false);
  readonly notificationsLoading = signal(false);
  readonly taxLoading = signal(false);
  readonly paymentsLoading = signal(false);

  // General
  preparationTime = 30;
  businessHours: BusinessHour[] = defaultBusinessHours();

  // Branding
  brandingPrimaryColor = '';
  brandingHeaderColor = '';
  brandingLogoUrl = '';
  brandingCoverUrl = '';

  // Delivery
  deliveryMinOrder = 0;
  deliveryFreeThreshold: number | null = null;

  // Social
  socialLinks: SocialLinks = { instagram: null, twitter: null, facebook: null, whatsapp: null, tiktok: null };

  // SEO
  seoMetaTitleEn: string | null = null;
  seoMetaTitleAr: string | null = null;
  seoMetaDescriptionEn: string | null = null;
  seoMetaDescriptionAr: string | null = null;
  seoKeywords: string | null = null;
  seoGoogleAnalyticsId: string | null = null;
  seoFacebookPixelId: string | null = null;
  seoCanonicalUrl: string | null = null;

  // Orders
  ordersAutoConfirm = false;
  ordersAllowDelivery = true;
  ordersAllowPickup = true;
  ordersAllowDineIn = false;
  ordersPrefix: string | null = null;
  ordersScheduling = false;

  // Notifications
  notifications: NotificationSettings = {
    newOrder: { email: true, sms: false, push: true },
    orderStatusUpdate: { email: true, sms: false, push: true },
    newCustomer: { email: true, sms: false, push: false },
    lowStock: { email: true, sms: false, push: false },
    paymentReceived: { email: true, sms: false, push: false },
    orderCancelled: { email: true, sms: false, push: true },
  };

  // Tax
  taxEnabled = false;
  taxNameEn: string | null = null;
  taxNameAr: string | null = null;
  taxRate = 0;
  taxInclusive = false;
  taxRegNumber: string | null = null;

  // Payments
  paymentMethods: PaymentMethod[] = [
    { key: 'cash', isEnabled: true },
    { key: 'knet', isEnabled: false },
    { key: 'card', isEnabled: false },
  ];

  readonly notifEvents: Array<{ key: keyof NotificationSettings; labelKey: string }> = [
    { key: 'newOrder',          labelKey: 'settings_page.notif_event_new_order' },
    { key: 'orderStatusUpdate', labelKey: 'settings_page.notif_event_status_update' },
    { key: 'newCustomer',       labelKey: 'settings_page.notif_event_new_customer' },
    { key: 'lowStock',          labelKey: 'settings_page.notif_event_low_stock' },
    { key: 'paymentReceived',   labelKey: 'settings_page.notif_event_payment' },
    { key: 'orderCancelled',    labelKey: 'settings_page.notif_event_cancelled' },
  ];

  readonly socialFields: Array<{ key: keyof SocialLinks; labelKey: string }> = [
    { key: 'instagram', labelKey: 'settings_page.social_instagram' },
    { key: 'twitter', labelKey: 'settings_page.social_twitter' },
    { key: 'facebook', labelKey: 'settings_page.social_facebook' },
    { key: 'whatsapp', labelKey: 'settings_page.social_whatsapp' },
    { key: 'tiktok', labelKey: 'settings_page.social_tiktok' },
  ];

  readonly tabs: Array<{ id: SettingsTab; labelKey: string }> = [
    { id: 'general',  labelKey: 'settings_page.tab_general' },
    { id: 'branding', labelKey: 'settings_page.tab_branding' },
    { id: 'delivery', labelKey: 'settings_page.tab_delivery' },
    { id: 'social',   labelKey: 'settings_page.tab_social' },
    { id: 'seo',      labelKey: 'settings_page.tab_seo' },
    { id: 'payments', labelKey: 'settings_page.tab_payments' },
    { id: 'orders',   labelKey: 'settings_page.tab_orders' },
    { id: 'notifications', labelKey: 'settings_page.tab_notifications' },
    { id: 'tax',           labelKey: 'settings_page.tab_tax' },
  ];

  ngOnInit(): void {
    this.loadGeneral();
    this.loadBranding();
    this.loadDelivery();
    this.loadSocial();
    this.loadSeo();
    this.loadOrders();
    this.loadNotifications();
    this.loadTax();
    this.loadPayments();
  }

  switchTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
    this.successMsg.set(false);
    this.saveError.set(null);
  }

  // ── Load methods ────────────────────────────────────────────────────────────

  loadGeneral(): void {
    this.generalLoading.set(true);
    this.settingsService.getGeneral().subscribe({
      next: (data: any) => {
        this.preparationTime = data.preparationTime ?? 30;
        const mapped: BusinessHour[] = (data.businessHours ?? []).map((h: any) => ({
          dayOfWeek: dayIndex(h.dayOfWeek),
          openTime: h.opensAt ?? '09:00',
          closeTime: h.closesAt ?? '22:00',
          isClosed: !h.isOpen,
        }));
        this.businessHours = mapped.length > 0 ? mapped : defaultBusinessHours();
        this.generalLoading.set(false);
      },
      error: () => this.generalLoading.set(false),
    });
  }

  loadBranding(): void {
    this.brandingLoading.set(true);
    this.settingsService.getBranding().subscribe({
      next: (data) => {
        this.brandingPrimaryColor = data.primaryColor ?? '';
        this.brandingHeaderColor = data.headerFooterColor ?? '';
        this.brandingLogoUrl = data.logoUrl ?? '';
        this.brandingCoverUrl = data.coverPhotoUrl ?? '';
        this.brandingLoading.set(false);
      },
      error: () => this.brandingLoading.set(false),
    });
  }

  loadDelivery(): void {
    this.deliveryLoading.set(true);
    this.settingsService.getDelivery().subscribe({
      next: (data) => {
        this.deliveryMinOrder = data.minOrderAmount;
        this.deliveryFreeThreshold = data.freeDeliveryThreshold;
        this.deliveryLoading.set(false);
      },
      error: () => this.deliveryLoading.set(false),
    });
  }

  loadSocial(): void {
    this.socialLoading.set(true);
    this.settingsService.getSocialLinks().subscribe({
      next: (data) => {
        this.socialLinks = { ...data };
        this.socialLoading.set(false);
      },
      error: () => this.socialLoading.set(false),
    });
  }

  loadSeo(): void {
    this.seoLoading.set(true);
    this.settingsService.getSeo().subscribe({
      next: (data: any) => {
        this.seoMetaTitleEn = data.metaTitleEn ?? null;
        this.seoMetaTitleAr = data.metaTitleAr ?? null;
        this.seoMetaDescriptionEn = data.metaDescriptionEn ?? null;
        this.seoMetaDescriptionAr = data.metaDescriptionAr ?? null;
        this.seoKeywords = data.keywords ?? null;
        this.seoGoogleAnalyticsId = data.googleAnalyticsId ?? null;
        this.seoFacebookPixelId = data.facebookPixelId ?? null;
        this.seoCanonicalUrl = data.canonicalUrl ?? null;
        this.seoLoading.set(false);
      },
      error: () => this.seoLoading.set(false),
    });
  }

  loadOrders(): void {
    this.ordersLoading.set(true);
    this.settingsService.getOrders().subscribe({
      next: (data) => {
        this.ordersAutoConfirm = data.autoConfirmOrders ?? false;
        this.ordersAllowDelivery = data.allowDelivery ?? true;
        this.ordersAllowPickup = data.allowPickup ?? true;
        this.ordersAllowDineIn = data.allowDineIn ?? false;
        this.ordersPrefix = data.orderNumberPrefix ?? null;
        this.ordersScheduling = data.schedulingEnabled ?? false;
        this.ordersLoading.set(false);
      },
      error: () => this.ordersLoading.set(false),
    });
  }

  loadNotifications(): void {
    this.notificationsLoading.set(true);
    this.settingsService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = {
          newOrder: data.newOrder ?? { email: true, sms: false, push: true },
          orderStatusUpdate: data.orderStatusUpdate ?? { email: true, sms: false, push: true },
          newCustomer: data.newCustomer ?? { email: true, sms: false, push: false },
          lowStock: data.lowStock ?? { email: true, sms: false, push: false },
          paymentReceived: data.paymentReceived ?? { email: true, sms: false, push: false },
          orderCancelled: data.orderCancelled ?? { email: true, sms: false, push: true },
        };
        this.notificationsLoading.set(false);
      },
      error: () => this.notificationsLoading.set(false),
    });
  }

  // ── Save methods ────────────────────────────────────────────────────────────

  private handleSave<T>(obs: import('rxjs').Observable<T>): void {
    this.saving.set(true);
    this.successMsg.set(false);
    this.saveError.set(null);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.successMsg.set(true);
        setTimeout(() => this.successMsg.set(false), 3000);
      },
      error: (err: any) => {
        const msg = err?.details?.length > 0
          ? err.details.map((d: any) => d.message).join(' ')
          : (err?.message || 'Failed to save settings.');
        this.saveError.set(msg);
        this.saving.set(false);
      },
    });
  }

  saveGeneral(): void {
    const body: any = {
      preparationTime: this.preparationTime,
      businessHours: this.businessHours.map((h) => ({
        dayOfWeek: DAY_NAMES[h.dayOfWeek],
        isOpen: !h.isClosed,
        opensAt: h.isClosed ? null : h.openTime,
        closesAt: h.isClosed ? null : h.closeTime,
      })),
    };
    this.handleSave(this.settingsService.updateGeneral(body));
  }

  saveBranding(): void {
    this.handleSave(this.settingsService.updateBranding({
      primaryColor: this.brandingPrimaryColor || null,
      headerFooterColor: this.brandingHeaderColor || null,
      logoUrl: this.brandingLogoUrl || null,
      faviconUrl: null,
      coverPhotoUrl: this.brandingCoverUrl || null,
    }));
  }

  saveDelivery(): void {
    this.handleSave(this.settingsService.updateDelivery({
      minOrderAmount: this.deliveryMinOrder,
      freeDeliveryThreshold: this.deliveryFreeThreshold,
    }));
  }

  saveSocial(): void {
    this.handleSave(this.settingsService.updateSocialLinks({ ...this.socialLinks }));
  }

  saveSeo(): void {
    this.handleSave(this.settingsService.updateSeo({
      metaTitleEn: this.seoMetaTitleEn || null,
      metaTitleAr: this.seoMetaTitleAr || null,
      metaDescriptionEn: this.seoMetaDescriptionEn || null,
      metaDescriptionAr: this.seoMetaDescriptionAr || null,
      keywords: this.seoKeywords || null,
      googleAnalyticsId: this.seoGoogleAnalyticsId || null,
      facebookPixelId: this.seoFacebookPixelId || null,
      canonicalUrl: this.seoCanonicalUrl || null,
    }));
  }

  saveOrders(): void {
    this.handleSave(this.settingsService.updateOrders({
      autoConfirmOrders: this.ordersAutoConfirm,
      allowDelivery: this.ordersAllowDelivery,
      allowPickup: this.ordersAllowPickup,
      allowDineIn: this.ordersAllowDineIn,
      orderNumberPrefix: this.ordersPrefix || null,
      schedulingEnabled: this.ordersScheduling,
    }));
  }

  saveNotifications(): void {
    this.handleSave(this.settingsService.updateNotifications({ ...this.notifications }));
  }

  loadTax(): void {
    this.taxLoading.set(true);
    this.settingsService.getTax().subscribe({
      next: (data) => {
        this.taxEnabled = data.isEnabled ?? false;
        this.taxNameEn = data.taxNameEn ?? null;
        this.taxNameAr = data.taxNameAr ?? null;
        this.taxRate = data.taxRate ?? 0;
        this.taxInclusive = data.taxInclusive ?? false;
        this.taxRegNumber = data.registrationNumber ?? null;
        this.taxLoading.set(false);
      },
      error: () => this.taxLoading.set(false),
    });
  }

  saveTax(): void {
    this.handleSave(this.settingsService.updateTax({
      isEnabled: this.taxEnabled,
      taxNameEn: this.taxNameEn || null,
      taxNameAr: this.taxNameAr || null,
      taxRate: this.taxRate,
      taxInclusive: this.taxInclusive,
      registrationNumber: this.taxRegNumber || null,
    }));
  }

  loadPayments(): void {
    this.paymentsLoading.set(true);
    this.settingsService.getPaymentMethods().subscribe({
      next: (data) => {
        if (data.methods && data.methods.length > 0) {
          this.paymentMethods = [...data.methods];
        }
        this.paymentsLoading.set(false);
      },
      error: () => this.paymentsLoading.set(false),
    });
  }

  savePayments(): void {
    this.handleSave(this.settingsService.updatePaymentMethods({ methods: [...this.paymentMethods] }));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  dayName(dayOfWeek: number): string {
    return DAY_NAMES[dayOfWeek] ?? String(dayOfWeek);
  }

  getSocialValue(key: keyof SocialLinks): string {
    return this.socialLinks[key] ?? '';
  }

  setSocialValue(key: keyof SocialLinks, value: string): void {
    this.socialLinks = { ...this.socialLinks, [key]: value || null };
  }
}
