import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getAll() calls GET /tenant-admin/products', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE}/tenant-admin/products`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  });

  it('getAll({ search }) sends search param', () => {
    service.getAll({ search: 'shirt' }).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/tenant-admin/products` && r.params.get('search') === 'shirt',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  });

  it('create() calls POST /tenant-admin/products with body', () => {
    const body = {
      nameEn: 'T-Shirt',
      nameAr: 'تيشيرت',
      price: 5.5,
      isPublished: true,
      sortOrder: 1,
      productType: 'physical',
    };
    service.create(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/products`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'p1', ...body });
  });

  it('update() calls PUT /tenant-admin/products/{id}', () => {
    const id = 'prod-1';
    const body = {
      nameEn: 'T-Shirt',
      nameAr: 'تيشيرت',
      price: 6.0,
      isPublished: true,
      sortOrder: 1,
      productType: 'physical',
    };
    service.update(id, body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/products/${id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id, ...body });
  });

  it('delete() calls DELETE /tenant-admin/products/{id}', () => {
    const id = 'prod-1';
    service.delete(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/products/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
