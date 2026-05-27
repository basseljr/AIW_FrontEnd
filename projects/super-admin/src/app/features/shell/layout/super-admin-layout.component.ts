import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { SuperAdminSidebarComponent } from '../sidebar/super-admin-sidebar.component';
import { SuperAdminTopbarComponent } from '../topbar/super-admin-topbar.component';

@Component({
  selector: 'sa-layout',
  standalone: true,
  imports: [RouterOutlet, TranslateModule, SuperAdminSidebarComponent, SuperAdminTopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sa-layout" [class.sa-layout--rtl]="langToggle.isRtl()">
      <sa-sidebar
        [mobileOpen]="sidebarOpen()"
        [isMobileViewport]="isMobile()"
        (closeMobile)="sidebarOpen.set(false)"
      />
      <div class="sa-layout__main">
        <div class="sa-layout__banner" role="alert">
          <span class="sa-layout__banner-icon" aria-hidden="true">⚠</span>
          <span>{{ 'banner.internal' | translate }}</span>
        </div>
        <sa-topbar (menuToggle)="toggleSidebar()" />
        <main class="sa-layout__content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }

      .sa-layout {
        min-block-size: 100dvh;
        background: var(--surface-alt);
      }

      .sa-layout__main {
        margin-inline-start: var(--sidebar-width, 252px);
        display: flex;
        flex-direction: column;
        min-block-size: 100dvh;
      }

      @media (max-width: 1023px) {
        .sa-layout__main {
          margin-inline-start: 0;
        }
      }

      .sa-layout__banner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        block-size: var(--banner-height, 36px);
        background: var(--banner-bg);
        color: var(--banner-text);
        font-size: 0.8125rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-align: center;
        padding-inline: 1rem;
      }

      .sa-layout__banner-icon {
        font-size: 0.875rem;
      }

      .sa-layout__content {
        flex: 1;
        padding: 1.5rem;
        max-inline-size: 1600px;
        inline-size: 100%;
        margin-inline: auto;
      }

      @media (max-width: 640px) {
        .sa-layout__content {
          padding: 1rem;
        }
        .sa-layout__banner {
          font-size: 0.6875rem;
        }
      }
    `,
  ],
})
export class SuperAdminLayoutComponent implements OnInit {
  protected readonly langToggle = inject(LanguageToggleService);

  readonly sidebarOpen = signal(false);
  readonly isMobile = signal(false);

  ngOnInit(): void {
    this.checkMobile();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  @HostListener('window:resize')
  checkMobile(): void {
    if (typeof window === 'undefined') return;
    this.isMobile.set(window.innerWidth < 1024);
    if (!this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }
}
