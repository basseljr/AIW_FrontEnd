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
    getSeo: jasmine.createSpy('getSeo').and.returnValue(of({ metaTitleEn: null, metaTitleAr: null, metaDescriptionEn: null, metaDescriptionAr: null, keywords: null, googleAnalyticsId: null, facebookPixelId: null, canonicalUrl: null })),
    updateSeo: jasmine.createSpy('updateSeo').and.returnValue(of({})),
    getOrders: jasmine.createSpy('getOrders').and.returnValue(of({ autoConfirmOrders: false, allowDelivery: true, allowPickup: true, allowDineIn: false, orderNumberPrefix: null, schedulingEnabled: false })),
    updateOrders: jasmine.createSpy('updateOrders').and.returnValue(of({})),
    getNotifications: jasmine.createSpy('getNotifications').and.returnValue(of({ newOrder: { email: true, sms: false, push: true }, orderStatusUpdate: { email: true, sms: false, push: true }, newCustomer: { email: true, sms: false, push: false }, lowStock: { email: true, sms: false, push: false }, paymentReceived: { email: true, sms: false, push: false }, orderCancelled: { email: true, sms: false, push: true } })),
    updateNotifications: jasmine.createSpy('updateNotifications').and.returnValue(of({})),
    getTax: jasmine.createSpy('getTax').and.returnValue(of({ isEnabled: false, taxNameEn: null, taxNameAr: null, taxRate: 0, taxInclusive: false, registrationNumber: null })),
    updateTax: jasmine.createSpy('updateTax').and.returnValue(of({})),
    getPaymentMethods: jasmine.createSpy('getPaymentMethods').and.returnValue(of({ methods: [{ key: 'cash', isEnabled: true }, { key: 'knet', isEnabled: false }] })),
    updatePaymentMethods: jasmine.createSpy('updatePaymentMethods').and.returnValue(of({})),
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

  it('loadOrders() populates order settings from service', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.ordersAllowDelivery).toBeTrue();
    expect(fixture.componentInstance.ordersAllowPickup).toBeTrue();
  }));

  it('saveOrders() calls updateOrders on service', fakeAsync(() => {
    const { fixture, mockSettings } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.saveOrders();
    expect(mockSettings.updateOrders).toHaveBeenCalled();
    tick(3001);
  }));

  it('loadNotifications() populates notifications from service', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.notifications.newOrder.email).toBeTrue();
  }));

  it('saveNotifications() calls updateNotifications on service', fakeAsync(() => {
    const { fixture, mockSettings } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.saveNotifications();
    expect(mockSettings.updateNotifications).toHaveBeenCalled();
    tick(3001);
  }));

  it('loadTax() populates tax settings from service', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.taxEnabled).toBeFalse();
    expect(fixture.componentInstance.taxRate).toBe(0);
  }));

  it('saveTax() calls updateTax on service', fakeAsync(() => {
    const { fixture, mockSettings } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.saveTax();
    expect(mockSettings.updateTax).toHaveBeenCalled();
    tick(3001);
  }));

  it('loadSeo() populates seo fields from service', fakeAsync(() => {
    const { fixture, mockSettings } = buildFixture();
    mockSettings.getSeo.and.returnValue(of({ metaTitleEn: 'My Store', metaTitleAr: null, metaDescriptionEn: null, metaDescriptionAr: null, keywords: 'food, order', googleAnalyticsId: null, facebookPixelId: null, canonicalUrl: null }));
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.seoMetaTitleEn).toBe('My Store');
    expect(fixture.componentInstance.seoKeywords).toBe('food, order');
  }));

  it('saveSeo() calls updateSeo on service', fakeAsync(() => {
    const { fixture, mockSettings } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.saveSeo();
    expect(mockSettings.updateSeo).toHaveBeenCalled();
    tick(3001);
  }));

  it('loadPayments() populates payment methods from service', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.paymentMethods.length).toBe(2);
    expect(fixture.componentInstance.paymentMethods[0].key).toBe('cash');
  }));

  it('savePayments() calls updatePaymentMethods on service', fakeAsync(() => {
    const { fixture, mockSettings } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.savePayments();
    expect(mockSettings.updatePaymentMethods).toHaveBeenCalled();
    tick(3001);
  }));
});
