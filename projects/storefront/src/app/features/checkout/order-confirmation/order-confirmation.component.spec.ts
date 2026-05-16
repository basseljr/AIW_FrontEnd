import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { OrderConfirmationComponent } from './order-confirmation.component';
import { CheckoutService } from '../../../core/services/checkout.service';
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

const mockOrder = {
  orderId: 'order-1',
  orderNumber: '#001',
  status: 'new',
  estimatedMinutes: 30,
  items: [],
  subtotal: 10,
  deliveryFee: 1.5,
  discount: 0,
  total: 11.5,
  orderType: 'delivery',
  paymentMethod: 'cash',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let fixture: ComponentFixture<OrderConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrderConfirmationComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeTranslateLoader } }),
      ],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: API_BASE_URL, useValue: 'http://localhost' },
        { provide: LanguageToggleService, useValue: mockLangToggle },
        {
          provide: CheckoutService,
          useValue: { getConfirmation: () => of(mockOrder) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders without error', () => {
    expect(component).toBeTruthy();
  });

  it('loads order data from service', () => {
    expect(component.order()?.orderId).toBe('order-1');
    expect(component.loading()).toBeFalse();
  });

  it('shows empty state when order is null', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        OrderConfirmationComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeTranslateLoader } }),
      ],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: API_BASE_URL, useValue: 'http://localhost' },
        { provide: LanguageToggleService, useValue: mockLangToggle },
        { provide: CheckoutService, useValue: { getConfirmation: () => of(null) } },
      ],
    }).compileComponents();

    const f = TestBed.createComponent(OrderConfirmationComponent);
    f.detectChanges();
    expect(f.componentInstance.order()).toBeNull();
    expect(f.nativeElement.querySelector('ui-empty-state')).toBeTruthy();
  });
});
