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
import { SuperAdminAuthService } from '../../../core/services/super-admin-auth.service';

@Component({
  selector: 'sa-topbar',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './super-admin-topbar.component.html',
  styleUrls: ['./super-admin-topbar.component.css'],
})
export class SuperAdminTopbarComponent {
  private readonly auth = inject(SuperAdminAuthService);
  protected readonly langToggle = inject(LanguageToggleService);

  @Output() menuToggle = new EventEmitter<void>();

  readonly currentUser = this.auth.currentUser;
  readonly userMenuOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly unreadCount = signal(3);

  toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
    if (this.userMenuOpen()) this.notificationsOpen.set(false);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((v) => !v);
    if (this.notificationsOpen()) this.userMenuOpen.set(false);
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
  }

  toggleLanguage(): void {
    this.langToggle.toggle();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.sa-topbar__user-wrap')) {
      this.userMenuOpen.set(false);
    }
    if (!target.closest('.sa-topbar__notif-wrap')) {
      this.notificationsOpen.set(false);
    }
  }
}
