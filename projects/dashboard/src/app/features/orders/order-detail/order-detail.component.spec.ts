import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { OrderDetailComponent } from './order-detail.component';
import { OrdersService } from '../../../core/services/orders.service';
import { LanguageToggleService } from '@shared/i18n';
import { OrderDetail } from '../../../core/models/order.model';

const makeOrder = (partial: Partial<OrderDetail> = {}): OrderDetail => ({
  orderId: 'ord-1',
  orderNumber: '1001',
  status: 'new',
  orderType: 'delivery',
  branchId: 'b1',
  branchNameEn: 'Main Branch',
  subtotal: 10,
  deliveryFee: 1,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 11,
  currency: 'KWD',
  paymentMethod: 'card',
  paymentStatus: 'paid',
  notes: null,
  addressJson: null,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
  customer: {
    customerId: 'c1',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '12345678',
    isGuestCustomer: false,
  },
  incentives: {
    couponCode: null,
    walletAmountApplied: 0,
    loyaltyPointsRedeemed: 0,
  },
  lineItems: [],
  paymentDetails: [],
  ...partial,
});

describe('OrderDetailComponent', () => {
  let mockOrdersService: jasmine.SpyObj<OrdersService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLangToggle: jasmine.SpyObj<LanguageToggleService>;

  const setupTestBed = (orderId = 'ord-1') =>
    TestBed.configureTestingModule({
      imports: [OrderDetailComponent, TranslateModule.forRoot()],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => orderId } } },
        },
        { provide: LanguageToggleService, useValue: mockLangToggle },
      ],
    }).compileComponents();

  beforeEach(() => {
    mockOrdersService = jasmine.createSpyObj('OrdersService', [
      'getOrderDetail',
      'updateOrderStatus',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockLangToggle = {
      current: signal('en' as const),
      isRtl: signal(false),
    } as unknown as jasmine.SpyObj<LanguageToggleService>;
  });

  it('creates the component', async () => {
    mockOrdersService.getOrderDetail.and.returnValue(of(makeOrder()));
    await setupTestBed();
    const fixture = TestBed.createComponent(OrderDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loading is true initially and false after load completes', fakeAsync(() => {
    mockOrdersService.getOrderDetail.and.returnValue(of(makeOrder()));
    setupTestBed();
    const fixture = TestBed.createComponent(OrderDetailComponent);
    const comp = fixture.componentInstance;

    // Before ngOnInit runs the observable hasn't resolved
    expect(comp.loading()).toBeTrue();
    fixture.detectChanges();
    tick();
    expect(comp.loading()).toBeFalse();
  }));

  it('ngOnInit calls ordersService.getOrderDetail with the route id', fakeAsync(() => {
    const orderId = 'test-order-id';
    mockOrdersService.getOrderDetail.and.returnValue(of(makeOrder({ orderId })));
    setupTestBed(orderId);
    const fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.detectChanges();
    tick();

    expect(mockOrdersService.getOrderDetail).toHaveBeenCalledWith(orderId);
  }));

  it('canShowActions() is true when order status is "new"', fakeAsync(() => {
    mockOrdersService.getOrderDetail.and.returnValue(of(makeOrder({ status: 'new' })));
    setupTestBed();
    const fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.canShowActions()).toBeTrue();
  }));

  it('canShowActions() is false when order status is "cancelled"', fakeAsync(() => {
    mockOrdersService.getOrderDetail.and.returnValue(of(makeOrder({ status: 'cancelled' })));
    setupTestBed();
    const fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.canShowActions()).toBeFalse();
  }));

  it('showCancelModal starts as false and cancelReason starts as empty', async () => {
    mockOrdersService.getOrderDetail.and.returnValue(of(makeOrder()));
    await setupTestBed();
    const fixture = TestBed.createComponent(OrderDetailComponent);
    const comp = fixture.componentInstance;
    expect(comp.showCancelModal()).toBeFalse();
    expect(comp.cancelReason()).toBe('');
  });

  it('updateStatus("confirmed") calls ordersService.updateOrderStatus with correct args', fakeAsync(() => {
    const order = makeOrder({ status: 'new' });
    mockOrdersService.getOrderDetail.and.returnValue(of(order));
    mockOrdersService.updateOrderStatus.and.returnValue(
      of(makeOrder({ status: 'confirmed' })),
    );
    setupTestBed();
    const fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.detectChanges();
    tick();

    fixture.componentInstance.updateStatus('confirmed');
    tick();
    tick(3100); // flush 3s success banner setTimeout

    expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith('ord-1', {
      newStatus: 'confirmed',
    });
  }));

  it('timelineSteps computed returns delivery flow steps for "delivery" order type', fakeAsync(() => {
    const order = makeOrder({ status: 'confirmed', orderType: 'delivery' });
    mockOrdersService.getOrderDetail.and.returnValue(of(order));
    setupTestBed();
    const fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.detectChanges();
    tick();

    const steps = fixture.componentInstance.timelineSteps();
    const statuses = steps.map((s) => s.status);
    expect(statuses).toContain('out_for_delivery');
    const currentStep = steps.find((s) => s.state === 'current');
    expect(currentStep?.status).toBe('confirmed');
  }));
});
