import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getGeneral() calls GET /tenant-admin/settings/general', () => {
    service.getGeneral().subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/settings/general`);
    expect(req.request.method).toBe('GET');
    req.flush({ preparationTime: 30, businessHours: [] });
  });

  it('updateGeneral() calls PUT /tenant-admin/settings/general', () => {
    const body = { preparationTime: 30, businessHours: [] };
    service.updateGeneral(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/settings/general`);
    expect(req.request.method).toBe('PUT');
    req.flush(body);
  });

  it('getDelivery() calls GET /tenant-admin/settings/delivery', () => {
    service.getDelivery().subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/settings/delivery`);
    expect(req.request.method).toBe('GET');
    req.flush({ minOrderAmount: 1, freeDeliveryThreshold: null });
  });

  it('updateDelivery() calls PUT /tenant-admin/settings/delivery', () => {
    const body = { minOrderAmount: 1, freeDeliveryThreshold: null };
    service.updateDelivery(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/settings/delivery`);
    expect(req.request.method).toBe('PUT');
    req.flush(body);
  });

  it('getSocialLinks() calls GET /tenant-admin/settings/social-links', () => {
    service.getSocialLinks().subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/settings/social-links`);
    expect(req.request.method).toBe('GET');
    req.flush({ instagram: null, twitter: null, facebook: null, whatsapp: null, tiktok: null });
  });

  it('updateSocialLinks() calls PUT /tenant-admin/settings/social-links', () => {
    const body = { instagram: 'https://ig.com', twitter: null, facebook: null, whatsapp: null, tiktok: null };
    service.updateSocialLinks(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/settings/social-links`);
    expect(req.request.method).toBe('PUT');
    req.flush(body);
  });

  it('getBranding() calls GET /tenant-admin/settings/branding', () => {
    service.getBranding().subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/settings/branding`);
    expect(req.request.method).toBe('GET');
    req.flush({ logoUrl: null, faviconUrl: null, coverPhotoUrl: null, primaryColor: null, headerFooterColor: null });
  });

  it('updateBranding() calls PUT /tenant-admin/settings/branding', () => {
    const body = { logoUrl: null, faviconUrl: null, coverPhotoUrl: null, primaryColor: '#fff', headerFooterColor: '#000' };
    service.updateBranding(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/tenant-admin/settings/branding`);
    expect(req.request.method).toBe('PUT');
    req.flush(body);
  });
});
