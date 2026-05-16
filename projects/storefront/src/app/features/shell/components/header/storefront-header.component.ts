import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgClass } from '@angular/common';

import { LanguageToggleService } from '@shared/i18n';
import { TenantConfigService } from '../../../../core/services/tenant-cconfig.service';
import { TenantConfig } from '../../../../core/models/tenant-cconfig.model';
import { CartService } from '../../../../core/services/cart.service';

/**
 * Storefront header — matches the restaurant prototype exactly.
 *
 * Visual design:
 *   - Fixed, full-width glassmorphic nav (backdrop blur + warm tint from prototype)
 *   - Left: tenant logo / business name (links to /{lang}/)
 *   - Center (desktop, md+): nav links from tenant cconfig
 *   - Right: language toggle pill, cart icon + badge, login/account button
 *   - Mobile (<md): hamburger button; links ccollapse into a slide-in sidebar drawer
 *   - Bottom mobile bar lives in the shell component (M33+)
 *
 * Theming:
 *   - Background: `var(--color-primary)` drives the active link and hover states
 *   - Header background/text follows `var(--color-background)` (glass tint)
 *   - No hardcoded hex values — all from CSS custom properties
 *
 * RTL:
 *   - CSS logical properties throughout (padding-inline-start etc.)
 *   - flex-direction stays `row` — Flexbox respects dir automatically
 */
