import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
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
    `,
  ],
})
export class RestaurantHomeComponent implements OnInit {
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly seo = inject(SeoService);
  private readonly catalogService = inject(CatalogService);
  private readonly langToggle = inject(LanguageToggleService);
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
    // Navigation is handled by routerLink in the card for item-detail page
  }
}
