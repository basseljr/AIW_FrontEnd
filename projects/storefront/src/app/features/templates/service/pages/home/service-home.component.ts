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
import { CatalogItem } from '../../../../../core/models/catalog.model';
import { ServiceCardComponent } from '../../components/service-card/service-card.component';

@Component({
  selector: 'sf-service-home',
  standalone: true,
  imports: [RouterLink, TranslateModule, SkeletonComponent, ServiceCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero -->
    <section class="sf-svc-hero">
      <div class="sf-svc-hero__inner">
        <span class="sf-svc-hero__badge">{{ 'home.hero_badge' | translate }}</span>
        <h1 class="sf-svc-hero__title">{{ businessName() }}</h1>
        <p class="sf-svc-hero__subtitle">{{ tagline() || ('home.hero_subtitle' | translate) }}</p>
        <div class="sf-svc-hero__actions">
          <a class="sf-svc-hero__btn sf-svc-hero__btn--primary" [routerLink]="['/', lang(), 'services']">
            {{ 'home.book_now' | translate }}
          </a>
        </div>
      </div>
    </section>

    <!-- Featured Services -->
    <section class="sf-svc-featured">
      <div class="sf-svc-section">
        <div class="sf-svc-section__heading">
          <h2 class="sf-svc-section__title">{{ 'home.featured_services' | translate }}</h2>
          <div class="sf-svc-section__accent"></div>
        </div>

        @if (loading()) {
          <div class="sf-svc-grid">
            @for (_ of skeletons; track $index) {
              <div class="sf-svc-skeleton-card">
                <ui-skeleton variant="block" height="192px" />
                <div style="padding:1rem; display:flex; flex-direction:column; gap:0.5rem">
                  <ui-skeleton variant="text" width="70%" />
                  <ui-skeleton variant="text" width="50%" />
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="sf-svc-grid">
            @for (item of featuredItems(); track item.id) {
              <sf-service-card [item]="item" [lang]="lang()" />
            }
          </div>
        }
      </div>
    </section>

    <!-- How it works -->
    <section class="sf-svc-how">
      <div class="sf-svc-section">
        <div class="sf-svc-section__heading">
          <h2 class="sf-svc-section__title sf-svc-section__title--light">{{ 'home.how_it_works' | translate }}</h2>
          <div class="sf-svc-section__accent sf-svc-section__accent--light"></div>
        </div>
        <div class="sf-svc-steps">
          <div class="sf-svc-step">
            <div class="sf-svc-step__num" aria-hidden="true">1</div>
            <h3 class="sf-svc-step__title">{{ 'home.how_step1_title' | translate }}</h3>
            <p class="sf-svc-step__desc">{{ 'home.how_step1_desc' | translate }}</p>
          </div>
          <div class="sf-svc-step">
            <div class="sf-svc-step__num" aria-hidden="true">2</div>
            <h3 class="sf-svc-step__title">{{ 'home.how_step2_title' | translate }}</h3>
            <p class="sf-svc-step__desc">{{ 'home.how_step2_desc' | translate }}</p>
          </div>
          <div class="sf-svc-step">
            <div class="sf-svc-step__num" aria-hidden="true">3</div>
            <h3 class="sf-svc-step__title">{{ 'home.how_step3_title' | translate }}</h3>
            <p class="sf-svc-step__desc">{{ 'home.how_step3_desc' | translate }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .sf-svc-hero {
        background: var(--color-surface-container, #f4ede5);
        padding-block: 5rem 4rem;
        padding-inline: 1.5rem;
        text-align: center;
      }
      .sf-svc-hero__inner { max-inline-size: 48rem; margin-inline: auto; }
      .sf-svc-hero__badge {
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
      .sf-svc-hero__title {
        font-size: clamp(2rem, 5vw, 3.5rem);
        font-weight: 900;
        color: var(--color-primary, #805600);
        margin: 0 0 1rem;
        letter-spacing: -0.03em;
      }
      .sf-svc-hero__subtitle {
        font-size: 1.0625rem;
        color: var(--color-on-surface-variant, #514534);
        line-height: 1.7;
        margin: 0 0 2rem;
      }
      .sf-svc-hero__actions { display: flex; justify-content: center; }
      .sf-svc-hero__btn {
        display: inline-flex;
        align-items: center;
        padding-block: 0.875rem;
        padding-inline: 2rem;
        border-radius: 9999px;
        font-size: 1rem;
        font-weight: 700;
        text-decoration: none;
        transition: background-color 0.2s, color 0.2s;
      }
      .sf-svc-hero__btn--primary {
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        border: 2px solid var(--color-primary, #805600);
      }
      .sf-svc-hero__btn--primary:hover {
        background: var(--color-primary-container, #f2a922);
        border-color: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }

      .sf-svc-section { max-inline-size: 80rem; margin-inline: auto; padding-inline: 1.5rem; }
      .sf-svc-section__heading { text-align: center; margin-block-end: 2rem; }
      .sf-svc-section__title {
        font-size: clamp(1.5rem, 3vw, 2rem);
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin: 0 0 0.5rem;
        letter-spacing: -0.02em;
      }
      .sf-svc-section__title--light { color: var(--color-on-primary, #ffffff); }
      .sf-svc-section__accent {
        inline-size: 3rem;
        block-size: 3px;
        background: var(--color-primary-container, #f2a922);
        border-radius: 9999px;
        margin-inline: auto;
      }
      .sf-svc-section__accent--light { background: rgba(255, 255, 255, 0.6); }

      .sf-svc-featured { padding-block: 4rem; background: var(--color-background, #fff8f1); }
      .sf-svc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; }
      .sf-svc-skeleton-card {
        background: var(--color-surface, #ffffff);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }

      .sf-svc-how {
        padding-block: 4rem;
        background: var(--color-primary, #805600);
      }
      .sf-svc-steps {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 2rem;
      }
      .sf-svc-step { text-align: center; }
      .sf-svc-step__num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: 3rem;
        block-size: 3rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--color-on-primary, #ffffff);
        margin-block-end: 0.875rem;
      }
      .sf-svc-step__title { font-size: 1rem; font-weight: 700; color: var(--color-on-primary, #ffffff); margin: 0 0 0.5rem; }
      .sf-svc-step__desc { font-size: 0.875rem; color: rgba(255, 255, 255, 0.8); line-height: 1.6; margin: 0; }
    `,
  ],
})
export class ServiceHomeComponent implements OnInit {
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
  readonly skeletons = new Array(6);

  ngOnInit(): void {
    const config = this.config();
    if (config) {
      this.seo.setPageMeta({ titleEn: config.branding.businessName, titleAr: config.branding.businessNameAr }, config, this.lang());
    }
    this.catalogService.getFeaturedItems().subscribe({
      next: (items) => { this.featuredItems.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
