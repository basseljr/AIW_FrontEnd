import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { CommissionComponent } from './commission.component';
import { TestTranslateLoader } from '../../testing/test-translate-loader';

describe('CommissionComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommissionComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  function flush() {
    httpMock.expectOne((r) => r.url === '/api/v1/admin/commission/summary').flush({
      totalGmv: 100000, totalCommissionEarned: 5000, collected: 4000, pending: 1000,
    });
    httpMock.expectOne((r) => r.url === '/api/v1/admin/commission/by-tenant').flush([
      { tenantId: 't1', tenantName: 'A', planName: 'Growth', gmvThisMonth: 5000,
        commissionRate: 0.05, commissionAmount: 250, status: 'pending' },
    ]);
  }

  it('loads summary and rows for current period', () => {
    const fixture = TestBed.createComponent(CommissionComponent);
    fixture.detectChanges();
    flush();
    expect(fixture.componentInstance.summary()?.totalGmv).toBe(100000);
    expect(fixture.componentInstance.rows().length).toBe(1);
  });

  it('badgeForStatus maps correctly', () => {
    const fixture = TestBed.createComponent(CommissionComponent);
    fixture.detectChanges();
    flush();
    expect(fixture.componentInstance.badgeForStatus('paid')).toBe('sa-badge--success');
    expect(fixture.componentInstance.badgeForStatus('invoiced')).toBe('sa-badge--info');
    expect(fixture.componentInstance.badgeForStatus('pending')).toBe('sa-badge--warning');
  });

  it('changePeriod re-fetches', () => {
    const fixture = TestBed.createComponent(CommissionComponent);
    fixture.detectChanges();
    flush();
    fixture.componentInstance.changePeriod('2026-04-01');
    httpMock.expectOne((r) =>
      r.url === '/api/v1/admin/commission/summary' && r.params.get('periodMonth') === '2026-04-01',
    ).flush({ totalGmv: 0, totalCommissionEarned: 0, collected: 0, pending: 0 });
    httpMock.expectOne((r) =>
      r.url === '/api/v1/admin/commission/by-tenant' && r.params.get('periodMonth') === '2026-04-01',
    ).flush([]);
  });
});
