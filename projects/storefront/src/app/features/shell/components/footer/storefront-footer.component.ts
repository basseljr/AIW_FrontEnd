import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { TenantConfigService } from '../../../../core/services/tenant-cconfig.service';
import { TenantConfig } from '../../../../core/models/tenant-cconfig.model';

/**
 * Storefront footer — matches the restaurant prototype exactly.
 *
 * Design:
 *   - Dark background `var(--color-header-footer)` (deep warm dark, prototype #1e1b17)
 *   - 4-column grid on desktop: brand (×2 cols) + quick links + contact
 *   - Brand column: business name, tagline, social icons
 *   - Quick links column: nav links from tenant cconfig
 *   - Contact column: phone, email, address, working hours from tenant cconfig
 *   - Bottom bar: copyright left, privacy/terms links right
 *   - Fully RTL-safe using logical CSS properties
 */
@Component({
  selector: 'sf-storefront-footer',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="sf-footer">
      <div class="sf-footer__inner">
        <div class="sf-footer__grid">
          <!-- Brand column -->
          <div class="sf-footer__brand">
            <div class="sf-footer__name">{{ businessName() }}</div>
            @if (tagline()) {
              <p class="sf-footer__tagline">{{ tagline() }}</p>
            }
            <!-- Social links -->
            <div class="sf-footer__social" role="list" [attr.aria-label]="'shell.footer.explore' | translate">
              @if (config()?.socialLinks?.instagram) {
                <a
                  class="sf-footer__social-link"
                  [href]="config()!.socialLinks.instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  role="listitem"
                >
                  <svg class="sf-footer__social-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              }
              @if (config()?.socialLinks?.facebook) {
                <a
                  class="sf-footer__social-link"
                  [href]="config()!.socialLinks.facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  role="listitem"
                >
                  <svg class="sf-footer__social-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12c0-5.523-4.477-10-10-10s-10 4.477-10 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54v-2.891h2.54v-2.203c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.877h2.773l-.443 2.891h-2.33v6.987c4.781-.75 8.438-4.887 8.438-9.878z"/>
                  </svg>
                </a>
              }
              @if (config()?.socialLinks?.twitter) {
                <a
                  class="sf-footer__social-link"
                  [href]="config()!.socialLinks.twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X / Twitter"
                  role="listitem"
                >
                  <svg class="sf-footer__social-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              }
              @if (config()?.socialLinks?.whatsapp) {
                <a
                  class="sf-footer__social-link"
                  [href]="'https://wa.me/' + config()!.socialLinks.whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  role="listitem"
                >
                  <svg class="sf-footer__social-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              }
            </div>
          </div>

          <!-- Quick links -->
          <nav class="sf-footer__col" [attr.aria-label]="'shell.footer.explore' | translate">
            <h3 class="sf-footer__col-title">{{ 'shell.footer.explore' | translate }}</h3>
            <ul class="sf-footer__link-list" role="list">
              @for (link of navLinks(); track link.path) {
                <li>
                  <a
                    class="sf-footer__link"
                    [routerLink]="['/', activeLang(), link.path]"
                  >
                    {{ activeLang() === 'ar' ? link.labelAr : link.labelEn }}
                  </a>
                </li>
              }
            </ul>
          </nav>

          <!-- Contact -->
          <address class="sf-footer__col sf-footer__contact">
            <h3 class="sf-footer__col-title">{{ 'shell.footer.contact' | translate }}</h3>
            <ul class="sf-footer__contact-list" role="list">
              @if (config()?.contact?.phone) {
                <li class="sf-footer__contact-item">
                  <a class="sf-footer__link" [href]="'tel:' + config()!.contact.phone">
                    {{ config()!.contact.phone }}
                  </a>
                </li>
              }
              @if (config()?.contact?.email) {
                <li class="sf-footer__contact-item">
                  <a class="sf-footer__link" [href]="'mailto:' + config()!.contact.email">
                    {{ config()!.contact.email }}
                  </a>
                </li>
              }
              @if (contactAddress()) {
                <li class="sf-footer__contact-item sf-footer__contact-text">
                  {{ contactAddress() }}
                </li>
              }
              @if (workingHours()) {
                <li class="sf-footer__contact-item sf-footer__contact-text sf-footer__hours">
                  {{ workingHours() }}
                </li>
              }
            </ul>
          </address>
        </div>

        <!-- Bottom bar -->
        <div class="sf-footer__bottom">
          <p class="sf-footer__copyright">
            &copy; {{ currentYear }} {{ businessName() }}.
            {{ 'shell.footer.rights_reserved' | translate }}
          </p>
          <nav class="sf-footer__legal" [attr.aria-label]="'shell.footer.legal_links' | translate">
            <a class="sf-footer__legal-link" [routerLink]="['/', activeLang(), 'privacy']">
              {{ 'shell.footer.privacy' | translate }}
            </a>
            <a class="sf-footer__legal-link" [routerLink]="['/', activeLang(), 'terms']">
              {{ 'shell.footer.terms' | translate }}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .sf-footer {
        background: var(--color-header-footer, #1e1b17);
        color: rgba(255, 255, 255, 0.72);
      }
      .sf-footer__inner {
        max-inline-size: 80rem;
        margin-inline: auto;
        padding-inline: 1.5rem;
        padding-block: 4rem 2rem;
      }

      .sf-footer__grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 3rem;
        margin-block-end: 3rem;
      }
      @media (min-width: 768px) {
        .sf-footer__grid {
          grid-template-columns: 2fr 1fr 1fr;
        }
      }

      /* Brand column */
      .sf-footer__brand {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .sf-footer__name {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-on-header-footer, #ffffff);
        letter-spacing: -0.03em;
      }
      .sf-footer__tagline {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.6;
        max-inline-size: 22rem;
        margin: 0;
      }

      /* Social icons */
      .sf-footer__social {
        display: flex;
        gap: 0.75rem;
        margin-block-start: 0.5rem;
      }
      .sf-footer__social-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: 2.25rem;
        block-size: 2.25rem;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.5);
        text-decoration: none;
        transition: color 0.2s, border-color 0.2s;
      }
      .sf-footer__social-link:hover {
        color: var(--color-on-header-footer, #ffffff);
        border-color: rgba(255, 255, 255, 0.4);
      }
      .sf-footer__social-icon {
        inline-size: 1rem;
        block-size: 1rem;
      }

      /* Generic column */
      .sf-footer__col {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        font-style: normal;
      }
      .sf-footer__col-title {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(255, 255, 255, 0.35);
        margin: 0 0 0.25rem;
      }

      .sf-footer__link-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }

      .sf-footer__link {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
        text-decoration: none;
        transition: color 0.2s;
      }
      .sf-footer__link:hover {
        color: var(--color-on-header-footer, #ffffff);
      }

      /* Contact specifics */
      .sf-footer__contact-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }
      .sf-footer__contact-text {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
      }
      .sf-footer__hours {
        margin-block-start: 0.5rem;
      }

      /* Bottom bar */
      .sf-footer__bottom {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: center;
        padding-block-start: 2rem;
        border-block-start: 1px solid rgba(255, 255, 255, 0.08);
      }
      @media (min-width: 640px) {
        .sf-footer__bottom {
          flex-direction: row;
          justify-content: space-between;
        }
      }
      .sf-footer__copyright {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.3);
        margin: 0;
      }
      .sf-footer__legal {
        display: flex;
        gap: 1.5rem;
      }
      .sf-footer__legal-link {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.3);
        text-decoration: none;
        transition: color 0.2s;
      }
      .sf-footer__legal-link:hover {
        color: rgba(255, 255, 255, 0.7);
      }
    `,
  ],
})
export class StorefrontFooterComponent {
  private readonly langToggle = inject(LanguageToggleService);
  private readonly tenantCconfig = inject(TenantConfigService);

  readonly activeLang = this.langToggle.current;
  readonly currentYear = new Date().getFullYear();

  readonly config = computed<TenantConfig | null>(() => this.tenantCconfig.config());
  readonly businessName = computed(() => {
    const c = this.config();
    if (!c) return '';
    return this.activeLang() === 'ar' ? c.branding.businessNameAr : c.branding.businessName;
  });
  readonly tagline = computed(() => {
    const c = this.config();
    if (!c) return null;
    return this.activeLang() === 'ar' ? c.branding.taglineAr : c.branding.tagline;
  });
  readonly navLinks = computed(() => this.config()?.navLinks ?? []);
  readonly contactAddress = computed(() => {
    const c = this.config();
    if (!c) return null;
    return this.activeLang() === 'ar'
      ? c.contact.addressAr
      : c.contact.address;
  });
  readonly workingHours = computed(() => {
    const c = this.config();
    if (!c) return null;
    return this.activeLang() === 'ar'
      ? c.contact.workingHoursAr
      : c.contact.workingHours;
  });
}
