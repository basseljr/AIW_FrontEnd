import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageToggleService } from '@shared/i18n';
import { TenantConfigService } from '../../../core/services/tenant-config.service';

@Component({
  selector: 'sf-about',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="about">
      <div class="about__inner">
        <!-- Header -->
        <header class="about__header">
          <h1 class="about__title">{{ 'about.title' | translate }}</h1>
          <p class="about__subtitle">{{ 'about.subtitle' | translate }}</p>
        </header>

        <div class="about__layout">
          <!-- Main content -->
          <div class="about__main">
            <section class="about__section">
              <h2 class="about__section-title">{{ 'about.our_story' | translate }}</h2>
              <p class="about__body">{{ businessName() }}</p>
              @if (tagline()) {
                <p class="about__tagline">{{ tagline() }}</p>
              }
              <p class="about__placeholder">{{ 'about.content_placeholder' | translate }}</p>
            </section>
          </div>

          <!-- Sidebar -->
          <aside class="about__sidebar">
            <div class="about__info-card">
              <h3 class="about__info-title">{{ 'about.business_info' | translate }}</h3>

              @if (phone()) {
                <div class="about__info-row">
                  <span class="about__info-label">{{ 'about.phone' | translate }}</span>
                  <a [href]="'tel:' + phone()" class="about__info-value about__info-value--link">{{ phone() }}</a>
                </div>
              }

              @if (email()) {
                <div class="about__info-row">
                  <span class="about__info-label">{{ 'about.email' | translate }}</span>
                  <a [href]="'mailto:' + email()" class="about__info-value about__info-value--link">{{ email() }}</a>
                </div>
              }

              @if (address()) {
                <div class="about__info-row">
                  <span class="about__info-label">{{ 'about.address' | translate }}</span>
                  <span class="about__info-value">{{ address() }}</span>
                </div>
              }

              @if (workingHours()) {
                <div class="about__info-row">
                  <span class="about__info-label">{{ 'about.hours' | translate }}</span>
                  <span class="about__info-value">{{ workingHours() }}</span>
                </div>
              }
            </div>

            <!-- Social links -->
            @if (hasSocial()) {
              <div class="about__info-card">
                <h3 class="about__info-title">{{ 'about.follow_us' | translate }}</h3>
                <div class="about__social-list">
                  @if (instagram()) {
                    <a [href]="instagram()" class="about__social-link" target="_blank" rel="noopener" aria-label="Instagram">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                      Instagram
                    </a>
                  }
                  @if (twitter()) {
                    <a [href]="twitter()" class="about__social-link" target="_blank" rel="noopener" aria-label="Twitter/X">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.261 5.633L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                      Twitter
                    </a>
                  }
                  @if (facebook()) {
                    <a [href]="facebook()" class="about__social-link" target="_blank" rel="noopener" aria-label="Facebook">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </a>
                  }
                  @if (whatsapp()) {
                    <a [href]="'https://wa.me/' + whatsapp()" class="about__social-link" target="_blank" rel="noopener" aria-label="WhatsApp">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                  }
                </div>
              </div>
            }
          </aside>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .about {
      background: var(--color-background, #fff8f1);
      min-block-size: 70vh;
      padding-block: 3rem;
      padding-inline: 1.5rem;
    }
    .about__inner {
      max-inline-size: 72rem;
      margin-inline: auto;
    }
    .about__header {
      margin-block-end: 2.5rem;
    }
    .about__title {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 800;
      color: var(--color-primary, #805600);
      margin: 0 0 0.5rem;
      letter-spacing: -0.02em;
    }
    .about__subtitle {
      font-size: 1rem;
      color: var(--color-on-surface, #1e1b17);
      opacity: 0.7;
      margin: 0;
    }
    .about__layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    @media (min-width: 768px) {
      .about__layout {
        grid-template-columns: 1fr 22rem;
      }
    }
    .about__section {
      background: #fff;
      border: 1px solid var(--color-outline-variant, #d6c4ad);
      border-radius: var(--border-radius-md, 8px);
      padding: 1.75rem;
    }
    .about__section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-primary, #805600);
      margin: 0 0 1rem;
    }
    .about__body {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-on-surface, #1e1b17);
      margin: 0 0 0.5rem;
    }
    .about__tagline {
      font-size: 1rem;
      color: var(--color-on-surface, #1e1b17);
      opacity: 0.7;
      font-style: italic;
      margin: 0 0 1.5rem;
    }
    .about__placeholder {
      font-size: 0.9375rem;
      color: var(--color-on-surface, #1e1b17);
      opacity: 0.6;
      line-height: 1.7;
      margin: 0;
    }
    .about__info-card {
      background: #fff;
      border: 1px solid var(--color-outline-variant, #d6c4ad);
      border-radius: var(--border-radius-md, 8px);
      padding: 1.25rem;
      margin-block-end: 1rem;
    }
    .about__info-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-on-surface, #1e1b17);
      margin: 0 0 1rem;
    }
    .about__info-row {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      margin-block-end: 0.875rem;
    }
    .about__info-row:last-child { margin-block-end: 0; }
    .about__info-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-on-surface, #1e1b17);
      opacity: 0.55;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .about__info-value {
      font-size: 0.9375rem;
      color: var(--color-on-surface, #1e1b17);
    }
    .about__info-value--link {
      color: var(--color-primary, #805600);
      text-decoration: none;
    }
    .about__info-value--link:hover { text-decoration: underline; }
    .about__social-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    .about__social-link {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      color: var(--color-primary, #805600);
      text-decoration: none;
      font-size: 0.9375rem;
      font-weight: 500;
      transition: opacity 0.15s;
    }
    .about__social-link:hover { opacity: 0.75; }
    .about__social-link svg {
      inline-size: 1.125rem;
      block-size: 1.125rem;
      flex-shrink: 0;
    }
  `],
})
export class AboutComponent {
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly langToggle = inject(LanguageToggleService);

  readonly config = computed(() => this.tenantConfig.config());
  readonly businessName = computed(() => {
    const c = this.config();
    if (!c) return '';
    return this.langToggle.current() === 'ar' ? c.branding.businessNameAr : c.branding.businessName;
  });
  readonly tagline = computed(() => {
    const c = this.config();
    if (!c) return '';
    return this.langToggle.current() === 'ar' ? (c.branding.taglineAr ?? '') : (c.branding.tagline ?? '');
  });
  readonly phone = computed(() => this.config()?.contact.phone ?? null);
  readonly email = computed(() => this.config()?.contact.email ?? null);
  readonly address = computed(() => {
    const c = this.config();
    if (!c) return null;
    return this.langToggle.current() === 'ar' ? (c.contact.addressAr ?? c.contact.address) : c.contact.address;
  });
  readonly workingHours = computed(() => {
    const c = this.config();
    if (!c) return null;
    return this.langToggle.current() === 'ar' ? (c.contact.workingHoursAr ?? c.contact.workingHours) : c.contact.workingHours;
  });
  readonly instagram = computed(() => this.config()?.socialLinks.instagram ?? null);
  readonly twitter = computed(() => this.config()?.socialLinks.twitter ?? null);
  readonly facebook = computed(() => this.config()?.socialLinks.facebook ?? null);
  readonly whatsapp = computed(() => this.config()?.socialLinks.whatsapp ?? null);
  readonly hasSocial = computed(() =>
    !!(this.instagram() || this.twitter() || this.facebook() || this.whatsapp())
  );
}
