import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { SubscriptionsComponent } from './subscriptions.component';
import { TenantSubscription } from '../../core/models/super-admin-api.models';
import { TestTranslateLoader } from '../../testing/test-translate-loader';

const makeSub = (o: Partial<TenantSubscription> = {}): TenantSubscription => ({
  id: 's-1',
  tenantId: 't-1',
  tenantSlug: 'pizza',
  tenantName: 'Pizza Palace',
  planId: 'p-1',
  planName: 'Growth',
  status: 'active',
  billingCycle: 'monthly',
  monthlyAmount: 49,
  currentPeriodStart: '2026-05-01T00:00:00Z',
  currentPeriodEnd: '2026-06-01T00:00:00Z',
  trialEndsAt: null,
  cancelledAt: null,
  cancellationReason: null,
  cancelAtPeriodEnd: false,
  customMonthlyPrice: null,
  customCommissionRate: null,
  ...o,
});

describe('SubscriptionsComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SubscriptionsComponent,
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

  function flushInitial(subs: TenantSubscription[]) {
    httpMock.expectOne('/api/v1/admin/subscriptions/summary').flush({
      activeCount: subs.filter((s) => s.status === 'active').length,
      trialCount: 0, trialAvgDaysRemaining: 0, mrr: 0, arr: 0, pastDueCount: 0, cancelledThisMonth: 0,
    });
    httpMock.expectOne('/api/v1/admin/subscriptions').flush(subs);
  }

  it('creates and loads', () => {
    const fixture = TestBed.createComponent(SubscriptionsComponent);
    fixture.detectChanges();
    flushInitial([makeSub({ id: 's1' }), makeSub({ id: 's2', status: 'past_due' })]);
    expect(fixture.componentInstance.subscriptions().length).toBe(2);
  });

  it('filters by status', () => {
    const fixture = TestBed.createComponent(SubscriptionsComponent);
    fixture.detectChanges();
    flushInitial([
      makeSub({ id: 's1', status: 'active' }),
      makeSub({ id: 's2', status: 'past_due' }),
    ]);
    fixture.componentInstance.statusFilter.set('past_due');
    expect(fixture.componentInstance.filtered().length).toBe(1);
  });

  it('badgeForStatus picks the right semantic class', () => {
    const fixture = TestBed.createComponent(SubscriptionsComponent);
    fixture.detectChanges();
    flushInitial([]);
    expect(fixture.componentInstance.badgeForStatus('active')).toBe('sa-badge--success');
    expect(fixture.componentInstance.badgeForStatus('trialing')).toBe('sa-badge--warning');
    expect(fixture.componentInstance.badgeForStatus('past_due')).toBe('sa-badge--danger');
  });
});
