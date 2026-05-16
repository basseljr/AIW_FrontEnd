import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { CheckoutPageComponent } from './checkout-page.component';
import { CartService } from '../../core/services/cart.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { LanguageToggleService } from '@shared/i18n';
import { API_BASE_URL } from '@shared/api';

class FakeTranslateLoader {
  getTranslation() { return of({}); }
}

const mockLangToggle = {
  current: signal<'en' | 'ar'>('en'),
  isRtl: signal(false),
  toggle: () => {},
};

const mockCheckoutService = {
  getBranches: () => of([{ id: 'b1', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' }]),
  getDeliveryZones: () => of([{ id: 'z1', nameEn: 'Kuwait City', nameAr: 'مدينة الكويت', deliveryFee: 1.5, minOrder: 3, estimatedTimeMinutes: 30 }]),
  setCheckoutDetails: () => of({ checkoutStep: 'payment', cart: {} }),
  getPaymentMethods: () => of([]),
  initiatePayment: () => of({ cartId: 'c1', checkoutStep: 'confirmation', paymentInitiated: true, paymentUrl: null, hostedFormToken: null, gatewayPaymentId: 'cod-1', paymentErrorMessage: null, order: { id: 'o1', orderNumber: 'ORD-0001', status: 'new', totalAmount: 7.5, currency: 'KWD', paymentMethod: 'cash', paymentStatus: 'pending' } }),
  getConfirmation: () => of(null),
};

describe('CheckoutPageComponent', () => {
  let component: CheckoutPageComponent;
  let fixture: ComponentFixture<CheckoutPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CheckoutPageComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeTranslateLoader } }),
      ],
      providers: [
        CartService,
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: API_BASE_URL, useValue: 'http://localhost' },
        { provide: LanguageToggleService, useValue: mockLangToggle },
        { provide: CheckoutService, useValue: mockCheckoutService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders without error', () => {
    expect(component).toBeTruthy();
  });

  it('starts on delivery step', () => {
    expect(component.step()).toBe('delivery');
  });

  it('delivery form is invalid when fields are empty', () => {
    expect(component.deliveryFormValid).toBeFalse();
  });

  it('delivery form is valid when required fields are filled including zone', () => {
    component.form.fullName = 'Ahmed';
    component.form.phone = '12345678';
    component.form.email = 'a@b.com';
    component.form.block = '5';
    component.form.street = '12';
    component.form.area = 'Salmiya';
    component.selectedZoneId.set('z1');
    expect(component.deliveryFormValid).toBeTrue();
  });

  it('goToPayment advances to payment step when form is valid (mock resolves sync)', () => {
    component.form.fullName = 'Ahmed';
    component.form.phone = '12345678';
    component.form.email = 'a@b.com';
    component.form.block = '5';
    component.form.street = '12';
    component.form.area = 'Salmiya';
    component.selectedZoneId.set('z1');
    component.goToPayment();
    expect(component.step()).toBe('payment');
  });

  it('goToPayment does not advance when form is invalid', () => {
    component.goToPayment();
    expect(component.step()).toBe('delivery');
  });

  it('itemLineTotal calculates correctly', () => {
    const item = { itemId: 'i', slug: 's', categorySlug: 'c', nameEn: 'N', nameAr: 'ن', price: 5, quantity: 2, selectedModifiers: [] };
    expect(component.itemLineTotal(item)).toBe(10);
  });
});
