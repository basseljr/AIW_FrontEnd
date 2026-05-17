import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ContactComponent } from './contact.component';
import { TenantConfigService } from '../../../core/services/tenant-config.service';
import { LanguageToggleService } from '@shared/i18n';
import { BranchesService } from '../../../core/services/branches.service';

describe('ContactComponent', () => {
  function createFixture() {
    TestBed.configureTestingModule({
      imports: [ContactComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: TenantConfigService,
          useValue: {
            config: signal({
              contact: { phone: null, email: null, address: null, addressAr: null, workingHours: null, workingHoursAr: null },
              socialLinks: { instagram: null, twitter: null, facebook: null, whatsapp: null, tiktok: null },
            }),
          },
        },
        {
          provide: LanguageToggleService,
          useValue: { current: signal('en'), isRtl: signal(false) },
        },
        {
          provide: BranchesService,
          useValue: { getBranches: jasmine.createSpy('getBranches').and.returnValue(of([])) },
        },
      ],
    });
    return TestBed.createComponent(ContactComponent);
  }

  it('renders contact form', () => {
    const fixture = createFixture();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.contact__title')).toBeTruthy();
    expect(el.querySelector('.contact__form')).toBeTruthy();
  });
});
