import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LanguageToggleService } from '@shared/i18n';
import { TenantConfigService } from '../../core/services/tenant-cconfig.service';
import { SeoService } from '../../core/services/seo.service';
import { StorefrontHeaderComponent } from './components/header/storefront-header.component';
import { StorefrontFooterComponent } from './components/footer/storefront-footer.component';

/**
 * Root shell for the storefront — wraps every tenant page with the
 * persistent header, main content area, and footer.
 *
 * During SSR this component initialises SEO tags (title, description, OG,
 * hreflang) so the first HTML byte the search crawler receives already has
 * the correct metadata.
 *
 * On the client it hydrates transparently — no visual flicker because the
 * header/footer CSS custom properties were already written into `<head>` by
 * `app.cconfig.server.ts`.
 */
@Component({
  selector: 'sf-storefront-shell',
  standalone: true,
  imports: [RouterOutlet, StorefrontHeaderComponent, StorefrontFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sf-storefront-header />
    <main
      id="main-content"
      class="sf-shell__main"
      [class.sf-shell__main--loading]="!tenantCconfig.isReady()"
    >
      <router-outlet />
    </main>
    <sf-storefront-footer />
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .sf-shell__main {
        /* Offset for the fixed header (64px) */
        padding-block-start: 4rem;
        min-block-size: 100dvh;
        background: var(--color-background, #fff8f1);
      }
    `,
  ],
})
export class StorefrontShellComponent implements OnInit {
  protected readonly tenantCconfig = inject(TenantConfigService);
  private readonly langToggle = inject(LanguageToggleService);
  private readonly seo = inject(SeoService);

  readonly config = computed(() => this.tenantCconfig.config());

  ngOnInit(): void {
    const cconfig = this.config();
    if (!cconfig) return;

    // Inject SEO tags — runs during SSR so the HTML response has them.
    this.seo.setPageMeta(
      {
        titleEn: cconfig.branding.businessName,
        titleAr: cconfig.branding.businessNameAr,
        descriptionEn: cconfig.seo.metaDescriptionEn ?? undefined,
        descriptionAr: cconfig.seo.metaDescriptionAr ?? undefined,
        ogImage: cconfig.seo.ogImageUrl ?? undefined,
      },
      cconfig,
      this.langToggle.current(),
    );
  }
}
