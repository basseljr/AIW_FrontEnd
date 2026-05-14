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

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent } from '@shared/ui';
import { TenantConfigService } from '../../../../../core/services/tenant-config.service';
import { SeoService } from '../../../../../core/services/seo.service';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { Category, CatalogItem } from '../../../../../core/models/catalog.model';
import { RetailProductCardComponent } from '../../components/product-card/retail-product-card.component';

@Component({
  selector: 'sf-retail-home',
  standalone: true,
  imports: [RouterLink, TranslateModule, SkeletonComponent, RetailProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero -->
    <section class="sf-retail-hero">
      <div class="sf-retail-hero__inner">
        <div class="sf-retail-hero__text">
          <span class="sf-retail-hero__badge">{{ 'home.hero_badge' | translate }}</span>
          <h1 class="sf-retail-hero__title">{{ businessName() }}</h1>
          <p class="sf-retail-hero__subtitle">{{ tagline() || ('home.hero_subtitle' | translate) }}</p>
          <div class="sf-retail-hero__actions">
            <a class="sf-retail-hero__btn sf-retail-hero__btn--primary" [routerLink]="['/', lang(), 'shop']">
              {{ 'home.shop_now' | translate }}
            </a>
            <a class="sf-retail-hero__btn sf-retail-hero__btn--outline" [routerLink]="['/', lang(), 'shop']">
              {{ 'home.browse_collection' | translate }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="sf-retail-featured">
      <div class="sf-retail-section">
        <div class="sf-retail-section__heading">
          <h2 class="sf-retail-section__title">{{ 'home.featured_products' | translate }}</h2>
          <div class="sf-retail-section__accent"></div>
        </div>

        @if (loading()) {
          <div class="sf-retail-grid">
            @for (_ of skeletons; track $index) {
              <div class="sf-retail-skeleton-card">
                <ui-skeleton variant="block" height="192px" />
                <div style="padding:1rem; display:flex; flex-direction:column; gap:0.5rem">
                  <ui-skeleton variant="text" width="70%" />
                  <ui-skeleton variant="text" width="50%" />
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="sf-retail-grid">
            @for (item of featuredItems(); track item.id) {
              <sf-retail-product-card [item]="item" [lang]="lang()" (viewItem)="onViewItem(item)" />
            }
          </div>
        }

        <div class="sf-retail-section__cta">
          <a class="sf-retail__view-all" [routerLink]="['/', lang(), 'shop']">
            {{ 'home.view_all_dishes' | translate }} →
          </a>
        </div>
      </div>
    </section>

    <!-- Categories grid -->
    @if (categories().length > 0) {
      <section class="sf-retail-cats">
        <div class="sf-retail-section">
          <div class="sf-retail-section__heading">
            <h2 class="sf-retail-section__title">{{ 'home.shop_by_category' | translate }}</h2>
            <div class="sf-retail-section__accent"></div>
          </div>
          <div class="sf-retail-cats__grid">
            @for (cat of categories(); track cat.id) {
              <a class="sf-retail-cats__card" [routerLink]="['/', lang(), 'shop', cat.slug]">
                <span class="sf-retail-cats__name">{{ lang() === 'ar' ? cat.nameAr : cat.nameEn }}</span>
              </a>
            }
          </div>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .sf-retail-hero {
        background: var(--color-surface-container, #f4ede5);
        padding-block: 5rem 4rem;
        padding-inline: 1.5rem;
      }
      .sf-retail-hero__inner {
        max-inline-size: 80rem;
        margin-inline: auto;
      }
      .sf-retail-hero__badge {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-primary, #805600);
        border: 1.5px solid var(--color-primary, #805600);
        padding-block: 0.25rem;
        padding-inline: 0.875rem;
        border-radius: 9999px;
        margin-block-end: 1.25rem;
      }
      .sf-retail-hero__title {
        font-size: clamp(2rem, 5vw, 3.5rem);
        font-weight: 900;
        color: var(--color-primary, #805600);
        margin: 0 0 1rem;
        letter-spacing: -0.03em;
      }
      .sf-retail-hero__subtitle {
        font-size: 1.0625rem;
        color: var(--color-on-surface-variant, #514534);
        line-height: 1.7;
        margin: 0 0 2rem;
        max-inline-size: 36rem;
      }
      .sf-retail-hero__actions { display: flex; gap: 0.875rem; flex-wrap: wrap; }
      .sf-retail-hero__btn {
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
      .sf-retail-hero__btn--primary {
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        border: 2px solid var(--color-primary, #805600);
      }
      .sf-retail-hero__btn--primary:hover {
        background: var(--color-primary-container, #f2a922);
        border-color: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }
      .sf-retail-hero__btn--outline {
        background: transparent;
        color: var(--color-primary, #805600);
        border: 2px solid var(--color-primary, #805600);
      }
      .sf-retail-hero__btn--outline:hover {
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
      }

      .sf-retail-section {
        max-inline-size: 80rem;
        margin-inline: auto;
        padding-inline: 1.5rem;
      }
      .sf-retail-section__heading {
        text-align: center;
        margin-block-end: 2rem;
      }
      .sf-retail-section__title {
        font-size: clamp(1.5rem, 3vw, 2rem);
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin: 0 0 0.5rem;
        letter-spacing: -0.02em;
      }
      .sf-retail-section__accent {
        inline-size: 3rem;
        block-size: 3px;
        background: var(--color-primary-container, #f2a922);
        border-radius: 9999px;
        margin-inline: auto;
      }
      .sf-retail-section__cta { text-align: center; margin-block-start: 1.5rem; }

      .sf-retail-featured { padding-block: 4rem; background: var(--color-background, #fff8f1); }

      .sf-retail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.25rem;
      }
      .sf-retail-skeleton-card {
        background: var(--color-surface, #ffffff);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }

      .sf-retail__view-all {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
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
      .sf-retail__view-all:hover {
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
      }

      .sf-retail-cats { padding-block: 4rem; background: var(--color-surface-container, #f4ede5); }
      .sf-retail-cats__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
      }
      .sf-retail-cats__card {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: var(--color-surface, #ffffff);
        border-radius: 12px;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        text-decoration: none;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .sf-retail-cats__card:hover {
        border-color: var(--color-primary, #805600);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }
      .sf-retail-cats__name {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-primary, #805600);
      }
    `,
  ],
})
export class RetailHomeComponent implements OnInit {
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly seo = inject(SeoService);
  private readonly catalogService = inject(CatalogService);
  private readonly langToggle = inject(LanguageToggleService);

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

  readonly loading = signal(true);
  readonly featuredItems = signal<CatalogItem[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly skeletons = new Array(8);

  ngOnInit(): void {
    const config = this.config();
    if (config) {
      this.seo.setPageMeta({ titleEn: config.branding.businessName, titleAr: config.branding.businessNameAr }, config, this.lang());
    }

    this.catalogService.getFeaturedItems().subscribe({
      next: (items) => { this.featuredItems.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    this.catalogService.getCategories().subscribe({ next: (cats) => this.categories.set(cats) });
  }

  onViewItem(item: CatalogItem): void {
    // navigation handled by router in product-detail
  }
}
