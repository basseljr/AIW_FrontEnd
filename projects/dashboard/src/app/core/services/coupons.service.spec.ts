import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { CouponsService } from './coupons.service';

describe('CouponsService', () => {
  let service: CouponsService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(CouponsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getAll() calls GET /tenant-admin/coupons', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/coupons`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getById() calls GET /tenant-admin/coupons/{id}', () => {
    const id = 'coupon-1';
    service.getById(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/coupons/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() calls POST /tenant-admin/coupons with body', () => {
    const body = {
      code: 'SAVE20',
      discountType: 'percentage' as const,
      discountValue: 20,
      minOrderAmount: 5,
      maxUses: null,
      validFrom: null,
      validUntil: null,
      isActive: true,
    };
    service.create(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/coupons`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'c1', ...body, usedCount: 0, appliesTo: 'all', createdAt: '', updatedAt: '' });
  });

  it('update() calls PUT /tenant-admin/coupons/{id}', () => {
    const id = 'coupon-1';
    const body = {
      code: 'SAVE30',
      discountType: 'fixed' as const,
      discountValue: 3,
      minOrderAmount: 10,
      maxUses: 100,
      validFrom: null,
      validUntil: null,
      isActive: true,
    };
    service.update(id, body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/coupons/${id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id, ...body, usedCount: 0, appliesTo: 'all', createdAt: '', updatedAt: '' });
  });

  it('delete() calls DELETE /tenant-admin/coupons/{id}', () => {
    const id = 'coupon-1';
    service.delete(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/coupons/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('toggle() calls PATCH /tenant-admin/coupons/{id}/toggle', () => {
    const id = 'coupon-1';
    service.toggle(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/coupons/${id}/toggle`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
