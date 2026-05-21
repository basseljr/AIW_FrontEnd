import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  let service: MenuService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(MenuService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getAll() calls GET /tenant-admin/menu/items', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE}/tenant-admin/menu/items`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  });

  it('getAll({ categoryId }) sends categoryId param', () => {
    service.getAll({ categoryId: 'cat-1' }).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/tenant-admin/menu/items` && r.params.get('categoryId') === 'cat-1',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  });

  it('create() calls POST /tenant-admin/menu/items with body', () => {
    const body = {
      categoryId: 'cat-1',
      nameEn: 'Burger',
      nameAr: 'برجر',
      price: 3.5,
      isPublished: true,
      isAvailable: true,
      spiceLevel: 0,
      sortOrder: 1,
      modifierGroupIds: [],
    };
    service.create(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/menu/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'mi1', ...body });
  });

  it('update() calls PUT /tenant-admin/menu/items/{id}', () => {
    const id = 'item-1';
    const body = {
      categoryId: 'cat-1',
      nameEn: 'Burger',
      nameAr: 'برجر',
      price: 3.5,
      isPublished: true,
      isAvailable: true,
      spiceLevel: 0,
      sortOrder: 1,
      modifierGroupIds: [],
    };
    service.update(id, body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/menu/items/${id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id, ...body });
  });

  it('delete() calls DELETE /tenant-admin/menu/items/{id}', () => {
    const id = 'item-1';
    service.delete(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/menu/items/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
