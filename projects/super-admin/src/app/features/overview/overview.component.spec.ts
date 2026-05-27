import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { OverviewComponent } from './overview.component';
import { LanguageToggleService } from '@shared/i18n';
import { TestTranslateLoader } from '../../testing/test-translate-loader';
import { signal } from '@angular/core';

class MockLangToggle {
  current = signal('en').asReadonly();
}

describe('OverviewComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        OverviewComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: LanguageToggleService, useClass: MockLangToggle },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    httpMock.expectOne((r) => r.url.includes('/admin/overview')).flush({
      kpis: { totalTenants: 0, totalTenantsActive: 0, totalTenantsTrial: 0, totalTenantsSuspended: 0,
              newTenantsThisMonth: 0, newTenantsLastMonth: 0, totalGmv: 0, totalGmvThisMonth: 0,
              mrr: 0, commissionEarnedThisMonth: 0, totalEndCustomers: 0, totalOrdersProcessed: 0,
              activeTenantsLast30Days: 0 },
      trend: [], tenantGrowth: [], businessTypeDistribution: [], topTenants: [],
    });
  });

  it('loads overview on init with scope=this_month', () => {
    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne(
      (r) => r.url === '/api/v1/admin/overview' && r.params.get('scope') === 'this_month',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      kpis: { totalTenants: 5, totalTenantsActive: 3, totalTenantsTrial: 1, totalTenantsSuspended: 1,
              newTenantsThisMonth: 2, newTenantsLastMonth: 1, totalGmv: 10000, totalGmvThisMonth: 3000,
              mrr: 500, commissionEarnedThisMonth: 25, totalEndCustomers: 100, totalOrdersProcessed: 250,
              activeTenantsLast30Days: 4 },
      trend: [], tenantGrowth: [], businessTypeDistribution: [], topTenants: [],
    });
    expect(fixture.componentInstance.data()?.kpis.totalTenants).toBe(5);
  });

  it('reloads when scope changes', () => {
    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();
    httpMock.expectOne((r) => r.params.get('scope') === 'this_month').flush({
      kpis: { totalTenants: 0, totalTenantsActive: 0, totalTenantsTrial: 0, totalTenantsSuspended: 0,
              newTenantsThisMonth: 0, newTenantsLastMonth: 0, totalGmv: 0, totalGmvThisMonth: 0,
              mrr: 0, commissionEarnedThisMonth: 0, totalEndCustomers: 0, totalOrdersProcessed: 0,
              activeTenantsLast30Days: 0 },
      trend: [], tenantGrowth: [], businessTypeDistribution: [], topTenants: [],
    });

    fixture.componentInstance.setScope('all_time');
    httpMock.expectOne((r) => r.params.get('scope') === 'all_time').flush({
      kpis: { totalTenants: 100, totalTenantsActive: 80, totalTenantsTrial: 5, totalTenantsSuspended: 15,
              newTenantsThisMonth: 0, newTenantsLastMonth: 0, totalGmv: 999999, totalGmvThisMonth: 0,
              mrr: 0, commissionEarnedThisMonth: 0, totalEndCustomers: 0, totalOrdersProcessed: 0,
              activeTenantsLast30Days: 0 },
      trend: [], tenantGrowth: [], businessTypeDistribution: [], topTenants: [],
    });
    expect(fixture.componentInstance.data()?.kpis.totalTenants).toBe(100);
  });

  it('formats KWD amounts without decimals', () => {
    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.includes('/admin/overview')).flush({
      kpis: { totalTenants: 0, totalTenantsActive: 0, totalTenantsTrial: 0, totalTenantsSuspended: 0,
              newTenantsThisMonth: 0, newTenantsLastMonth: 0, totalGmv: 0, totalGmvThisMonth: 0,
              mrr: 0, commissionEarnedThisMonth: 0, totalEndCustomers: 0, totalOrdersProcessed: 0,
              activeTenantsLast30Days: 0 },
      trend: [], tenantGrowth: [], businessTypeDistribution: [], topTenants: [],
    });
    expect(fixture.componentInstance.formatKwd(12345.6)).toBe('12,346');
  });

  it('returns null trend when no last-month data', () => {
    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne((r) => r.url.includes('/admin/overview'));
    req.flush({
      kpis: { totalTenants: 0, totalTenantsActive: 0, totalTenantsTrial: 0, totalTenantsSuspended: 0,
              newTenantsThisMonth: 5, newTenantsLastMonth: 0, totalGmv: 0, totalGmvThisMonth: 0,
              mrr: 0, commissionEarnedThisMonth: 0, totalEndCustomers: 0, totalOrdersProcessed: 0,
              activeTenantsLast30Days: 0 },
      trend: [], tenantGrowth: [], businessTypeDistribution: [], topTenants: [],
    });
    expect(fixture.componentInstance.trendVsLastMonth()).toBeNull();
  });

  it('computes positive delta when growing', () => {
    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.includes('/admin/overview')).flush({
      kpis: { totalTenants: 0, totalTenantsActive: 0, totalTenantsTrial: 0, totalTenantsSuspended: 0,
              newTenantsThisMonth: 10, newTenantsLastMonth: 5, totalGmv: 0, totalGmvThisMonth: 0,
              mrr: 0, commissionEarnedThisMonth: 0, totalEndCustomers: 0, totalOrdersProcessed: 0,
              activeTenantsLast30Days: 0 },
      trend: [], tenantGrowth: [], businessTypeDistribution: [], topTenants: [],
    });
    const t = fixture.componentInstance.trendVsLastMonth();
    expect(t?.positive).toBe(true);
    expect(t?.delta).toBe(100);
  });
});
