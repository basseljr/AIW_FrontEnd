import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { LanguageToggleService, SupportedLang } from '@shared/i18n';
import { TenantConfigService } from '../../../../core/services/tenant-cconfig.service';
import { DEFAULT_DEV_TENANT } from '../../../../core/models/tenant-config.model';
import { StorefrontFooterComponent } from './storefront-footer.component';

class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      shell: {
        footer: {
          explore: 'Explore',
          contact: 'Contact',
          privacy: 'Privacy',
          terms: 'Terms',
          rights_reserved: 'All rights reserved.',
          powered_by: 'Powered by Aiw',
        },
      },
    });
  }
}

function buildFixture() {
  const mockLang = signal<SupportedLang>('en');
  const mockLangToggle = {
    current: mockLang.asReadonly(),
    isRtl: signal(false).asReadonly(),
    toggle: jasmine.createSpy(),
    set: jasmine.createSpy(),
    supported: ['en', 'ar'] as const,
    initialize: jasmine.createSpy(),
  };
  const mockTenantConfig = {
    config: signal(DEFAULT_DEV_TENANT).asReadonly(),
    isNotFound: signal(false).asReadonly(),
    isReady: signal(true).asReadonly(),
  };

  TestBed.configureTestingModule({
    imports: [
      StorefrontFooterComponent,
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
  return { fixture: TestBed.createComponent(StorefrontFooterComponent), mockLang };
}

describe('StorefrontFooterComponent', () => {
  it('renders the business name', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.sf-footer__name')?.textContent?.trim(),
    ).toBe('The Golden Oasis');
  });

  it('renders Arabic business name when lang is ar', () => {
    const { fixture, mockLang } = buildFixture();
    mockLang.set('ar');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.sf-footer__name')?.textContent?.trim(),
    ).toBe('الواحة الذهبية');
  });

  it('renders nav links in the quick-links column', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('.sf-footer__link-list a');
    expect(links.length).toBe(DEFAULT_DEV_TENANT.navLinks.length);
  });

  it('renders social icons for configured social links', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    const socialLinks = fixture.nativeElement.querySelectorAll('.sf-footer__social-link');
    // DEFAULT_DEV_TENANT has instagram, twitter, facebook configured
    expect(socialLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('renders the privacy and terms legal links', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    const legalLinks = fixture.nativeElement.querySelectorAll('.sf-footer__legal-link');
    expect(legalLinks.length).toBe(2);
  });

  it('renders contact phone as a tel: link', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    const telLink = fixture.nativeElement.querySelector('a[href^="tel:"]');
    expect(telLink).toBeTruthy();
    expect(telLink.getAttribute('href')).toContain(DEFAULT_DEV_TENANT.contact.phone!);
  });
});
