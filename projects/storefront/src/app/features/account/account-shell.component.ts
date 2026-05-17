import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { LanguageToggleService } from '@shared/i18n';
import { AuthEventsService } from '@shared/api';
import { AuthService } from '../../core/services/auth.service';
import { TenantConfigService } from '../../core/services/tenant-config.service';

@Component({
  selector: 'sf-account-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="acct-shell">
      <!-- Sidebar (desktop) -->
      <aside class="acct-shell__sidebar">
        <div class="acct-shell__sidebar-header">
          @if (currentUser()) {
            <div class="acct-shell__avatar">{{ initials() }}</div>
            <div class="acct-shell__user-info">
              <span class="acct-shell__user-name">{{ currentUser()!.fullName }}</span>
              <span class="acct-shell__user-email">{{ currentUser()!.email }}</span>
            </div>
          }
        </div>

        <nav class="acct-shell__nav" role="navigation" [attr.aria-label]="'account.my_account' | translate">
          <ul class="acct-shell__nav-list" role="list">
            <li>
              <a
                class="acct-shell__nav-link"
                [routerLink]="['/', activeLang(), 'account']"
                routerLinkActive="acct-shell__nav-link--active"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                <svg class="acct-shell__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {{ 'account.overview' | translate }}
              </a>
            </li>
            <li>
              <a
                class="acct-shell__nav-link"
                [routerLink]="['/', activeLang(), 'account', 'orders']"
                routerLinkActive="acct-shell__nav-link--active"
              >
                <svg class="acct-shell__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="13" y2="16" />
                </svg>
                {{ 'account.orders_section' | translate }}
              </a>
            </li>
            <li>
              <a
                class="acct-shell__nav-link"
                [routerLink]="['/', activeLang(), 'account', 'addresses']"
                routerLinkActive="acct-shell__nav-link--active"
              >
                <svg class="acct-shell__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {{ 'account.addresses_section' | translate }}
              </a>
            </li>
            @if (isRetail()) {
              <li>
                <a
                  class="acct-shell__nav-link"
                  [routerLink]="['/', activeLang(), 'account', 'wishlist']"
                  routerLinkActive="acct-shell__nav-link--active"
                >
                  <svg class="acct-shell__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {{ 'account.wishlist_section' | translate }}
                </a>
              </li>
            }
            <li>
              <a
                class="acct-shell__nav-link"
                [routerLink]="['/', activeLang(), 'account', 'loyalty']"
                routerLinkActive="acct-shell__nav-link--active"
              >
                <svg class="acct-shell__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="6"/>
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
                {{ 'account.loyalty_section' | translate }}
              </a>
            </li>
            <li>
              <a
                class="acct-shell__nav-link"
                [routerLink]="['/', activeLang(), 'account', 'data']"
                routerLinkActive="acct-shell__nav-link--active"
              >
                <svg class="acct-shell__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                {{ 'account.data_section' | translate }}
              </a>
            </li>
            <li>
              <a
                class="acct-shell__nav-link"
                [routerLink]="['/', activeLang(), 'account', 'settings']"
                routerLinkActive="acct-shell__nav-link--active"
              >
                <svg class="acct-shell__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                {{ 'account.settings_section' | translate }}
              </a>
            </li>
          </ul>
        </nav>

        <div class="acct-shell__sidebar-footer">
          <button class="acct-shell__sign-out" type="button" (click)="signOut()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {{ 'account.sign_out' | translate }}
          </button>
        </div>
      </aside>

      <!-- Mobile tab bar -->
      <nav class="acct-shell__tabs" role="navigation" [attr.aria-label]="'account.my_account' | translate">
        <a class="acct-shell__tab" [routerLink]="['/', activeLang(), 'account']" routerLinkActive="acct-shell__tab--active" [routerLinkActiveOptions]="{ exact: true }">
          {{ 'account.overview' | translate }}
        </a>
        <a class="acct-shell__tab" [routerLink]="['/', activeLang(), 'account', 'orders']" routerLinkActive="acct-shell__tab--active">
          {{ 'account.orders_section' | translate }}
        </a>
        <a class="acct-shell__tab" [routerLink]="['/', activeLang(), 'account', 'addresses']" routerLinkActive="acct-shell__tab--active">
          {{ 'account.addresses_section' | translate }}
        </a>
        <a class="acct-shell__tab" [routerLink]="['/', activeLang(), 'account', 'loyalty']" routerLinkActive="acct-shell__tab--active">
          {{ 'account.loyalty_section' | translate }}
        </a>
        <a class="acct-shell__tab" [routerLink]="['/', activeLang(), 'account', 'settings']" routerLinkActive="acct-shell__tab--active">
          {{ 'account.settings_section' | translate }}
        </a>
      </nav>

      <!-- Main content -->
      <main class="acct-shell__content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .acct-shell {
        display: flex;
        min-block-size: calc(100vh - 4rem);
        max-inline-size: 72rem;
        margin-inline: auto;
        padding-inline: 1.5rem;
        padding-block: 2rem;
        gap: 2rem;
      }

      /* Sidebar */
      .acct-shell__sidebar {
        display: none;
        flex-direction: column;
        inline-size: 15rem;
        flex-shrink: 0;
        background: var(--color-surface-container, #f4ede5);
        border-radius: var(--border-radius-md, 8px);
        overflow: hidden;
        align-self: flex-start;
        position: sticky;
        inset-block-start: 5.5rem;
      }
      @media (min-width: 768px) {
        .acct-shell__sidebar {
          display: flex;
        }
      }

      .acct-shell__sidebar-header {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        padding: 1.25rem 1rem;
        border-block-end: 1px solid var(--color-outline-variant, #d6c4ad);
      }

      .acct-shell__avatar {
        inline-size: 2.75rem;
        block-size: 2.75rem;
        border-radius: 50%;
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        font-weight: 700;
        flex-shrink: 0;
        text-transform: uppercase;
      }

      .acct-shell__user-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-inline-size: 0;
      }

      .acct-shell__user-name {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .acct-shell__user-email {
        font-size: 0.75rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.6;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .acct-shell__nav {
        flex: 1;
        padding-block: 0.5rem;
      }

      .acct-shell__nav-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .acct-shell__nav-link {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding-block: 0.75rem;
        padding-inline: 1rem;
        color: var(--color-on-surface, #1e1b17);
        text-decoration: none;
        font-size: 0.9375rem;
        font-weight: 500;
        transition: background-color 0.15s, color 0.15s;
        border-radius: 0;
      }
      .acct-shell__nav-link:hover {
        background: var(--color-surface-container-high, #eee7df);
        color: var(--color-primary);
      }
      .acct-shell__nav-link--active {
        color: var(--color-primary);
        font-weight: 700;
        background: rgba(0, 0, 0, 0.04);
        border-inline-start: 3px solid var(--color-primary);
        padding-inline-start: calc(1rem - 3px);
      }

      .acct-shell__nav-icon {
        inline-size: 1.125rem;
        block-size: 1.125rem;
        flex-shrink: 0;
      }

      .acct-shell__sidebar-footer {
        padding: 1rem;
        border-block-start: 1px solid var(--color-outline-variant, #d6c4ad);
      }

      .acct-shell__sign-out {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: transparent;
        border: none;
        color: var(--color-error, #dc2626);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        padding: 0.375rem 0;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .acct-shell__sign-out svg {
        inline-size: 1rem;
        block-size: 1rem;
      }
      .acct-shell__sign-out:hover {
        opacity: 0.75;
      }

      /* Mobile tab bar */
      .acct-shell__tabs {
        display: flex;
        overflow-x: auto;
        gap: 0;
        border-block-end: 2px solid var(--color-outline-variant, #d6c4ad);
        margin-block-end: 1.5rem;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        position: sticky;
        inset-block-start: 4rem;
        background: var(--color-background, #fff8f1);
        z-index: 5;
      }
      .acct-shell__tabs::-webkit-scrollbar {
        display: none;
      }
      @media (min-width: 768px) {
        .acct-shell__tabs {
          display: none;
        }
      }

      .acct-shell__tab {
        flex-shrink: 0;
        padding-block: 0.875rem;
        padding-inline: 1.125rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
        text-decoration: none;
        border-block-end: 2px solid transparent;
        margin-block-end: -2px;
        white-space: nowrap;
        transition: color 0.15s, border-color 0.15s;
      }
      .acct-shell__tab--active {
        color: var(--color-primary);
        border-block-end-color: var(--color-primary);
      }

      /* Main content area */
      .acct-shell__content {
        flex: 1;
        min-inline-size: 0;
      }

      @media (max-width: 767px) {
        .acct-shell {
          flex-direction: column;
          padding-block: 1rem;
          padding-inline: 1rem;
          gap: 0;
        }
      }
    `,
  ],
})
export class AccountShellComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly authEvents = inject(AuthEventsService);
  private readonly lang = inject(LanguageToggleService);
  private readonly router = inject(Router);

  private authEventSub?: Subscription;

  readonly activeLang = this.lang.current;
  readonly currentUser = this.authService.currentUser;

  readonly initials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    const parts = user.fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  });

  readonly isRetail = computed(
    () => this.tenantConfig.config()?.businessType === 'retail',
  );

  ngOnInit(): void {
    this.authEventSub = this.authEvents.stream$.subscribe((event) => {
      if (event.type === 'refresh-failed' || event.type === 'unauthenticated') {
        this.router.navigate(['/', this.activeLang(), 'login'], {
          queryParams: { returnUrl: this.router.url },
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.authEventSub?.unsubscribe();
  }

  signOut(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/', this.activeLang()]),
      error: () => this.router.navigate(['/', this.activeLang()]),
    });
  }
}
