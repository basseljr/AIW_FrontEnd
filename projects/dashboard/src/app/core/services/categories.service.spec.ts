import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(CategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getAll() calls GET /tenant-admin/categories', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE}/tenant-admin/categories`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create() calls POST /tenant-admin/categories with body', () => {
    const body = { nameEn: 'Burgers', nameAr: 'برجر', sortOrder: 1, isPublished: true };
    service.create(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/categories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'c1', ...body });
  });

  it('update() calls PUT /tenant-admin/categories/{id}', () => {
    const id = 'cat-1';
    const body = { nameEn: 'Burgers', nameAr: 'برجر', sortOrder: 1, isPublished: true };
    service.update(id, body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/categories/${id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id, ...body });
  });

  it('delete() calls DELETE /tenant-admin/categories/{id}', () => {
    const id = 'cat-1';
    service.delete(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/categories/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('reorder() calls PUT /tenant-admin/categories/reorder with items', () => {
    const items = [{ id: 'c1', sortOrder: 1 }, { id: 'c2', sortOrder: 2 }];
    service.reorder(items).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/categories/reorder`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ items });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
