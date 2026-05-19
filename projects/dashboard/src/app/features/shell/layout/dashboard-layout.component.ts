import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LanguageToggleService } from '@shared/i18n';
import { DashboardSidebarComponent } from '../sidebar/dashboard-sidebar.component';
import { DashboardTopbarComponent } from '../topbar/dashboard-topbar.component';
import { BusinessType } from '../../../core/models/dashboard-user.model';

const MOBILE_BREAKPOINT = 1024;

@Component({
  selector: 'db-layout',
  standalone: true,
  imports: [RouterOutlet, DashboardSidebarComponent, DashboardTopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-layout" [class.db-layout--rtl]="langToggle.isRtl()">
      <db-sidebar
        [mobileOpen]="sidebarOpen()"
        [businessType]="businessType"
        [isMobileViewport]="isMobile()"
        (closeMobile)="sidebarOpen.set(false)"
      />

      <div class="db-layout__main">
        <db-topbar (menuToggle)="toggleSidebar()" />

        <main class="db-layout__content" id="main-content" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .db-layout {
        display: flex;
        min-block-size: 100dvh;
      }

      .db-layout__main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-inline-size: 0;
        margin-inline-start: var(--sidebar-width, 240px);
        transition: margin-inline-start var(--motion-base);
      }

      @media (max-width: 1023px) {
        .db-layout__main {
          margin-inline-start: 0;
        }
      }

      .db-layout__content {
        flex: 1;
        overflow-x: hidden;
        outline: none;
      }

      /* RTL handled by :host-context since LanguageToggleService sets html[dir] */
    `,
  ],
})
export class DashboardLayoutComponent implements OnInit {
  readonly langToggle = inject(LanguageToggleService);

  readonly sidebarOpen = signal(false);
  readonly isMobile = signal(false);
  readonly businessType: BusinessType = 'restaurant';

  ngOnInit(): void {
    this.checkMobile();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile.set(window.innerWidth < MOBILE_BREAKPOINT);
    if (window.innerWidth >= MOBILE_BREAKPOINT) {
      this.sidebarOpen.set(false);
    }
  }
}
