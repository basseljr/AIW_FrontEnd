import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService, SupportedLang } from '@shared/i18n';
import { DashboardAuthService } from '../../../core/services/dashboard-auth.service';
import { NotificationHubService } from '../../../core/services/notification-hub.service';
import { DashboardTopbarComponent } from './dashboard-topbar.component';

class MockLoader implements TranslateLoader {
  getTranslation() {
    return of({
      nav: { open_sidebar: 'Open nav' },
      topbar: {
        notifications: 'Notifications', no_notifications: 'No notifications',
        mark_all_read: 'Mark all read', language_toggle: 'Toggle lang',
        user_menu: 'User menu', profile: 'Profile', sign_out: 'Sign Out',
      },
    });
  }
}

function buildFixture() {
  const mockLang = signal<SupportedLang>('en');
  const mockUser = signal({ userId: 'u1', tenantId: 't1', role: 'owner' as const, email: 'admin@test.com' });

  const mockLangToggle = {
    current: mockLang.asReadonly(),
    isRtl: signal(false).asReadonly(),
    toggle: jasmine.createSpy('toggle').and.callFake(() => {
      mockLang.set(mockLang() === 'en' ? 'ar' : 'en');
    }),
  };

  const mockAuth = {
    currentUser: mockUser.asReadonly(),
    isAuthenticated: signal(true).asReadonly(),
    logout: jasmine.createSpy('logout'),
  };

  const mockHub = {
    unreadCount: signal(0).asReadonly(),
    notifications: signal([]).asReadonly(),
    connected: signal(false).asReadonly(),
    connect: jasmine.createSpy('connect'),
    disconnect: jasmine.createSpy('disconnect'),
    markAllRead: jasmine.createSpy('markAllRead'),
  };

  TestBed.configureTestingModule({
    imports: [
      DashboardTopbarComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: LanguageToggleService, useValue: mockLangToggle },
      { provide: DashboardAuthService, useValue: mockAuth },
      { provide: NotificationHubService, useValue: mockHub },
    ],
  });

  return { fixture: TestBed.createComponent(DashboardTopbarComponent), mockLangToggle, mockAuth };
}

describe('DashboardTopbarComponent', () => {
  it('emits menuToggle when hamburger is clicked', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();

    const spy = jasmine.createSpy('menuToggle');
    fixture.componentInstance.menuToggle.subscribe(spy);

    fixture.nativeElement.querySelector('.db-topbar__menu-btn')?.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('calls langToggle.toggle when language button clicked', () => {
    const { fixture, mockLangToggle } = buildFixture();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.db-topbar__action-btn')?.click();
    expect(mockLangToggle.toggle).toHaveBeenCalledTimes(1);
  });

  it('opens user menu when toggleUserMenu() is called', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();

    fixture.componentInstance.toggleUserMenu();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.db-topbar__user-menu')).toBeTruthy();
  });

  it('closes user menu when toggleUserMenu() called twice', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();

    fixture.componentInstance.toggleUserMenu();
    fixture.detectChanges();
    expect(fixture.componentInstance.userMenuOpen()).toBe(true);

    fixture.componentInstance.toggleUserMenu();
    fixture.detectChanges();
    expect(fixture.componentInstance.userMenuOpen()).toBe(false);
  });

  it('calls auth.logout when signOut() is called', () => {
    const { fixture, mockAuth } = buildFixture();
    fixture.detectChanges();

    fixture.componentInstance.signOut();

    expect(mockAuth.logout).toHaveBeenCalledTimes(1);
  });

  it('closes user menu when signOut() is called', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();

    fixture.componentInstance.userMenuOpen.set(true);
    fixture.componentInstance.signOut();

    expect(fixture.componentInstance.userMenuOpen()).toBe(false);
  });

  it('shows user initial in avatar', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(fixture.componentInstance.userInitial()).toBe('A');
  });
});
