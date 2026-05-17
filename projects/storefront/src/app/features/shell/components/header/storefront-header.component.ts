import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgClass } from '@angular/common';

import { LanguageToggleService } from '@shared/i18n';
import { TenantConfigService } from '../../../../core/services/tenant-cconfig.service';
import { TenantConfig } from '../../../../core/models/tenant-cconfig.model';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';

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
            [routerLink]="['/', activeLang()]"
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
                  [routerLink]="link.path ? ['/', activeLang(), link.path] : ['/', activeLang()]"
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
            @if (currentUser()) {
              <div class="sf-nav__account-wrap" [class.sf-nav__account-wrap--open]="dropdownOpen()">
                <button
                  class="sf-nav__account-btn"
                  type="button"
                  [attr.aria-expanded]="dropdownOpen()"
                  aria-haspopup="true"
                  (click)="toggleDropdown()"
                >
                  <span class="sf-nav__account-avatar" aria-hidden="true">{{ initials() }}</span>
                  <span class="sf-nav__account-name">{{ currentUser()!.fullName }}</span>
                  <svg class="sf-nav__account-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                </button>
                @if (dropdownOpen()) {
                  <div class="sf-nav__dropdown" role="menu">
                    <a
                      class="sf-nav__dropdown-item"
                      [routerLink]="['/', activeLang(), 'account']"
                      role="menuitem"
                      (click)="dropdownOpen.set(false)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {{ 'account.my_account' | translate }}
                    </a>
                    <a
                      class="sf-nav__dropdown-item"
                      [routerLink]="['/', activeLang(), 'account', 'orders']"
                      role="menuitem"
                      (click)="dropdownOpen.set(false)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
                      {{ 'account.orders_section' | translate }}
                    </a>
                    <div class="sf-nav__dropdown-divider" role="separator"></div>
                    <button
                      class="sf-nav__dropdown-item sf-nav__dropdown-item--danger"
                      type="button"
                      role="menuitem"
                      (click)="signOut()"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      {{ 'account.sign_out' | translate }}
                    </button>
                  </div>
                }
              </div>
            } @else {
              <a
                class="sf-nav__cta"
                [routerLink]="['/', activeLang(), 'login']"
              >
                {{ 'shell.header.login' | translate }}
              </a>
            }

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
                    [routerLink]="link.path ? ['/', activeLang(), link.path] : ['/', activeLang()]"
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

      /* Account dropdown */
      .sf-nav__account-wrap {
        display: none;
        position: relative;
      }
      @media (min-width: 640px) {
        .sf-nav__account-wrap {
          display: block;
        }
      }

      .sf-nav__account-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: transparent;
        border: none;
        cursor: pointer;
        font-family: inherit;
        padding: 0.25rem 0;
        transition: opacity 0.2s;
      }
      .sf-nav__account-btn:hover {
        opacity: 0.85;
      }

      .sf-nav__account-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 2rem;
        block-size: 2rem;
        border-radius: 50%;
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        flex-shrink: 0;
      }

      .sf-nav__account-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-header-footer, #fff);
        max-inline-size: 8rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .sf-nav__account-chevron {
        inline-size: 1rem;
        block-size: 1rem;
        color: var(--color-on-header-footer, #fff);
        opacity: 0.7;
        flex-shrink: 0;
        transition: transform 0.2s;
      }
      .sf-nav__account-wrap--open .sf-nav__account-chevron {
        transform: rotate(180deg);
      }

      .sf-nav__dropdown {
        position: absolute;
        inset-block-start: calc(100% + 0.5rem);
        inset-inline-end: 0;
        inline-size: 14rem;
        background: #fff;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        z-index: 100;
        overflow: hidden;
        animation: sf-dropdown-in 0.15s ease;
      }
      @keyframes sf-dropdown-in {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .sf-nav__dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding-block: 0.75rem;
        padding-inline: 1rem;
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--color-on-surface, #1e1b17);
        text-decoration: none;
        background: transparent;
        border: none;
        inline-size: 100%;
        cursor: pointer;
        font-family: inherit;
        text-align: start;
        transition: background-color 0.15s;
      }
      .sf-nav__dropdown-item svg {
        inline-size: 1rem;
        block-size: 1rem;
        flex-shrink: 0;
        color: var(--color-on-surface-variant, #514534);
      }
      .sf-nav__dropdown-item:hover {
        background: var(--color-surface-container, #f4ede5);
        color: var(--color-primary);
      }
      .sf-nav__dropdown-item:hover svg {
        color: var(--color-primary);
      }
      .sf-nav__dropdown-item--danger {
        color: var(--color-error, #dc2626);
      }
      .sf-nav__dropdown-item--danger svg {
        color: var(--color-error, #dc2626);
      }
      .sf-nav__dropdown-item--danger:hover {
        background: #fef2f2;
        color: var(--color-error, #dc2626);
      }

      .sf-nav__dropdown-divider {
        block-size: 1px;
        background: var(--color-outline-variant, #d6c4ad);
        margin-block: 0.25rem;
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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly activeLang = this.langToggle.current;
  readonly isRtl = this.langToggle.isRtl;
  readonly menuOpen = signal(false);
  readonly dropdownOpen = signal(false);
  readonly isScrolled = signal(false);
  readonly cartCount = this.cartService.count;
  readonly currentUser = this.authService.currentUser;

  readonly config = computed<TenantConfig | null>(() => this.tenantCconfig.config());
  readonly businessName = computed(() => {
    const c = this.config();
    if (!c) return '';
    return this.activeLang() === 'ar' ? c.branding.businessNameAr : c.branding.businessName;
  });
  readonly logoUrl = computed(() => this.config()?.branding.logoUrl ?? null);
  readonly navLinks = computed(() => this.config()?.navLinks ?? []);

  readonly initials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    const parts = user.fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  });

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

  toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  signOut(): void {
    this.dropdownOpen.set(false);
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/', this.activeLang()]),
      error: () => this.router.navigate(['/', this.activeLang()]),
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 16);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.sf-nav__account-wrap')) {
      this.dropdownOpen.set(false);
    }
  }
}
