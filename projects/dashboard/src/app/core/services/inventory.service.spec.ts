import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getVariants() calls GET /tenant-admin/products/{id}/variants', () => {
    const pid = 'prod-1';
    service.getVariants(pid).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/products/${pid}/variants`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createVariant() calls POST /tenant-admin/products/{id}/variants with body', () => {
    const pid = 'prod-1';
    const body = { sku: 'SKU-001', price: 5.5, quantity: 10, variantAttributesJson: '{}' };
    service.createVariant(pid, body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/products/${pid}/variants`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'v1', productId: pid, ...body });
  });

  it('updateVariant() calls PUT /tenant-admin/products/{pid}/variants/{vid}', () => {
    const pid = 'prod-1';
    const vid = 'var-1';
    const body = { sku: 'SKU-001', price: 6.0, quantity: 5, variantAttributesJson: '{}' };
    service.updateVariant(pid, vid, body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/products/${pid}/variants/${vid}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: vid, productId: pid, ...body });
  });

  it('getInventory() calls GET /tenant-admin/products/{pid}/variants/{vid}/inventory', () => {
    const pid = 'prod-1';
    const vid = 'var-1';
    service.getInventory(pid, vid).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/tenant-admin/products/${pid}/variants/${vid}/inventory`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ variantId: vid, branchId: 'b1', quantity: 10, lowStockThreshold: null });
  });

  it('updateInventory() calls PUT with body', () => {
    const pid = 'prod-1';
    const vid = 'var-1';
    const body = { branchId: 'b1', quantity: 20, lowStockThreshold: 5 };
    service.updateInventory(pid, vid, body).subscribe();
    const req = httpMock.expectOne(
      `${BASE}/tenant-admin/products/${pid}/variants/${vid}/inventory`,
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({ variantId: vid, ...body });
  });
});
