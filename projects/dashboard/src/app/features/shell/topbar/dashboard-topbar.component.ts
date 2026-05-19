import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Output,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { DashboardAuthService } from '../../../core/services/dashboard-auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'db-topbar',
  standalone: true,
  imports: [TranslateModule, NotificationBellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="db-topbar">
      <button
        class="db-topbar__menu-btn"
        type="button"
        [attr.aria-label]="'nav.open_sidebar' | translate"
        (click)="menuToggle.emit()"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      <div class="db-topbar__spacer"></div>

      <div class="db-topbar__actions">
        <!-- Language toggle -->
        <button
          class="db-topbar__action-btn"
          type="button"
          [attr.aria-label]="'topbar.language_toggle' | translate"
          (click)="langToggle.toggle()"
        >
          <span class="db-topbar__lang-pill" aria-hidden="true">
            {{ (langToggle.current() === 'ar' ? 'topbar.switch_to_en' : 'topbar.switch_to_ar') | translate }}
          </span>
        </button>

        <!-- Notification bell -->
        <db-notification-bell />

        <!-- User menu -->
        <div class="db-topbar__user-wrap">
          <button
            class="db-topbar__user-btn"
            type="button"
            [attr.aria-label]="'topbar.user_menu' | translate"
            [attr.aria-expanded]="userMenuOpen()"
            (click)="toggleUserMenu()"
          >
            <div class="db-topbar__avatar" aria-hidden="true">
              {{ userInitial() }}
            </div>
          </button>

          @if (userMenuOpen()) {
            <div class="db-topbar__user-menu" role="menu">
              @if (auth.currentUser()) {
                <div class="db-topbar__user-info">
                  <p class="db-topbar__user-email">{{ auth.currentUser()!.email }}</p>
                  <p class="db-topbar__user-role">{{ auth.currentUser()!.role }}</p>
                </div>
                <hr class="db-topbar__divider" />
              }
              <button
                class="db-topbar__menu-item"
                type="button"
                role="menuitem"
                (click)="signOut()"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {{ 'topbar.sign_out' | translate }}
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .db-topbar {
        position: sticky;
        inset-block-start: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        padding-inline: 1.25rem;
        block-size: 3.5rem;
        background: var(--surface);
        border-block-end: 1px solid var(--border);
        gap: 0.75rem;
      }

      .db-topbar__menu-btn {
        display: none;
        align-items: center;
        justify-content: center;
        inline-size: 2.25rem;
        block-size: 2.25rem;
        border: none;
        background: transparent;
        color: var(--text-muted);
        border-radius: var(--radius-control);
        cursor: pointer;
        flex-shrink: 0;
        transition: background-color var(--motion-fast);
      }

      .db-topbar__menu-btn:hover {
        background: var(--surface-alt);
        color: var(--text);
      }

      @media (max-width: 1023px) {
        .db-topbar__menu-btn {
          display: flex;
        }
      }

      .db-topbar__spacer {
        flex: 1;
      }

      .db-topbar__actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .db-topbar__action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 2.25rem;
        block-size: 2.25rem;
        border: none;
        background: transparent;
        color: var(--text-muted);
        border-radius: var(--radius-control);
        cursor: pointer;
        transition: background-color var(--motion-fast);
      }

      .db-topbar__action-btn:hover {
        background: var(--surface-alt);
        color: var(--text);
      }

      .db-topbar__lang-pill {
        font-size: 0.75rem;
        font-weight: 700;
        color: inherit;
        letter-spacing: 0.02em;
      }

      .db-topbar__user-wrap {
        position: relative;
      }

      .db-topbar__user-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 2.25rem;
        block-size: 2.25rem;
        border: 1.5px solid var(--border);
        background: var(--surface-elevated);
        border-radius: 50%;
        cursor: pointer;
        transition: border-color var(--motion-fast);
        padding: 0;
      }

      .db-topbar__user-btn:hover {
        border-color: var(--accent);
      }

      .db-topbar__avatar {
        inline-size: 100%;
        block-size: 100%;
        border-radius: 50%;
        background: color-mix(in srgb, var(--accent) 15%, transparent);
        color: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 700;
      }

      .db-topbar__user-menu {
        position: absolute;
        inset-block-start: calc(100% + 0.5rem);
        inset-inline-end: 0;
        inline-size: 16rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12);
        z-index: 200;
        overflow: hidden;
      }

      .db-topbar__user-info {
        padding: 0.875rem 1rem;
      }

      .db-topbar__user-email {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text);
        margin: 0 0 0.125rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .db-topbar__user-role {
        font-size: 0.75rem;
        color: var(--text-subtle);
        margin: 0;
        text-transform: capitalize;
      }

      .db-topbar__divider {
        border: none;
        border-block-start: 1px solid var(--border);
        margin: 0;
      }

      .db-topbar__menu-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        inline-size: 100%;
        padding: 0.625rem 1rem;
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-size: 0.875rem;
        font-family: inherit;
        font-weight: 500;
        cursor: pointer;
        text-align: start;
        transition: background-color var(--motion-fast), color var(--motion-fast);
      }

      .db-topbar__menu-item:hover {
        background: var(--surface-alt);
        color: var(--text);
      }
    `,
  ],
})
export class DashboardTopbarComponent {
  readonly auth = inject(DashboardAuthService);
  readonly langToggle = inject(LanguageToggleService);

  @Output() menuToggle = new EventEmitter<void>();

  readonly userMenuOpen = signal(false);

  userInitial(): string {
    const email = this.auth.currentUser()?.email ?? '';
    return email.charAt(0).toUpperCase() || '?';
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
  }

  signOut(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    if (!el.closest('db-topbar')) {
      this.userMenuOpen.set(false);
    }
  }
}
