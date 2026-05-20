import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(OrdersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getOrders() with no filters calls GET /tenant-admin/orders with no extra params', () => {
    service.getOrders().subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/tenant-admin/orders` && !r.params.has('status'),
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], nextCursor: null, hasMore: false });
  });

  it('getOrders({ status: "new" }) sends status=new query param', () => {
    service.getOrders({ status: 'new' }).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/tenant-admin/orders` && r.params.get('status') === 'new',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], nextCursor: null, hasMore: false });
  });

  it('getOrderDetail(id) calls GET /tenant-admin/orders/{id}', () => {
    const id = 'abc-123';
    service.getOrderDetail(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/orders/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush({ orderId: id });
  });

  it('updateOrderStatus(id, req) calls PATCH /tenant-admin/orders/{id}/status with body', () => {
    const id = 'order-99';
    const body = { newStatus: 'confirmed' };
    service.updateOrderStatus(id, body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/orders/${id}/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush({ orderId: id, status: 'confirmed' });
  });
});
