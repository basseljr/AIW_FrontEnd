import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { DashboardAuthService } from '../../../core/services/dashboard-auth.service';
import { DashboardSidebarComponent } from './dashboard-sidebar.component';

class MockLoader implements TranslateLoader {
  getTranslation() {
    return of({});
  }
}

function buildFixture(role: string, businessType = 'restaurant') {
  const mockUser = signal({
    userId: 'u1',
    tenantId: 't1',
    role: role as 'owner',
    email: 'test@test.com',
  });
  const mockAuth = {
    currentUser: mockUser.asReadonly(),
    isAuthenticated: signal(true).asReadonly(),
    logout: jasmine.createSpy('logout'),
  };

  TestBed.configureTestingModule({
    imports: [
      DashboardSidebarComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      provideRouter([]),
      { provide: DashboardAuthService, useValue: mockAuth },
    ],
  });

  const fixture = TestBed.createComponent(DashboardSidebarComponent);
  fixture.componentInstance.businessType = businessType as 'restaurant';
  fixture.detectChanges();
  return fixture;
}

describe('DashboardSidebarComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('shows Overview for owner role', () => {
    const fixture = buildFixture('owner');
    const items = fixture.componentInstance.visibleSections().flatMap((s) => s.items);
    expect(items.some((i) => i.labelKey === 'nav.overview')).toBe(true);
  });

  it('shows Overview for accountant role', () => {
    const fixture = buildFixture('accountant');
    const items = fixture.componentInstance.visibleSections().flatMap((s) => s.items);
    expect(items.some((i) => i.labelKey === 'nav.overview')).toBe(true);
  });

  it('shows Overview for staff role', () => {
    const fixture = buildFixture('staff');
    const items = fixture.componentInstance.visibleSections().flatMap((s) => s.items);
    expect(items.some((i) => i.labelKey === 'nav.overview')).toBe(true);
  });

  it('hides Staff and Settings from manager role', () => {
    const fixture = buildFixture('manager');
    const items = fixture.componentInstance.visibleSections().flatMap((s) => s.items);
    expect(items.some((i) => i.labelKey === 'nav.staff')).toBe(false);
    expect(items.some((i) => i.labelKey === 'nav.settings')).toBe(false);
  });

  it('shows Staff and Settings for owner role', () => {
    const fixture = buildFixture('owner');
    const items = fixture.componentInstance.visibleSections().flatMap((s) => s.items);
    expect(items.some((i) => i.labelKey === 'nav.staff')).toBe(true);
    expect(items.some((i) => i.labelKey === 'nav.settings')).toBe(true);
  });

  it('shows menu item only for restaurant businessType', () => {
    const fixture = buildFixture('owner', 'restaurant');
    const items = fixture.componentInstance.visibleSections().flatMap((s) => s.items);
    expect(items.some((i) => i.labelKey === 'nav.menu')).toBe(true);
    expect(items.some((i) => i.labelKey === 'nav.products')).toBe(false);
  });

  it('shows products item only for retail businessType', () => {
    const fixture = buildFixture('owner', 'retail');
    const items = fixture.componentInstance.visibleSections().flatMap((s) => s.items);
    expect(items.some((i) => i.labelKey === 'nav.products')).toBe(true);
    expect(items.some((i) => i.labelKey === 'nav.menu')).toBe(false);
  });

  it('shows appointments only for service businessType', () => {
    const fixture = buildFixture('owner', 'service');
    const items = fixture.componentInstance.visibleSections().flatMap((s) => s.items);
    expect(items.some((i) => i.labelKey === 'nav.appointments')).toBe(true);
  });

  it('emits closeMobile when a nav link is clicked', () => {
    const fixture = buildFixture('owner');
    fixture.componentInstance.mobileOpen = true;
    fixture.detectChanges();

    const spy = jasmine.createSpy('closeMobile');
    fixture.componentInstance.closeMobile.subscribe(spy);

    const firstLink = fixture.nativeElement.querySelector('.db-sidebar__link');
    firstLink?.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('displays user email in the footer', () => {
    const fixture = buildFixture('owner');
    const email = fixture.nativeElement.querySelector('.db-sidebar__user-email');
    expect(email?.textContent?.trim()).toBe('test@test.com');
  });
});
