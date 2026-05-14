import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { LanguageToggleService, SupportedLang } from '@shared/i18n';
import { TenantConfigService } from '../../../../core/services/tenant-cconfig.service';
import { DEFAULT_DEV_TENANT } from '../../../../core/models/tenant-config.model';
import { StorefrontHeaderComponent } from './storefront-header.component';

class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      shell: {
        header: {
          cart_label: 'Cart',
          login: 'Login',
          open_menu: 'Open menu',
          close_menu: 'Close menu',
          skip_to_content: 'Skip',
          language_toggle: 'Switch language',
        },
      },
      nav: { open_menu: 'Open' },
    });
  }
}

function buildFixture() {
  const mockLang = signal<SupportedLang>('en');
  const mockConfig = signal(DEFAULT_DEV_TENANT);

  const mockLangToggle = {
    current: mockLang.asReadonly(),
    isRtl: signal(false).asReadonly(),
    toggle: jasmine.createSpy('toggle').and.callFake(() => {
      mockLang.set(mockLang() === 'en' ? 'ar' : 'en');
    }),
    set: jasmine.createSpy('set').and.callFake((l: SupportedLang) => mockLang.set(l)),
    supported: ['en', 'ar'] as const,
    initialize: jasmine.createSpy('initialize'),
  };

  const mockTenantConfig = {
    config: mockConfig.asReadonly(),
    isNotFound: signal(false).asReadonly(),
    isReady: signal(true).asReadonly(),
  };

  TestBed.configureTestingModule({
    imports: [
      StorefrontHeaderComponent,
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: MockTranslateLoader },
      }),
    ],
    providers: [
      provideRouter([]),
      { provide: LanguageToggleService, useValue: mockLangToggle },
      { provide: TenantConfigService, useValue: mockTenantConfig },
    ],
  });

  return {
    fixture: TestBed.createComponent(StorefrontHeaderComponent),
    mockLang,
    mockLangToggle,
  };
}

describe('StorefrontHeaderComponent', () => {
  it('renders the business name as the logo text when no logoUrl', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    const logoText = fixture.nativeElement.querySelector('.sf-nav__logo-text');
    expect(logoText?.textContent?.trim()).toBe('The Golden Oasis');
  });

  it('renders desktop nav links from tenant config', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('.sf-nav__link');
    expect(links.length).toBe(DEFAULT_DEV_TENANT.navLinks.length);
  });

  it('shows Arabic labels when language is ar', fakeAsync(() => {
    const { fixture, mockLang } = buildFixture();
    fixture.detectChanges();
    mockLang.set('ar');
    fixture.detectChanges();
    tick();

    const links = fixture.nativeElement.querySelectorAll('.sf-nav__link');
    const texts = Array.from(links).map((l) => (l as HTMLElement).textContent?.trim());
    expect(texts).toContain('الرئيسية');
  }));

  it('toggleMenu opens and closes the mobile drawer', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.menuOpen()).toBe(false);

    component.toggleMenu();
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(true);

    const drawer = fixture.nativeElement.querySelector('.sf-mobile-drawer');
    expect(drawer?.classList).toContain('sf-mobile-drawer--open');

    component.closeMenu();
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(false);
  });

  it('calls langToggle.toggle() when the language pill is clicked', () => {
    const { fixture, mockLangToggle } = buildFixture();
    fixture.detectChanges();

    const pill = fixture.nativeElement.querySelector('.sf-nav__lang-pill');
    pill.click();
    expect(mockLangToggle.toggle).toHaveBeenCalledTimes(1);
  });

  it('shows cart badge when cartCount > 0', () => {
    const { fixture } = buildFixture();
    fixture.componentInstance.cartCount.set(3);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.sf-nav__cart-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('3');
  });

  it('does not show cart badge when cartCount is 0', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sf-nav__cart-badge')).toBeNull();
  });

  it('sets isScrolled when window scroll fires', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance.isScrolled()).toBe(false);

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    fixture.componentInstance.onScroll();
    fixture.detectChanges();
    expect(fixture.componentInstance.isScrolled()).toBe(true);

    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    fixture.componentInstance.onScroll();
    fixture.detectChanges();
    expect(fixture.componentInstance.isScrolled()).toBe(false);
  });
});
