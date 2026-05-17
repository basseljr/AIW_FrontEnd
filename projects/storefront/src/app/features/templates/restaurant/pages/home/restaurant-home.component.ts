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
import { DecimalPipe } from '@angular/common';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent } from '@shared/ui';
import { TenantConfigService } from '../../../../../core/services/tenant-config.service';
import { SeoService } from '../../../../../core/services/seo.service';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { CartService } from '../../../../../core/services/cart.service';
import { CatalogItem } from '../../../../../core/models/catalog.model';
import { RestaurantMenuItemCardComponent } from '../../components/menu-item-card/restaurant-menu-item-card.component';

@Component({
  selector: 'sf-restaurant-home',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    DecimalPipe,
    SkeletonComponent,
    RestaurantMenuItemCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ─── Hero ──────────────────────────────────────────────── -->
    <section class="sf-home-hero">
      <div class="sf-home-hero__inner">
        <div class="sf-home-hero__text">
          <span class="sf-home-hero__badge">{{ 'home.hero_badge' | translate }}</span>
          <h1 class="sf-home-hero__title">
            {{ 'home.hero_title' | translate }}
          </h1>
          <p class="sf-home-hero__subtitle">
            @if (tagline()) {
              {{ tagline() }}
            } @else {
              {{ 'home.hero_subtitle' | translate }}
            }
          </p>
          <div class="sf-home-hero__actions">
            <a
              class="sf-home-hero__btn sf-home-hero__btn--primary"
              [routerLink]="['/', lang(), 'menu']"
            >
              {{ 'home.order_now' | translate }}
            </a>
            <a
              class="sf-home-hero__btn sf-home-hero__btn--outline"
              [routerLink]="['/', lang(), 'menu']"
            >
              {{ 'home.view_menu' | translate }}
            </a>
          </div>
        </div>

        <div class="sf-home-hero__image-wrap" aria-hidden="true">
          @if (coverImage()) {
            <img
              class="sf-home-hero__image"
              [src]="coverImage()"
              [alt]="businessName()"
              loading="eager"
              width="600"
              height="500"
            />
          } @else {
            <div class="sf-home-hero__image-placeholder">
              <div class="sf-home-hero__image-glow"></div>
              <div class="sf-home-hero__food-icon" aria-hidden="true">🍽️</div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ─── Popular Dishes ───────────────────────────────────── -->
    <section class="sf-home-dishes">
      <div class="sf-home-section">
        <div class="sf-home-section__heading">
          <h2 class="sf-home-section__title">{{ 'home.popular_dishes' | translate }}</h2>
          <div class="sf-home-section__accent"></div>
          <p class="sf-home-section__sub">{{ 'home.popular_dishes_sub' | translate }}</p>
        </div>

        @if (loading()) {
          <div class="sf-home-dishes__grid">
            @for (_ of skeletons; track $index) {
              <div class="sf-home-dishes__skeleton-card">
                <ui-skeleton variant="block" height="192px" />
                <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                  <ui-skeleton variant="text" width="70%" />
                  <ui-skeleton variant="text" width="50%" />
                </div>
              </div>
            }
          </div>
        } @else if (featuredItems().length > 0) {
          <div class="sf-home-dishes__grid">
            @for (item of featuredItems(); track item.id) {
              <sf-restaurant-menu-item-card
                [item]="item"
                [lang]="lang()"
                (viewItem)="onViewItem(item)"
              />
            }
          </div>
          <div class="sf-home-section__cta">
            <a class="sf-home__view-all" [routerLink]="['/', lang(), 'menu']">
              {{ 'home.view_all_dishes' | translate }}
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </a>
          </div>
        }
      </div>
    </section>

    <!-- ─── Business Info Bar ───────────────────────────────── -->
    @if (phone() || address() || workingHours()) {
      <section class="sf-home-info-bar">
        <div class="sf-home-info-bar__inner">
          @if (workingHours()) {
            <div class="sf-home-info-bar__item">
              <svg class="sf-home-info-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>{{ workingHours() }}</span>
            </div>
          }
          @if (address()) {
            <div class="sf-home-info-bar__item">
              <svg class="sf-home-info-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <span>{{ address() }}</span>
            </div>
          }
          @if (phone()) {
            <div class="sf-home-info-bar__item">
              <svg class="sf-home-info-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.59 2.72h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.46 17.46z"/></svg>
              <a [href]="'tel:' + phone()" class="sf-home-info-bar__link">{{ phone() }}</a>
            </div>
          }
        </div>
      </section>
    }

    <!-- ─── Features Section ─────────────────────────────────── -->
    <section class="sf-home-features">
      <div class="sf-home-section">
        <div class="sf-home-section__heading">
          <h2 class="sf-home-section__title sf-home-section__title--light">
            {{ 'home.what_makes_us_special' | translate }}
          </h2>
          <div class="sf-home-section__accent sf-home-section__accent--light"></div>
          <p class="sf-home-section__sub sf-home-section__sub--light">
            {{ 'home.special_subtitle' | translate }}
          </p>
        </div>

        <div class="sf-home-features__grid">
          <div class="sf-home-features__card">
            <div class="sf-home-features__icon" aria-hidden="true">🌿</div>
            <h3 class="sf-home-features__title">{{ 'home.fresh_ingredients' | translate }}</h3>
            <p class="sf-home-features__desc">{{ 'home.fresh_ingredients_desc' | translate }}</p>
          </div>
          <div class="sf-home-features__card">
            <div class="sf-home-features__icon" aria-hidden="true">⚡</div>
            <h3 class="sf-home-features__title">{{ 'home.fast_delivery' | translate }}</h3>
            <p class="sf-home-features__desc">{{ 'home.fast_delivery_desc' | translate }}</p>
          </div>
          <div class="sf-home-features__card">
            <div class="sf-home-features__icon" aria-hidden="true">⭐</div>
            <h3 class="sf-home-features__title">{{ 'home.premium_quality' | translate }}</h3>
            <p class="sf-home-features__desc">{{ 'home.premium_quality_desc' | translate }}</p>
          </div>
          <div class="sf-home-features__card">
            <div class="sf-home-features__icon" aria-hidden="true">🕐</div>
            <h3 class="sf-home-features__title">{{ 'home.open_now' | translate }}</h3>
            <p class="sf-home-features__desc">{{ workingHours() }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Social Links ─────────────────────────────────────── -->
    @if (hasSocialLinks()) {
      <section class="sf-home-social">
        <div class="sf-home-section">
          <p class="sf-home-social__label">{{ 'home.follow_us' | translate }}</p>
          <div class="sf-home-social__list">
            @if (instagram()) {
              <a [href]="instagram()" class="sf-home-social__link" target="_blank" rel="noopener" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            }
            @if (twitter()) {
              <a [href]="twitter()" class="sf-home-social__link" target="_blank" rel="noopener" aria-label="Twitter/X">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.261 5.633L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
              </a>
            }
            @if (facebook()) {
              <a [href]="facebook()" class="sf-home-social__link" target="_blank" rel="noopener" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            }
            @if (whatsapp()) {
              <a [href]="'https://wa.me/' + whatsapp()" class="sf-home-social__link sf-home-social__link--whatsapp" target="_blank" rel="noopener" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              </a>
            }
            @if (tiktok()) {
              <a [href]="tiktok()" class="sf-home-social__link" target="_blank" rel="noopener" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
              </a>
            }
          </div>
        </div>
      </section>
    }
  `,
  styles: [
    `
      /* ─── Hero ──────────────────────────────────────── */
      .sf-home-hero {
        background: var(--color-background, #fff8f1);
        padding-block: 4rem 3rem;
        padding-inline: 1.5rem;
        overflow: hidden;
      }
      .sf-home-hero__inner {
        max-inline-size: 80rem;
        margin-inline: auto;
        display: grid;
        grid-template-columns: 1fr;
        gap: 3rem;
        align-items: center;
      }
      @media (min-width: 768px) {
        .sf-home-hero__inner {
          grid-template-columns: 1fr 1fr;
        }
        .sf-home-hero {
          padding-block: 5rem 4rem;
        }
      }

      .sf-home-hero__badge {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-primary-container, #f2a922);
        border: 1.5px solid var(--color-primary-container, #f2a922);
        padding-block: 0.25rem;
        padding-inline: 0.875rem;
        border-radius: 9999px;
        margin-block-end: 1.25rem;
      }
      .sf-home-hero__title {
        font-size: clamp(2.25rem, 5vw, 3.75rem);
        font-weight: 900;
        color: var(--color-primary, #805600);
        line-height: 1.1;
        letter-spacing: -0.03em;
        margin: 0 0 1.25rem;
      }
      .sf-home-hero__subtitle {
        font-size: 1.0625rem;
        color: var(--color-on-surface-variant, #514534);
        line-height: 1.7;
        margin: 0 0 2rem;
        max-inline-size: 36rem;
      }
      .sf-home-hero__actions {
        display: flex;
        gap: 0.875rem;
        flex-wrap: wrap;
      }
      .sf-home-hero__btn {
        display: inline-flex;
        align-items: center;
        padding-block: 0.75rem;
        padding-inline: 1.75rem;
        border-radius: 9999px;
        font-size: 1rem;
        font-weight: 700;
        text-decoration: none;
        transition: background-color 0.2s, color 0.2s, border-color 0.2s;
        white-space: nowrap;
      }
      .sf-home-hero__btn--primary {
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        border: 2px solid var(--color-primary, #805600);
      }
      .sf-home-hero__btn--primary:hover {
        background: var(--color-primary-container, #f2a922);
        border-color: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }
      .sf-home-hero__btn--outline {
        background: transparent;
        color: var(--color-primary, #805600);
        border: 2px solid var(--color-primary, #805600);
      }
      .sf-home-hero__btn--outline:hover {
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
      }

      .sf-home-hero__image-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        order: -1;
      }
      @media (min-width: 768px) {
        .sf-home-hero__image-wrap {
          order: 0;
        }
      }
      .sf-home-hero__image {
        inline-size: 100%;
        max-inline-size: 480px;
        block-size: auto;
        border-radius: 20px;
        object-fit: cover;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        transform: rotate(2deg);
      }
      .sf-home-hero__image-placeholder {
        position: relative;
        inline-size: 100%;
        max-inline-size: 480px;
        aspect-ratio: 1;
        border-radius: 20px;
        background: var(--color-surface-container, #f4ede5);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .sf-home-hero__image-glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse at center,
          color-mix(in srgb, var(--color-primary-container, #f2a922) 40%, transparent),
          transparent 70%
        );
      }
      .sf-home-hero__food-icon {
        font-size: 8rem;
        position: relative;
        z-index: 1;
      }

      /* ─── Shared section ──────────────────────────── */
      .sf-home-section {
        max-inline-size: 80rem;
        margin-inline: auto;
        padding-inline: 1.5rem;
      }
      .sf-home-section__heading {
        text-align: center;
        margin-block-end: 2.5rem;
      }
      .sf-home-section__title {
        font-size: clamp(1.75rem, 3vw, 2.5rem);
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin: 0 0 0.5rem;
        letter-spacing: -0.02em;
      }
      .sf-home-section__title--light {
        color: var(--color-on-primary, #ffffff);
      }
      .sf-home-section__accent {
        inline-size: 3rem;
        block-size: 3px;
        background: var(--color-primary-container, #f2a922);
        border-radius: 9999px;
        margin-inline: auto;
        margin-block: 0.75rem;
      }
      .sf-home-section__accent--light {
        background: rgba(255, 255, 255, 0.6);
      }
      .sf-home-section__sub {
        font-size: 1rem;
        color: var(--color-on-surface-variant, #514534);
        margin: 0.5rem 0 0;
      }
      .sf-home-section__sub--light {
        color: rgba(255, 255, 255, 0.8);
      }
      .sf-home-section__cta {
        text-align: center;
        margin-block-start: 2rem;
      }

      /* ─── Popular Dishes ─────────────────────────── */
      .sf-home-dishes {
        padding-block: 4rem;
        background: var(--color-background, #fff8f1);
      }
      .sf-home-dishes__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.25rem;
      }
      .sf-home-dishes__skeleton-card {
        background: var(--color-surface, #ffffff);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }

      .sf-home__view-all {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--color-primary, #805600);
        font-size: 1rem;
        font-weight: 700;
        text-decoration: none;
        padding-block: 0.625rem;
        padding-inline: 1.5rem;
        border: 2px solid var(--color-primary, #805600);
        border-radius: 9999px;
        transition: background-color 0.2s, color 0.2s;
      }
      .sf-home__view-all svg {
        inline-size: 1.125rem;
        block-size: 1.125rem;
        transition: transform 0.2s;
      }
      .sf-home__view-all:hover {
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
      }
      .sf-home__view-all:hover svg {
        transform: translateX(3px);
      }

      /* ─── Features ───────────────────────────────── */
      .sf-home-features {
        padding-block: 4rem;
        background: var(--color-primary, #805600);
      }
      .sf-home-features__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.25rem;
      }
      .sf-home-features__card {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        transition: background-color 0.2s;
      }
      .sf-home-features__card:hover {
        background: rgba(255, 255, 255, 0.18);
      }
      .sf-home-features__icon {
        font-size: 2.5rem;
        margin-block-end: 0.875rem;
      }
      .sf-home-features__title {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-on-primary, #ffffff);
        margin: 0 0 0.5rem;
      }
      .sf-home-features__desc {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.6;
        margin: 0;
      }

      /* ─── Info Bar ───────────────────────────────── */
      .sf-home-info-bar {
        background: var(--color-surface-container, #f4ede5);
        border-block: 1px solid var(--color-outline-variant, #d6c4ad);
        padding-block: 0.875rem;
        padding-inline: 1.5rem;
      }
      .sf-home-info-bar__inner {
        max-inline-size: 80rem;
        margin-inline: auto;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        flex-wrap: wrap;
        justify-content: center;
      }
      .sf-home-info-bar__item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--color-on-surface-variant, #514534);
      }
      .sf-home-info-bar__icon {
        inline-size: 1rem;
        block-size: 1rem;
        flex-shrink: 0;
        color: var(--color-primary, #805600);
      }
      .sf-home-info-bar__link {
        color: var(--color-primary, #805600);
        text-decoration: none;
      }
      .sf-home-info-bar__link:hover { text-decoration: underline; }

      /* ─── Social Links ───────────────────────────── */
      .sf-home-social {
        padding-block: 2.5rem;
        background: var(--color-background, #fff8f1);
        border-block-start: 1px solid var(--color-outline-variant, #d6c4ad);
      }
      .sf-home-social__label {
        text-align: center;
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--color-on-surface-variant, #514534);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin: 0 0 1rem;
      }
      .sf-home-social__list {
        display: flex;
        justify-content: center;
        gap: 0.875rem;
        flex-wrap: wrap;
      }
      .sf-home-social__link {
        inline-size: 2.75rem;
        block-size: 2.75rem;
        border-radius: 50%;
        background: var(--color-surface-container, #f4ede5);
        color: var(--color-on-surface-variant, #514534);
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        transition: background-color 0.2s, color 0.2s;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
      }
      .sf-home-social__link:hover {
        background: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
        border-color: transparent;
      }
      .sf-home-social__link--whatsapp:hover {
        background: #25d366;
        color: #fff;
      }
      .sf-home-social__link svg {
        inline-size: 1.125rem;
        block-size: 1.125rem;
      }
    `,
  ],
})
export class RestaurantHomeComponent implements OnInit {
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly seo = inject(SeoService);
  private readonly catalogService = inject(CatalogService);
  private readonly langToggle = inject(LanguageToggleService);
  private readonly router = inject(Router);
  readonly cartService = inject(CartService);

  readonly lang = this.langToggle.current;
  readonly config = computed(() => this.tenantConfig.config());
  readonly businessName = computed(() => {
    const c = this.config();
    if (!c) return '';
    return this.lang() === 'ar' ? c.branding.businessNameAr : c.branding.businessName;
  });
  readonly tagline = computed(() => {
    const c = this.config();
    if (!c) return '';
    return this.lang() === 'ar' ? (c.branding.taglineAr ?? '') : (c.branding.tagline ?? '');
  });
  readonly coverImage = computed(() => this.config()?.branding.coverPhotoUrl ?? null);
  readonly workingHours = computed(() => {
    const c = this.config();
    if (!c) return '';
    return this.lang() === 'ar'
      ? (c.contact.workingHoursAr ?? c.contact.workingHours ?? '')
      : (c.contact.workingHours ?? '');
  });

  readonly phone = computed(() => this.config()?.contact.phone ?? null);
  readonly address = computed(() => {
    const c = this.config();
    if (!c) return null;
    return this.lang() === 'ar' ? (c.contact.addressAr ?? c.contact.address) : c.contact.address;
  });
  readonly instagram = computed(() => this.config()?.socialLinks.instagram ?? null);
  readonly twitter = computed(() => this.config()?.socialLinks.twitter ?? null);
  readonly facebook = computed(() => this.config()?.socialLinks.facebook ?? null);
  readonly whatsapp = computed(() => this.config()?.socialLinks.whatsapp ?? null);
  readonly tiktok = computed(() => this.config()?.socialLinks.tiktok ?? null);
  readonly hasSocialLinks = computed(() =>
    !!(this.instagram() || this.twitter() || this.facebook() || this.whatsapp() || this.tiktok())
  );

  readonly loading = signal(true);
  readonly featuredItems = signal<CatalogItem[]>([]);
  readonly skeletons = new Array(8);

  ngOnInit(): void {
    const config = this.config();
    if (config) {
      this.seo.setPageMeta(
        {
          titleEn: config.branding.businessName,
          titleAr: config.branding.businessNameAr,
          descriptionEn: config.seo.metaDescriptionEn ?? undefined,
          descriptionAr: config.seo.metaDescriptionAr ?? undefined,
          ogImage: config.seo.ogImageUrl ?? undefined,
        },
        config,
        this.lang(),
      );
    }

    this.catalogService.getFeaturedItems().subscribe({
      next: (items) => {
        this.featuredItems.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onViewItem(item: CatalogItem): void {
    if (item.categorySlug && item.slug) {
      this.router.navigate(['/', this.lang(), 'menu', item.categorySlug, item.slug]);
    } else {
      this.router.navigate(['/', this.lang(), 'menu']);
    }
  }
}
