import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { SettingsService } from '../../core/services/settings.service';
import { SettingsComponent } from './settings.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

function buildFixture() {
  const mockSettings = {
    getGeneral: jasmine.createSpy('getGeneral').and.returnValue(of({ preparationTime: 30, businessHours: [] })),
    updateGeneral: jasmine.createSpy('updateGeneral').and.returnValue(of({ preparationTime: 30, businessHours: [] })),
    getBranding: jasmine.createSpy('getBranding').and.returnValue(of({ logoUrl: null, faviconUrl: null, coverPhotoUrl: null, primaryColor: null, headerFooterColor: null })),
    updateBranding: jasmine.createSpy('updateBranding').and.returnValue(of({})),
    getDelivery: jasmine.createSpy('getDelivery').and.returnValue(of({ minOrderAmount: 1, freeDeliveryThreshold: null })),
    updateDelivery: jasmine.createSpy('updateDelivery').and.returnValue(of({})),
    getSocialLinks: jasmine.createSpy('getSocialLinks').and.returnValue(of({ instagram: null, twitter: null, facebook: null, whatsapp: null, tiktok: null })),
    updateSocialLinks: jasmine.createSpy('updateSocialLinks').and.returnValue(of({})),
    getSeo: jasmine.createSpy('getSeo').and.returnValue(of({})),
    updateSeo: jasmine.createSpy('updateSeo').and.returnValue(of({})),
  };

  TestBed.configureTestingModule({
    imports: [
      SettingsComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: SettingsService, useValue: mockSettings },
    ],
  });

  return { fixture: TestBed.createComponent(SettingsComponent), mockSettings };
}

describe('SettingsComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads general settings on init', fakeAsync(() => {
    const { fixture, mockSettings } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockSettings.getGeneral).toHaveBeenCalled();
    expect(fixture.componentInstance.preparationTime).toBe(30);
  }));

  it('activeTab defaults to general', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('general');
  });

  it('switchTab() changes activeTab', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    fixture.componentInstance.switchTab('branding');
    expect(fixture.componentInstance.activeTab()).toBe('branding');
  });

  it('dayName() returns correct day string', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(fixture.componentInstance.dayName(1)).toBe('Monday');
  });
});
