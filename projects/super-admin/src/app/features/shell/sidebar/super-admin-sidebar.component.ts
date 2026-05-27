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

import { SuperAdminAuthService } from '../../../core/services/super-admin-auth.service';
import { NAV_SECTIONS } from '../nav-config';

@Component({
  selector: 'sa-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './super-admin-sidebar.component.html',
  styleUrls: ['./super-admin-sidebar.component.css'],
})
export class SuperAdminSidebarComponent {
  private readonly auth = inject(SuperAdminAuthService);

  @Input() mobileOpen = false;
  @Input() isMobileViewport = false;
  @Output() closeMobile = new EventEmitter<void>();

  readonly currentUser = this.auth.currentUser;

  readonly visibleSections = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    const role = user.role;

    return NAV_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.roles.includes(role)),
      }))
      .filter((section) => section.items.length > 0);
  });
}
