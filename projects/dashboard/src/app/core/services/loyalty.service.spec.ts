import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { LoyaltyService } from './loyalty.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(LoyaltyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getSettings() calls GET /tenant-admin/loyalty/settings', () => {
    service.getSettings().subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/loyalty/settings`);
    expect(req.request.method).toBe('GET');
    req.flush({ earnRate: 10, redeemRate: 100, minRedeemPoints: 50 });
  });

  it('updateSettings() calls PUT /tenant-admin/loyalty/settings with body', () => {
    const body = { earnRate: 10, redeemRate: 100, minRedeemPoints: 50 };
    service.updateSettings(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/loyalty/settings`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(body);
  });
});
