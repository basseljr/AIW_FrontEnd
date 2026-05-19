import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { DashboardAuthService } from '../../../core/services/dashboard-auth.service';
import { DashboardRole, BusinessType } from '../../../core/models/dashboard-user.model';

interface NavItem {
  labelKey: string;
  route: string;
  icon: string;
  roles: DashboardRole[];
  businessTypes?: BusinessType[];
}

interface NavSection {
  titleKey?: string;
  items: NavItem[];
  businessTypes?: BusinessType[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        labelKey: 'nav.overview',
        route: '/overview',
        icon: '◉',
        roles: ['owner', 'manager', 'staff', 'kitchen', 'accountant'],
      },
      {
        labelKey: 'nav.orders',
        route: '/orders',
        icon: '📦',
        roles: ['owner', 'manager', 'staff', 'kitchen'],
      },
      {
        labelKey: 'nav.customers',
        route: '/customers',
        icon: '👥',
        roles: ['owner', 'manager'],
      },
      {
        labelKey: 'nav.analytics',
        route: '/analytics',
        icon: '📊',
        roles: ['owner', 'manager', 'accountant'],
      },
    ],
  },
  {
    titleKey: 'nav.section_restaurant',
    businessTypes: ['restaurant'],
    items: [
      {
        labelKey: 'nav.menu',
        route: '/menu',
        icon: '🍽️',
        roles: ['owner', 'manager'],
        businessTypes: ['restaurant'],
      },
      {
        labelKey: 'nav.kitchen',
        route: '/kitchen',
        icon: '👨‍🍳',
        roles: ['owner', 'manager', 'kitchen'],
        businessTypes: ['restaurant'],
      },
      {
        labelKey: 'nav.reservations',
        route: '/reservations',
        icon: '📅',
        roles: ['owner', 'manager'],
        businessTypes: ['restaurant'],
      },
    ],
  },
  {
    titleKey: 'nav.section_retail',
    businessTypes: ['retail'],
    items: [
      {
        labelKey: 'nav.products',
        route: '/products',
        icon: '🏷️',
        roles: ['owner', 'manager'],
        businessTypes: ['retail'],
      },
      {
        labelKey: 'nav.inventory',
        route: '/inventory',
        icon: '📋',
        roles: ['owner', 'manager'],
        businessTypes: ['retail'],
      },
    ],
  },
  {
    titleKey: 'nav.section_service',
    businessTypes: ['service'],
    items: [
      {
        labelKey: 'nav.services_catalog',
        route: '/services',
        icon: '🛠️',
        roles: ['owner', 'manager'],
        businessTypes: ['service'],
      },
      {
        labelKey: 'nav.appointments',
        route: '/appointments',
        icon: '🗓️',
        roles: ['owner', 'manager', 'staff'],
        businessTypes: ['service'],
      },
    ],
  },
  {
    titleKey: 'nav.section_management',
    items: [
      {
        labelKey: 'nav.staff',
        route: '/staff',
        icon: '🪪',
        roles: ['owner'],
      },
      {
        labelKey: 'nav.settings',
        route: '/settings',
        icon: '⚙️',
        roles: ['owner'],
      },
    ],
  },
];