@Component({
  selector: 'sf-storefront-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Skip-to-content link for accessibility -->
    <a class="sf-skip-link" href="#main-content">
      {{ 'shell.header.skip_to_content' | translate }}
    </a>

    <header class="sf-header">
      <nav
        class="sf-nav"
        [class.sf-nav--scrolled]="isScrolled()"
        role="navigation"
        [attr.aria-label]="'nav.open_menu' | translate"
      >
        <div class="sf-nav__inner">
          <!-- Logo -->
          <a
            class="sf-nav__logo"
            [routerLink]="['/', activeLang(), '']"
            [attr.aria-label]="businessName()"
          >
            @if (logoUrl()) {
              <img
                class="sf-nav__logo-img"
                [src]="logoUrl()"
                [alt]="businessName()"
                loading="eager"
                width="120"
                height="40"
              />
            } @else {
              <span class="sf-nav__logo-text">{{ businessName() }}</span>
            }
          </a>

          <!-- Desktop nav links -->
          <ul class="sf-nav__links" role="list">
            @for (link of navLinks(); track link.path) {
              <li>
                <a
                  class="sf-nav__link"
                  [routerLink]="['/', activeLang(), link.path]"
                  routerLinkActive="sf-nav__link--active"
                  [routerLinkActiveOptions]="{ exact: link.path === '' }"
                >
                  {{ activeLang() === 'ar' ? link.labelAr : link.labelEn }}
                </a>
              </li>
            }
          </ul>

          <!-- Right actions -->
          <div class="sf-nav__actions">
            <!-- Language toggle pill -->
            <button
              class="sf-nav__lang-pill"
              type="button"
              [attr.aria-label]="'shell.header.language_toggle' | translate"
              (click)="toggleLanguage()"
            >
              <span class="sf-nav__lang-code" aria-hidden="true">
                {{ activeLang() === 'en' ? 'ع' : 'EN' }}
              </span>
            </button>

            <!-- Cart icon with badge -->
            <a
              class="sf-nav__icon-btn"
              [routerLink]="['/', activeLang(), 'cart']"
              [attr.aria-label]="'shell.header.cart_label' | translate"
            >
              <svg
                class="sf-nav__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              @if (cartCount() > 0) {
                <span class="sf-nav__cart-badge" aria-hidden="true">
                  {{ cartCount() }}
                </span>
              }
            </a>

            <!-- Login / Account button -->
            <a
              class="sf-nav__cta"
              [routerLink]="['/', activeLang(), 'account']"
            >
              {{ 'shell.header.login' | translate }}
            </a>

            <!-- Mobile hamburger -->
            <button
              class="sf-nav__hamburger"
              type="button"
              [attr.aria-label]="
                menuOpen()
                  ? ('shell.header.close_menu' | translate)
                  : ('shell.header.open_menu' | translate)
              "
              [attr.aria-expanded]="menuOpen()"
              [attr.aria-controls]="'sf-mobile-menu'"
              (click)="toggleMenu()"
            >
              @if (!menuOpen()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              }
            </button>
          </div>
        </div>
      </nav>

      <!-- Mobile drawer -->
      <div
        id="sf-mobile-menu"
        class="sf-mobile-drawer"
        [class.sf-mobile-drawer--open]="menuOpen()"
        role="dialog"
        [attr.aria-modal]="menuOpen()"
        [attr.aria-label]="'shell.header.open_menu' | translate"
      >
        <!-- Scrim -->
        <div
          class="sf-mobile-drawer__scrim"
          [class.sf-mobile-drawer__scrim--visible]="menuOpen()"
          (click)="closeMenu()"
          aria-hidden="true"
        ></div>

        <!-- Panel -->
        <div class="sf-mobile-drawer__panel">
          <div class="sf-mobile-drawer__header">
            <span class="sf-nav__logo-text">{{ businessName() }}</span>
            <button
              type="button"
              class="sf-mobile-drawer__close"
              (click)="closeMenu()"
              [attr.aria-label]="'shell.header.close_menu' | translate"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav class="sf-mobile-drawer__nav" role="navigation">
            <ul role="list">
              @for (link of navLinks(); track link.path) {
                <li>
                  <a
                    class="sf-mobile-drawer__link"
                    [routerLink]="['/', activeLang(), link.path]"
                    routerLinkActive="sf-mobile-drawer__link--active"
                    (click)="closeMenu()"
                  >
                    {{ activeLang() === 'ar' ? link.labelAr : link.labelEn }}
                  </a>
                </li>
              }
            </ul>
          </nav>

          <div class="sf-mobile-drawer__footer">
            <button
              class="sf-mobile-drawer__lang-btn"
              type="button"
              (click)="toggleLanguage(); closeMenu()"
            >
              {{ (activeLang() === 'en' ? 'common.language_arabic' : 'common.language_english') | translate }}
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      /* ── Skip link ─────────────────────────────── */
      .sf-skip-link {
        position: absolute;
        inset-block-start: -100%;
        inset-inline-start: 1rem;
        background: var(--color-primary);
        color: #fff;
        padding: 0.5rem 1rem;
        border-radius: 0 0 var(--border-radius-md, 8px) var(--border-radius-md, 8px);
        font-weight: 600;
        font-size: 0.875rem;
        z-index: 9999;
        transition: inset-block-start 0.2s;
      }
      .sf-skip-link:focus {
        inset-block-start: 0;
      }

      /* ── Header / Nav wrapper ───────────────────── */
      .sf-header {
        position: fixed;
        inset-block-start: 0;
        inset-inline-start: 0;
        inset-inline-end: 0;
        z-index: 50;
      }

      .sf-nav {
        background: var(--color-header-footer, #1e1b17);
        border-block-end: 1px solid rgba(255, 255, 255, 0.08);
        transition: box-shadow 0.3s ease;
      }
      .sf-nav--scrolled {
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
      }

      .sf-nav__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-inline-size: 80rem;
        margin-inline: auto;
        padding-inline: 1.5rem;
        padding-block: 1rem;
        gap: 1.5rem;
      }

      /* ── Logo ───────────────────────────────────── */
      .sf-nav__logo {
        text-decoration: none;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
      }
      .sf-nav__logo-img {
        block-size: 2.5rem;
        inline-size: auto;
        object-fit: contain;
      }
      .sf-nav__logo-text {
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: var(--color-on-header-footer, #ffffff);
        line-height: 1;
      }

      /* ── Desktop nav links ──────────────────────── */
      .sf-nav__links {
        display: none;
        list-style: none;
        margin: 0;
        padding: 0;
        gap: 2rem;
        align-items: center;
      }
      @media (min-width: 768px) {
        .sf-nav__links {
          display: flex;
        }
      }

      .sf-nav__link {
        color: var(--color-on-header-footer, rgba(255, 255, 255, 0.8));
        font-size: 0.9375rem;
        font-weight: 500;
        text-decoration: none;
        padding-block-end: 0.25rem;
        border-block-end: 2px solid transparent;
        transition: color 0.2s ease, border-color 0.2s ease;
      }
      .sf-nav__link:hover {
        color: var(--color-primary);
      }
      .sf-nav__link--active {
        color: var(--color-primary);
        font-weight: 700;
        border-block-end-color: var(--color-primary-container, #f2a922);
      }

      /* ── Right action group ─────────────────────── */
      .sf-nav__actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;
      }

      /* Language toggle pill */
      .sf-nav__lang-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-inline-size: 2.25rem;
        block-size: 2rem;
        padding-inline: 0.625rem;
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        border-radius: var(--border-radius-full, 9999px);
        background: transparent;
        cursor: pointer;
        color: var(--color-on-header-footer, #ffffff);
        font-size: 0.8125rem;
        font-weight: 700;
        transition: background-color 0.2s, border-color 0.2s;
        font-family: inherit;
      }
      .sf-nav__lang-pill:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--color-primary);
      }

      /* Cart icon button */
      .sf-nav__icon-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-on-header-footer, #ffffff);
        text-decoration: none;
        transition: color 0.2s;
        padding: 0.25rem;
      }
      .sf-nav__icon-btn:hover {
        color: var(--color-primary-container, #f2a922);
      }
      .sf-nav__icon {
        inline-size: 1.5rem;
        block-size: 1.5rem;
      }
      .sf-nav__cart-badge {
        position: absolute;
        inset-block-start: -0.25rem;
        inset-inline-end: -0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 1.125rem;
        block-size: 1.125rem;
        background: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
        font-size: 0.625rem;
        font-weight: 800;
        border-radius: 50%;
        line-height: 1;
      }

      /* CTA button */
      .sf-nav__cta {
        display: none;
        align-items: center;
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        padding-block: 0.5rem;
        padding-inline: 1.25rem;
        border-radius: var(--border-radius-full, 9999px);
        font-size: 0.875rem;
        font-weight: 700;
        text-decoration: none;
        transition: background-color 0.2s;
        white-space: nowrap;
      }
      .sf-nav__cta:hover {
        background: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }
      @media (min-width: 640px) {
        .sf-nav__cta {
          display: inline-flex;
        }
      }

      /* Hamburger (mobile only) */
      .sf-nav__hamburger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: 2.25rem;
        block-size: 2.25rem;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--color-on-header-footer, #ffffff);
        padding: 0;
        border-radius: 0.5rem;
        transition: color 0.2s;
      }
      .sf-nav__hamburger svg {
        inline-size: 1.5rem;
        block-size: 1.5rem;
      }
      .sf-nav__hamburger:hover {
        color: var(--color-primary-container, #f2a922);
      }
      @media (min-width: 768px) {
        .sf-nav__hamburger {
          display: none;
        }
      }

      /* ── Mobile drawer ──────────────────────────── */
      .sf-mobile-drawer {
        position: fixed;
        inset: 0;
        z-index: 60;
        pointer-events: none;
      }
      .sf-mobile-drawer--open {
        pointer-events: auto;
      }

      .sf-mobile-drawer__scrim {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0);
        transition: background-color 0.25s ease;
      }
      .sf-mobile-drawer__scrim--visible {
        background: rgba(0, 0, 0, 0.45);
      }

      .sf-mobile-drawer__panel {
        position: absolute;
        inset-block-start: 0;
        inset-block-end: 0;
        inset-inline-start: 0;
        inline-size: min(80vw, 20rem);
        background: var(--color-background, #fff8f1);
        display: flex;
        flex-direction: column;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow-y: auto;
      }
      /* RTL: drawer slides from the right */
      [dir='rtl'] .sf-mobile-drawer__panel {
        inset-inline-start: auto;
        inset-inline-end: 0;
        transform: translateX(100%);
      }
      .sf-mobile-drawer--open .sf-mobile-drawer__panel {
        transform: translateX(0);
      }

      .sf-mobile-drawer__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.25rem 1rem;
        border-block-end: 1px solid var(--color-outline-variant, #d6c4ad);
      }
      .sf-mobile-drawer__close {
        display: inline-flex;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--color-primary);
        padding: 0.25rem;
        border-radius: 0.5rem;
      }
      .sf-mobile-drawer__close svg {
        inline-size: 1.25rem;
        block-size: 1.25rem;
      }

      .sf-mobile-drawer__nav {
        flex: 1;
        padding-block: 1rem;
      }
      .sf-mobile-drawer__nav ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .sf-mobile-drawer__link {
        display: block;
        padding-block: 0.875rem;
        padding-inline: 1.25rem;
        color: var(--color-on-surface, #1e1b17);
        font-size: 1rem;
        font-weight: 500;
        text-decoration: none;
        border-block-end: 1px solid var(--color-surface-container-high, #eee7df);
        transition: background-color 0.15s, color 0.15s;
      }
      .sf-mobile-drawer__link:hover {
        background: var(--color-surface-container, #f4ede5);
        color: var(--color-primary);
      }
      .sf-mobile-drawer__link--active {
        color: var(--color-primary);
        font-weight: 700;
      }

      .sf-mobile-drawer__footer {
        padding: 1.25rem;
        border-block-start: 1px solid var(--color-outline-variant, #d6c4ad);
      }
      .sf-mobile-drawer__lang-btn {
        inline-size: 100%;
        padding-block: 0.75rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-full, 9999px);
        background: transparent;
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--color-primary);
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
      }
      .sf-mobile-drawer__lang-btn:hover {
        background: var(--color-surface-container, #f4ede5);
      }

      @media (min-width: 768px) {
        .sf-mobile-drawer {
          display: none;
        }
      }
    `,
  ],
})
export class StorefrontHeaderComponent implements OnInit {
  private readonly langToggle = inject(LanguageToggleService);
  private readonly tenantCconfig = inject(TenantConfigService);
  private readonly cartService = inject(CartService);

  readonly activeLang = this.langToggle.current;
  readonly isRtl = this.langToggle.isRtl;
  readonly menuOpen = signal(false);
  readonly isScrolled = signal(false);
  readonly cartCount = this.cartService.count;

  readonly config = computed<TenantConfig | null>(() => this.tenantCconfig.config());
  readonly businessName = computed(() => {
    const c = this.config();
    if (!c) return '';
    return this.activeLang() === 'ar' ? c.branding.businessNameAr : c.branding.businessName;
  });
  readonly logoUrl = computed(() => this.config()?.branding.logoUrl ?? null);
  readonly navLinks = computed(() => this.config()?.navLinks ?? []);

  ngOnInit(): void {}

  toggleLanguage(): void {
    this.langToggle.toggle();
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 16);
  }
}
