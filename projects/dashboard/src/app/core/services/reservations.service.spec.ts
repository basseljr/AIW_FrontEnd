import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(ReservationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getReservations() calls GET /reservations', () => {
    service.getReservations().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE}/reservations`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, page: 1, pageSize: 100 });
  });

  it('getReservations() passes query params', () => {
    service.getReservations({ status: 'pending', page: 2, pageSize: 50 }).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE}/reservations`);
    expect(req.request.params.get('status')).toBe('pending');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('50');
    req.flush({ items: [], totalCount: 0, page: 2, pageSize: 50 });
  });

  it('create() calls POST /reservations with body', () => {
    const body = {
      branchId: 'branch-1',
      guestName: 'Test Guest',
      guestPhone: '+1234567890',
      reservationDate: '2026-06-01',
      reservationTime: '19:00:00',
      partySize: 4,
    };
    service.create(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/reservations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'res-1', ...body, status: 'pending' });
  });

  it('patchStatus() calls PUT /reservations/{id}/status', () => {
    const id = 'res-1';
    service.patchStatus(id, { status: 'confirmed' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/reservations/${id}/status`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ status: 'confirmed' });
    req.flush({ id, status: 'confirmed' });
  });

  it('patchStatus() includes cancellationReason when provided', () => {
    const id = 'res-1';
    service.patchStatus(id, { status: 'cancelled', cancellationReason: 'No show' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/reservations/${id}/status`);
    expect(req.request.body).toEqual({ status: 'cancelled', cancellationReason: 'No show' });
    req.flush({ id, status: 'cancelled' });
  });

  it('delete() calls DELETE /reservations/{id}', () => {
    const id = 'res-1';
    service.delete(id).subscribe();
    const req = httpMock.expectOne(`${BASE}/reservations/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('getTables() calls GET /tables', () => {
    service.getTables().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE}/tables`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });

  it('getTables() passes branchId param when provided', () => {
    service.getTables('branch-1').subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE}/tables`);
    expect(req.request.params.get('branchId')).toBe('branch-1');
    req.flush({ items: [] });
  });
});
