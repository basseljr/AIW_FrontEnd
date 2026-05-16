import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CheckoutService } from './checkout.service';
import { API_BASE_URL } from '@shared/api';
import { CheckoutPayload, SetCheckoutDetailsPayload } from '../models/checkout.model';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let httpMock: HttpTestingController;

  const baseUrl = 'http://localhost';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CheckoutService,
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });
    service = TestBed.inject(CheckoutService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getPaymentMethods returns list on success', () => {
    let result: unknown;
    service.getPaymentMethods().subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/payment-methods`);
    expect(req.request.method).toBe('GET');
    req.flush([{ key: 'cash', label: 'Cash on Delivery', labelAr: 'الدفع عند الاستلام' }]);

    expect((result as unknown[]).length).toBe(1);
  });

  it('getPaymentMethods returns [] on API error', () => {
    let result: unknown;
    service.getPaymentMethods().subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/payment-methods`);
    req.error(new ProgressEvent('error'));

    expect(result).toEqual([]);
  });

  it('getBranches returns list on success', () => {
    let result: unknown;
    service.getBranches().subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/branches`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'b1', nameEn: 'Main', nameAr: 'الرئيسي' }]);

    expect((result as unknown[]).length).toBe(1);
  });

  it('getBranches returns [] on API error', () => {
    let result: unknown;
    service.getBranches().subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/branches`);
    req.error(new ProgressEvent('error'));

    expect(result).toEqual([]);
  });

  it('getDeliveryZones returns list on success', () => {
    let result: unknown;
    service.getDeliveryZones('b1').subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/delivery-zones?branchId=b1`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'z1', nameEn: 'Kuwait City', nameAr: 'مدينة الكويت', deliveryFee: 1.5, minOrder: 3, estimatedTimeMinutes: 30 }]);

    expect((result as unknown[]).length).toBe(1);
  });

  it('getDeliveryZones returns [] on API error', () => {
    let result: unknown;
    service.getDeliveryZones('b1').subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/delivery-zones?branchId=b1`);
    req.error(new ProgressEvent('error'));

    expect(result).toEqual([]);
  });

  it('setCheckoutDetails POSTs to checkout/details', () => {
    const payload: SetCheckoutDetailsPayload = {
      cartId: null,
      orderType: 'delivery',
      branchId: 'b1',
      deliveryZoneId: 'z1',
      deliveryAddress: { street: '5 Main St', block: '1', area: 'Salmiya', city: 'Kuwait City' },
      customerEmail: 'test@test.com',
    };
    let result: unknown;
    service.setCheckoutDetails(payload).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/checkout/details`);
    expect(req.request.method).toBe('POST');
    req.flush({ checkoutStep: 'payment', cart: {} });

    expect((result as { checkoutStep: string }).checkoutStep).toBe('payment');
  });

  it('setCheckoutDetails returns null on API error', () => {
    let result: unknown = 'not-null';
    service.setCheckoutDetails({ cartId: null, orderType: 'delivery', branchId: 'b1', deliveryZoneId: null, deliveryAddress: null }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/checkout/details`);
    req.error(new ProgressEvent('error'));

    expect(result).toBeNull();
  });

  it('initiatePayment POSTs to checkout/payment', () => {
    const payload: CheckoutPayload = {
      cartId: null,
      branchId: 'b1',
      orderType: 'delivery',
      deliveryZoneId: 'z1',
      customerName: 'Test',
      customerPhone: '12345678',
      providerKey: 'cash',
      successUrl: 'http://localhost/en/order-confirmation/',
      failUrl: 'http://localhost/en/checkout?payment=failed',
      webhookUrl: '',
      language: 'en',
    };

    let result: unknown;
    service.initiatePayment(payload).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/checkout/payment`);
    expect(req.request.method).toBe('POST');
    req.flush({ cartId: 'cart-1', checkoutStep: 'confirmation', paymentInitiated: true, paymentUrl: null, hostedFormToken: null, gatewayPaymentId: 'cod-1', paymentErrorMessage: null, order: { id: 'order-1', orderNumber: 'ORD-0001', status: 'new', totalAmount: 7.5, currency: 'KWD', paymentMethod: 'cash', paymentStatus: 'pending' } });

    expect((result as { order: { id: string } }).order.id).toBe('order-1');
  });

  it('getConfirmation fetches order data', () => {
    let result: unknown;
    service.getConfirmation('order-1').subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/checkout/confirmation/order-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ checkoutStep: 'confirmation', order: { id: 'order-1', orderNumber: 'ORD-0001', status: 'new', items: [], subtotal: 0, deliveryFee: 0, discountAmount: 0, totalAmount: 0, orderType: 'delivery', paymentMethod: 'cash', placedAt: '' } });

    expect((result as { orderId: string }).orderId).toBe('order-1');
  });

  it('getConfirmation returns null on error', () => {
    let result: unknown = 'not-null';
    service.getConfirmation('bad-id').subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${baseUrl}/storefront/checkout/confirmation/bad-id`);
    req.error(new ProgressEvent('error'));

    expect(result).toBeNull();
  });
});
