import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { ModifiersService } from './modifiers.service';

describe('ModifiersService', () => {
  let service: ModifiersService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(ModifiersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getAll() calls GET /tenant-admin/menu/modifier-groups', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/menu/modifier-groups`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create() calls POST /tenant-admin/menu/modifier-groups with body', () => {
    const body = {
      nameEn: 'Size',
      nameAr: 'الحجم',
      selectionType: 'single' as const,
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      sortOrder: 1,
      options: [{ nameEn: 'Small', nameAr: 'صغير', price: 0, sortOrder: 1 }],
    };
    service.create(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/menu/modifier-groups`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'mg1', ...body });
  });

  it('update() calls PUT /tenant-admin/menu/modifier-groups/{id}', () => {
    const id = 'mg-1';
    const body = {
      nameEn: 'Size',
      nameAr: 'الحجم',
      selectionType: 'single' as const,
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
      sortOrder: 1,
      options: [],
    };
    service.update(id, body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/menu/modifier-groups/${id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id, ...body });
  });

  it('delete() calls DELETE /tenant-admin/menu/modifier-groups/{id}', () => {
    const id = 'mg-1';
    service.delete(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/menu/modifier-groups/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
