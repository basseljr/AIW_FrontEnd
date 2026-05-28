import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(CustomersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getCustomers() calls GET /tenant-admin/customers', () => {
    service.getCustomers().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE}/tenant-admin/customers`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 25 });
  });

  it('getCustomers({ search }) sends search param', () => {
    service.getCustomers({ search: 'john' }).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/tenant-admin/customers` && r.params.get('search') === 'john',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 25 });
  });

  it('getCustomerDetail() calls GET /tenant-admin/customers/{id}', () => {
    const id = 'abc-123';
    service.getCustomerDetail(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/customers/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getBlacklist() calls GET /tenant-admin/customers/blacklist', () => {
    service.getBlacklist().subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/customers/blacklist`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('addToBlacklist() calls POST /tenant-admin/customers/{id}/blacklist', () => {
    const id = 'abc-123';
    service.addToBlacklist(id, 'Fraud').subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/customers/${id}/blacklist`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'Fraud' });
    req.flush({});
  });

  it('removeFromBlacklist() calls DELETE /tenant-admin/customers/{id}/blacklist', () => {
    const id = 'abc-123';
    service.removeFromBlacklist(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/customers/${id}/blacklist`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('exportCsv() calls GET /tenant-admin/customers/export with responseType blob', () => {
    service.exportCsv().subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/customers/export`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['Name,Email'], { type: 'text/csv' }));
  });
});
