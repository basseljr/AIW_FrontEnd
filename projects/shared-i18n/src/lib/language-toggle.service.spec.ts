import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { I18N_CONFIG } from './i18n-config.token';
import { LanguageToggleService } from './language-toggle.service';

describe('LanguageToggleService', () => {
  let service: LanguageToggleService;
  let translate: TranslateService;

  function configure(): void {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: I18N_CONFIG,
          useValue: { defaultLang: 'en', supportedLangs: ['en', 'ar'] },
        },
      ],
    });
    service = TestBed.inject(LanguageToggleService);
    translate = TestBed.inject(TranslateService);
  }

  beforeEach(() => {
    // Reset cookie and html attributes between tests so state doesn't leak.
    document.cookie = 'lang=; path=/; max-age=0';
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
    configure();
  });

  it('initializes to the configured default language', () => {
    service.initialize();
    expect(service.current()).toBe('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(translate.currentLang).toBe('en');
  });

  it('switches to Arabic, sets dir=rtl on <html>, and updates ngx-translate', () => {
    service.initialize();
    service.set('ar');

    expect(service.current()).toBe('ar');
    expect(service.isRtl()).toBe(true);
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(translate.currentLang).toBe('ar');
  });

  it('switches back from Arabic to English and resets dir=ltr', () => {
    service.set('ar');
    expect(service.isRtl()).toBe(true);
    service.set('en');

    expect(service.current()).toBe('en');
    expect(service.isRtl()).toBe(false);
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(translate.currentLang).toBe('en');
  });

  it('toggle() flips between en and ar', () => {
    service.initialize();
    expect(service.current()).toBe('en');

    service.toggle();
    expect(service.current()).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');

    service.toggle();
    expect(service.current()).toBe('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('persists the language in a cookie so initialize() restores it on next visit', () => {
    service.set('ar');
    expect(document.cookie).toContain('lang=ar');

    // Simulate a fresh page load: rebuild the service while leaving the cookie.
    TestBed.resetTestingModule();
    configure();

    service.initialize();
    expect(service.current()).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('falls back to the default when an unsupported language is requested', () => {
    service.set('fr' as never);
    expect(service.current()).toBe('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('honors an explicit preferred argument over the cookie value', () => {
    document.cookie = 'lang=ar; path=/';
    service.initialize('en');
    expect(service.current()).toBe('en');
  });
});
