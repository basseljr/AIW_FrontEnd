import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { TenantConfigService } from '../../../core/services/tenant-cconfig.service';
import { LanguageToggleService } from '@shared/i18n';

/**
 * Tenant maintenance / suspended page.  Rendered by the SSR server when the
 * resolved tenant has status === 'suspended'.  Uses tenant branding (name,
 * primary color) from the injected tenant cconfig, but shows no nav or cart —
 * the store is offline.
 */
@Component({
  selector: 'sf-maintenance',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="sf-maint" id="main-content" role="main">
      <div class="sf-maint__inner">
        <!-- Tenant logo if available -->
        @if (logoUrl()) {
          <img
            class="sf-maint__logo"
            [src]="logoUrl()"
            [alt]="businessName()"
            width="120"
            height="48"
          />
        } @else {
          <div class="sf-maint__name">{{ businessName() }}</div>
        }

        <!-- Wrench / tool SVG -->
        <div class="sf-maint__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>

        <h1 class="sf-maint__title">{{ 'shell.maintenance.title' | translate }}</h1>
        <p class="sf-maint__desc">{{ 'shell.maintenance.description' | translate }}</p>

        @if (contactPhone()) {
          <a class="sf-maint__contact" [href]="'tel:' + contactPhone()">
            {{ contactPhone() }}
          </a>
        }
      </div>
    </main>
  `,
  styles: [
    `
      .sf-maint {
        min-block-size: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-inline: 1.5rem;
        background: var(--color-background, #fff8f1);
      }
      .sf-maint__inner {
        text-align: center;
        max-inline-size: 32rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      .sf-maint__logo {
        block-size: 3rem;
        inline-size: auto;
        object-fit: contain;
        margin-block-end: 0.5rem;
      }
      .sf-maint__name {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-primary, #805600);
        letter-spacing: -0.04em;
      }
      .sf-maint__icon {
        inline-size: 3.5rem;
        block-size: 3.5rem;
        color: var(--color-primary, #805600);
        opacity: 0.4;
      }
      .sf-maint__title {
        font-size: clamp(1.5rem, 4vw, 2rem);
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin: 0;
        letter-spacing: -0.03em;
      }
      .sf-maint__desc {
        font-size: 1rem;
        color: var(--color-on-surface-variant, #514534);
        line-height: 1.7;
        margin: 0;
      }
      .sf-maint__contact {
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-primary, #805600);
        text-decoration: none;
        border-block-end: 2px solid var(--color-primary-container, #f2a922);
        padding-block-end: 0.125rem;
        transition: color 0.2s;
      }
      .sf-maint__contact:hover {
        color: var(--color-primary-container, #f2a922);
      }
    `,
  ],
})
export class MaintenanceComponent {
  private readonly tenantCconfig = inject(TenantConfigService);
  private readonly langToggle = inject(LanguageToggleService);

  readonly activeLang = this.langToggle.current;
  readonly config = computed(() => this.tenantCconfig.config());

  readonly businessName = computed(() => {
    const c = this.config();
    if (!c) return '';
    return this.activeLang() === 'ar' ? c.branding.businessNameAr : c.branding.businessName;
  });
  readonly logoUrl = computed(() => this.config()?.branding.logoUrl ?? null);
  readonly contactPhone = computed(() => this.config()?.contact.phone ?? null);
}
