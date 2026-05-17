import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { AboutComponent } from './about.component';
import { TenantConfigService } from '../../../core/services/tenant-config.service';
import { LanguageToggleService } from '@shared/i18n';

describe('AboutComponent', () => {
  function createFixture() {
    TestBed.configureTestingModule({
      imports: [AboutComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: TenantConfigService,
          useValue: {
            config: signal({
              branding: { businessName: 'Test', businessNameAr: 'اختبار', tagline: null, taglineAr: null },
              contact: { phone: null, email: null, address: null, addressAr: null, workingHours: null, workingHoursAr: null },
              socialLinks: { instagram: null, twitter: null, facebook: null, whatsapp: null, tiktok: null },
            }),
          },
        },
        {
          provide: LanguageToggleService,
          useValue: { current: signal('en'), isRtl: signal(false) },
        },
      ],
    });
    return TestBed.createComponent(AboutComponent);
  }

  it('renders title', () => {
    const fixture = createFixture();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.about__title')).toBeTruthy();
  });
});
