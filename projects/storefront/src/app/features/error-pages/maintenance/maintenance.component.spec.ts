import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { LanguageToggleService, SupportedLang } from '@shared/i18n';
import { TenantConfigService } from '../../../core/services/tenant-cconfig.service';
import { DEFAULT_DEV_TENANT } from '../../../core/models/tenant-config.model';
import { MaintenanceComponent } from './maintenance.component';

class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      shell: {
        maintenance: {
          title: "We'll Be Back Soon",
          description: 'This store is temporarily unavailable.',
          contact_us: 'Contact Us',
        },
      },
    });
  }
}

describe('MaintenanceComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MaintenanceComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockTranslateLoader } }),
      ],
      providers: [
        {
          provide: LanguageToggleService,
          useValue: {
            current: signal<SupportedLang>('en').asReadonly(),
            isRtl: signal(false).asReadonly(),
            toggle: jasmine.createSpy(),
            set: jasmine.createSpy(),
            supported: ['en', 'ar'] as const,
            initialize: jasmine.createSpy(),
          },
        },
        {
          provide: TenantConfigService,
          useValue: {
            config: signal(DEFAULT_DEV_TENANT).asReadonly(),
            isNotFound: signal(false).asReadonly(),
            isReady: signal(true).asReadonly(),
          },
        },
      ],
    });
  });

  it('renders the maintenance title', async () => {
    const translate = TestBed.inject(TranslateService);
    await translate.use('en').toPromise();

    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.sf-maint__title');
    expect(title?.textContent?.trim()).toContain("We'll Be Back Soon");
  });

  it('renders the tenant business name', () => {
    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('.sf-maint__name');
    expect(name?.textContent?.trim()).toBe('The Golden Oasis');
  });

  it('renders a phone contact link when tenant has phone', () => {
    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href^="tel:"]');
    expect(link).toBeTruthy();
  });
});
