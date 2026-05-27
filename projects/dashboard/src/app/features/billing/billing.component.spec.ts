import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';

import { BillingService } from '../../core/services/billing.service';
import { BillingComponent } from './billing.component';

class MockLoader implements TranslateLoader {
  getTranslation() {
    return of({
      billing: {
        status_active: 'Active',
        status_trialing: 'Trial',
        status_past_due: 'Past Due',
        status_cancelled: 'Cancelled',
        status_suspended: 'Suspended',
        status_paused: 'Paused',
        inv_status_paid: 'Paid',
        inv_status_pending: 'Pending',
        inv_status_overdue: 'Overdue',
        inv_status_void: 'Void',
        inv_status_written_off: 'Written Off',
      },
    });
  }
}

const mockPlan = {
  planName: 'Growth',
  billingCycle: 'monthly',
  status: 'active',
  monthlyPrice: 49.000,
  currentPeriodEnd: '2026-06-15T00:00:00Z',
  trialEndsAt: null,
};

const mockInvoices = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-00001',
    periodStart: '2026-05-01T00:00:00Z',
    periodEnd: '2026-05-31T23:59:59Z',
    total: 49.000,
    currency: 'KWD',
    status: 'paid',
    paidAt: '2026-05-05T10:00:00Z',
    dueDate: '2026-05-15T00:00:00Z',
    pdfUrl: 'https://example.com/invoices/inv-1.pdf',
  },
];

function buildFixture() {
  const mockService = {
    getCurrentPlan: jasmine.createSpy('getCurrentPlan').and.returnValue(of(mockPlan)),
    getInvoices: jasmine.createSpy('getInvoices').and.returnValue(of(mockInvoices)),
  };

  TestBed.configureTestingModule({
    imports: [
      BillingComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [{ provide: BillingService, useValue: mockService }],
  });

  return { fixture: TestBed.createComponent(BillingComponent), mockService };
}

describe('BillingComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads plan and invoices on init', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockService.getCurrentPlan).toHaveBeenCalled();
    expect(mockService.getInvoices).toHaveBeenCalled();
  }));

  it('sets plan signal after load', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    const p = fixture.componentInstance.plan();
    expect(p?.planName).toBe('Growth');
    expect(p?.status).toBe('active');
    expect(p?.monthlyPrice).toBe(49.000);
  }));

  it('sets invoices signal after load', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.invoices().length).toBe(1);
    expect(fixture.componentInstance.invoices()[0].invoiceNumber).toBe('INV-2026-00001');
  }));

  it('planLoading starts true and becomes false', fakeAsync(() => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.planLoading()).toBeTrue();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.planLoading()).toBeFalse();
  }));

  it('invoicesLoading starts true and becomes false', fakeAsync(() => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.invoicesLoading()).toBeTrue();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.invoicesLoading()).toBeFalse();
  }));

  it('planError set true when getCurrentPlan fails', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    mockService.getCurrentPlan.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.planError()).toBeTrue();
  }));

  it('invoicesError set true when getInvoices fails', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    mockService.getInvoices.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.invoicesError()).toBeTrue();
  }));

  it('translateStatus maps known statuses via translate.instant', fakeAsync(() => {
    const { fixture } = buildFixture();
    const translate = TestBed.inject(TranslateService);
    translate.use('en');
    tick();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.translateStatus('active')).toBe('Active');
    expect(fixture.componentInstance.translateStatus('trialing')).toBe('Trial');
    expect(fixture.componentInstance.translateStatus('past_due')).toBe('Past Due');
  }));

  it('translateInvoiceStatus maps known statuses via translate.instant', fakeAsync(() => {
    const { fixture } = buildFixture();
    const translate = TestBed.inject(TranslateService);
    translate.use('en');
    tick();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.translateInvoiceStatus('paid')).toBe('Paid');
    expect(fixture.componentInstance.translateInvoiceStatus('pending')).toBe('Pending');
    expect(fixture.componentInstance.translateInvoiceStatus('overdue')).toBe('Overdue');
  }));

  it('formatDate returns readable date', () => {
    const { fixture } = buildFixture();
    const result = fixture.componentInstance.formatDate('2026-05-05T10:00:00Z');
    expect(result).not.toBe('—');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formatDate returns — for null', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.formatDate(null)).toBe('—');
  });

  it('loadPlan() retries the plan call', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges();
    tick();
    const calls = mockService.getCurrentPlan.calls.count();
    fixture.componentInstance.loadPlan();
    tick();
    expect(mockService.getCurrentPlan.calls.count()).toBeGreaterThan(calls);
  }));
});
