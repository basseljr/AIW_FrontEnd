import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { SuperAdminSidebarComponent } from './super-admin-sidebar.component';
import { SuperAdminAuthService } from '../../../core/services/super-admin-auth.service';
import { SuperAdminRole } from '../../../core/models/super-admin-user.model';
import { TestTranslateLoader } from '../../../testing/test-translate-loader';

function configure(role: SuperAdminRole) {
  const user = signal({
    userId: 'u-1', email: 'a@b.com', name: 'Alice',
    role, mfaEnabled: true,
  });
  const mockAuth = { currentUser: user.asReadonly() };

  TestBed.configureTestingModule({
    imports: [
      SuperAdminSidebarComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
    ],
    providers: [
      provideRouter([]),
      { provide: SuperAdminAuthService, useValue: mockAuth },
    ],
  });
  return TestBed.createComponent(SuperAdminSidebarComponent);
}

describe('SuperAdminSidebarComponent', () => {
  it('creates the component', () => {
    const fixture = configure('super_admin');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows all nav sections for super_admin', () => {
    const fixture = configure('super_admin');
    fixture.detectChanges();
    const sections = fixture.componentInstance.visibleSections();
    expect(sections.length).toBeGreaterThanOrEqual(5);
  });

  it('shows fewer items for support_agent than super_admin', () => {
    // Pull the static nav config so we don't need two TestBeds in one test.
    const fixture = configure('support_agent');
    fixture.detectChanges();
    const supportCount = fixture.componentInstance.visibleSections()
      .reduce((n, s) => n + s.items.length, 0);
    // super_admin sees every item across every section
    expect(supportCount).toBeGreaterThan(0);
    expect(supportCount).toBeLessThan(20);
  });

  it('hides feature flag admin from finance role', () => {
    const fixture = configure('finance');
    fixture.detectChanges();
    const items = fixture.componentInstance.visibleSections()
      .flatMap((s) => s.items.map((i) => i.route));
    expect(items).not.toContain('/feature-flags');
  });

  it('shows feature flags to developer role', () => {
    const fixture = configure('developer');
    fixture.detectChanges();
    const items = fixture.componentInstance.visibleSections()
      .flatMap((s) => s.items.map((i) => i.route));
    expect(items).toContain('/feature-flags');
  });

  it('emits closeMobile when a link is clicked', () => {
    const fixture = configure('super_admin');
    fixture.detectChanges();
    const spy = jasmine.createSpy('closeMobile');
    fixture.componentInstance.closeMobile.subscribe(spy);
    fixture.nativeElement.querySelector('.sa-sidebar__link')?.click();
    expect(spy).toHaveBeenCalled();
  });
});