@Component({
  selector: 'db-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="db-sidebar"
      [class.db-sidebar--open]="mobileOpen"
      [attr.aria-hidden]="!mobileOpen && isMobileViewport ? 'true' : null"
    >
      <div class="db-sidebar__inner">
        <!-- Logo -->
        <div class="db-sidebar__brand">
          <div class="db-sidebar__logo-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="var(--accent)" />
              <path d="M8 22L12 10L16 18L20 14L24 22H8Z" fill="white" opacity="0.9" />
            </svg>
          </div>
          <span class="db-sidebar__wordmark">Aiw</span>
          <button
            class="db-sidebar__close-btn"
            type="button"
            [attr.aria-label]="'nav.close_sidebar' | translate"
            (click)="closeMobile.emit()"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="db-sidebar__nav" [attr.aria-label]="'nav.open_sidebar' | translate">
          @for (section of visibleSections(); track $index) {
            <div class="db-sidebar__section">
              @if (section.titleKey) {
                <p class="db-sidebar__section-title">{{ section.titleKey | translate }}</p>
              }
              @for (item of section.items; track item.route) {
                <a
                  class="db-sidebar__link"
                  routerLinkActive="db-sidebar__link--active"
                  [routerLink]="item.route"
                  (click)="closeMobile.emit()"
                >
                  <span class="db-sidebar__link-icon" aria-hidden="true">{{ item.icon }}</span>
                  <span class="db-sidebar__link-label">{{ item.labelKey | translate }}</span>
                </a>
              }
            </div>
          }
        </nav>

        <!-- User footer -->
        <div class="db-sidebar__footer">
          @if (currentUser()) {
            <div class="db-sidebar__user">
              <div class="db-sidebar__user-avatar" aria-hidden="true">
                {{ currentUser()!.email.charAt(0).toUpperCase() }}
              </div>
              <div class="db-sidebar__user-info">
                <p class="db-sidebar__user-email">{{ currentUser()!.email }}</p>
                <p class="db-sidebar__user-role">{{ currentUser()!.role }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </aside>

    @if (mobileOpen) {
      <div
        class="db-sidebar__scrim"
        (click)="closeMobile.emit()"
        aria-hidden="true"
      ></div>
    }
  `,
  styles: [
    `
      .db-sidebar {
        position: fixed;
        inset-block: 0;
        inset-inline-start: 0;
        inline-size: var(--sidebar-width, 240px);
        background: var(--surface);
        border-inline-end: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        z-index: 100;
        transition: transform var(--motion-base) ease;
      }

      @media (max-width: 1023px) {
        .db-sidebar {
          transform: translateX(-110%);
          box-shadow: none;
        }

        [dir='rtl'] .db-sidebar {
          transform: translateX(110%);
          inset-inline-start: auto;
          inset-inline-end: 0;
          border-inline-end: none;
          border-inline-start: 1px solid var(--border);
        }

        .db-sidebar--open {
          transform: translateX(0);
          box-shadow: 0 0 40px rgba(15, 23, 42, 0.16);
        }
      }

      .db-sidebar__inner {
        display: flex;
        flex-direction: column;
        block-size: 100%;
        overflow-y: auto;
      }

      .db-sidebar__brand {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 1.125rem 1rem;
        border-block-end: 1px solid var(--border);
        flex-shrink: 0;
      }

      .db-sidebar__wordmark {
        font-size: 1.125rem;
        font-weight: 800;
        color: var(--text);
        letter-spacing: -0.03em;
        flex: 1;
      }

      .db-sidebar__close-btn {
        display: none;
        align-items: center;
        justify-content: center;
        inline-size: 2rem;
        block-size: 2rem;
        border: none;
        background: transparent;
        color: var(--text-muted);
        border-radius: var(--radius-control);
        cursor: pointer;
      }

      @media (max-width: 1023px) {
        .db-sidebar__close-btn {
          display: flex;
        }
      }

      .db-sidebar__nav {
        padding: 0.75rem 0.625rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .db-sidebar__section {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        margin-block-end: 0.5rem;
      }

      .db-sidebar__section-title {
        font-size: 0.6875rem;
        font-weight: 700;
        color: var(--text-subtle);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        padding-inline: 0.75rem;
        padding-block: 0.5rem 0.25rem;
        margin: 0;
      }

      .db-sidebar__link {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding-block: 0.5625rem;
        padding-inline: 0.75rem;
        border-radius: var(--radius-control);
        color: var(--text-muted);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
        transition: background-color var(--motion-fast), color var(--motion-fast);
      }

      .db-sidebar__link:hover {
        background: var(--surface-alt);
        color: var(--text);
      }

      .db-sidebar__link--active {
        background: color-mix(in srgb, var(--accent) 10%, transparent);
        color: var(--accent);
        font-weight: 600;
      }

      .db-sidebar__link--active:hover {
        background: color-mix(in srgb, var(--accent) 14%, transparent);
      }

      .db-sidebar__link-icon {
        font-size: 1rem;
        line-height: 1;
        flex-shrink: 0;
      }

      .db-sidebar__footer {
        padding: 0.75rem 1rem;
        border-block-start: 1px solid var(--border);
        flex-shrink: 0;
      }

      .db-sidebar__user {
        display: flex;
        align-items: center;
        gap: 0.625rem;
      }

      .db-sidebar__user-avatar {
        inline-size: 2rem;
        block-size: 2rem;
        border-radius: 50%;
        background: color-mix(in srgb, var(--accent) 15%, transparent);
        color: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 700;
        flex-shrink: 0;
      }

      .db-sidebar__user-info {
        flex: 1;
        min-inline-size: 0;
      }

      .db-sidebar__user-email {
        font-size: 0.8125rem;
        color: var(--text);
        font-weight: 500;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .db-sidebar__user-role {
        font-size: 0.75rem;
        color: var(--text-subtle);
        margin: 0;
        text-transform: capitalize;
      }

      .db-sidebar__scrim {
        display: none;
        position: fixed;
        inset: 0;
        background: var(--overlay-scrim);
        z-index: 99;
      }

      @media (max-width: 1023px) {
        .db-sidebar__scrim {
          display: block;
        }
      }
    `,
  ],
})
export class DashboardSidebarComponent {
  private readonly auth = inject(DashboardAuthService);

  @Input() mobileOpen = false;
  @Input() businessType: BusinessType = 'restaurant';
  @Input() isMobileViewport = false;

  @Output() closeMobile = new EventEmitter<void>();

  readonly currentUser = this.auth.currentUser;

  readonly visibleSections = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    const role = user.role;

    return NAV_SECTIONS
      .filter((section) => {
        if (section.businessTypes && !section.businessTypes.includes(this.businessType)) {
          return false;
        }
        return section.items.some((item) => item.roles.includes(role));
      })
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.businessTypes && !item.businessTypes.includes(this.businessType)) return false;
          return item.roles.includes(role);
        }),
      }))
      .filter((section) => section.items.length > 0);
  });
}
