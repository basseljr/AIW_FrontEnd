import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { API_BASE_URL } from '@shared/api';
import { SuperAdminApiService } from './super-admin-api.service';

describe('SuperAdminApiService', () => {
  let service: SuperAdminApiService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_BASE_URL, useValue: BASE }],
    });
    service = TestBed.inject(SuperAdminApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('getOverview() hits /admin/overview with scope param', () => {
    service.getOverview('this_month').subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${BASE}/admin/overview` && r.params.get('scope') === 'this_month',
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('listLeads() hits /admin/leads and forwards filters', () => {
    service.listLeads({ status: 'new', businessType: 'restaurant' }).subscribe();
    const req = httpMock.expectOne(
      (r) =>
        r.url === `${BASE}/admin/leads` &&
        r.params.get('status') === 'new' &&
        r.params.get('businessType') === 'restaurant',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('updateLeadStage() POSTs to /admin/leads/:id/status', () => {
    service.updateLeadStage('abc', { status: 'contacted' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/leads/abc/status`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ status: 'contacted' });
    req.flush({});
  });

  it('listTenants() hits /admin/tenants', () => {
    service.listTenants().subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/tenants`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('suspendTenant() POSTs to /admin/tenants/:id/suspend', () => {
    service.suspendTenant('t-1').subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/tenants/t-1/suspend`);
    expect(req.request.method).toBe('POST');
    req.flush({ tenantId: 't-1', status: 'suspended' });
  });

  it('impersonateTenant() POSTs and returns token shape', (done) => {
    service.impersonateTenant('t-1').subscribe((res) => {
      expect(res.token).toBe('jwt');
      done();
    });
    const req = httpMock.expectOne(`${BASE}/admin/tenants/t-1/impersonate`);
    req.flush({ token: 'jwt', expiresAt: '2026-06-01T00:00:00Z', tenantId: 't-1' });
  });

  it('setTenantFlagOverride() PUTs to overrides endpoint', () => {
    service
      .setTenantFlagOverride('t-1', 'feature.kds', { isEnabled: true, reason: 'beta' })
      .subscribe();
    const req = httpMock.expectOne(
      `${BASE}/admin/feature-flags/tenants/t-1/overrides/feature.kds`,
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ isEnabled: true, reason: 'beta' });
    req.flush({ tenantId: 't-1', flagKey: 'feature.kds', value: true });
  });

  it('listSubscriptions() forwards status param', () => {
    service.listSubscriptions('past_due').subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${BASE}/admin/subscriptions` && r.params.get('status') === 'past_due',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createInvoice() POSTs to /admin/invoices', () => {
    const body = {
      tenantId: 't-1',
      type: 'custom' as const,
      lineItems: [],
      taxAmount: 0,
      dueDate: '2026-06-01',
    };
    service.createInvoice(body).subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/invoices`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  it('writeOffInvoice() POSTs with reason', () => {
    service.writeOffInvoice('inv-1', { reason: 'goodwill' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/invoices/inv-1/write-off`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'goodwill' });
    req.flush({});
  });

  it('listFeatureFlags() hits /admin/feature-flags', () => {
    service.listFeatureFlags().subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/feature-flags`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createPlan() POSTs to /admin/subscription-plans', () => {
    service
      .createPlan({
        name: 'Starter',
        isVisible: true,
        isHighlighted: false,
        billingModel: 'flat',
        currency: 'KWD',
        trialDays: 14,
        featureFlags: [],
      })
      .subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/subscription-plans`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('getSystemHealth() hits /admin/system-health', () => {
    service.getSystemHealth().subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/system-health`);
    req.flush({});
  });

  it('listAuditLogs() forwards pagination params', () => {
    service.listAuditLogs({ page: 2, pageSize: 100 }).subscribe();
    const req = httpMock.expectOne(
      (r) =>
        r.url === `${BASE}/admin/audit-logs` &&
        r.params.get('page') === '2' &&
        r.params.get('pageSize') === '100',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], page: 2, pageSize: 100, totalCount: 0 });
  });

  it('exportAuditLogs() requests a blob response', () => {
    service.exportAuditLogs({}).subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/audit-logs/export`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('inviteSuperAdmin() POSTs to /admin/users', () => {
    service
      .inviteSuperAdmin({ name: 'Jane', email: 'jane@a.com', role: 'support_agent' })
      .subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/users`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('retryJob() POSTs to /admin/jobs/:id/retry', () => {
    service.retryJob('j-1').subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/jobs/j-1/retry`);
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('listErrors() forwards severity filter', () => {
    service.listErrors({ severity: 'critical' }).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${BASE}/admin/errors` && r.params.get('severity') === 'critical',
    );
    req.flush({ items: [], totalCount: 0 });
  });

  it('toggleDeliveryProvider() PATCHes with isEnabled', () => {
    service.toggleDeliveryProvider('talabat', true).subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/delivery-providers/talabat`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ isEnabled: true });
    req.flush({});
  });

  it('updateSettings() PUTs to /admin/settings', () => {
    const settings = {
      platformName: 'Aiw',
      supportEmail: 's@aiw.com',
      supportWhatsapp: null,
      defaultCurrency: 'KWD',
      defaultTimezone: 'Asia/Kuwait',
      maintenanceMode: false,
    };
    service.updateSettings(settings).subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/settings`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(settings);
    req.flush(settings);
  });

  it('broadcastAnnouncement() POSTs to /admin/announcements/broadcast', () => {
    service
      .broadcastAnnouncement({
        subjectEn: 'Maintenance',
        subjectAr: 'صيانة',
        bodyEn: '...',
        bodyAr: '...',
        channels: ['email'],
        audience: 'all',
      })
      .subscribe();
    const req = httpMock.expectOne(`${BASE}/admin/announcements/broadcast`);
    expect(req.request.method).toBe('POST');
    req.flush({ recipients: 42 });
  });
});
