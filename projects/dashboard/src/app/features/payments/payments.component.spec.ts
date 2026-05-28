import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { PaymentsService } from '../../core/services/payments.service';
import { PaymentsComponent } from './payments.component';
import { PaymentListResult } from '../../core/models/payments.model';

class MockLoader implements TranslateLoader {
  getTranslation() {
    return of({
      payments_page: {
        title: 'Payment Transactions',
        total_revenue: 'Total Revenue',
        successful_transactions: 'Successful',
        failed_transactions: 'Failed',
        refunds_issued: 'Refunds',
        transaction_id: 'Transaction ID',
        order_number: 'Order #',
        customer: 'Customer',
        amount: 'Amount (KWD)',
        method: 'Payment Method',
        status: 'Status',
        date: 'Date',
        export_csv: 'Export CSV',
        view_details: 'View Details',
        no_transactions: 'No transactions found',
        all_methods: 'All Methods',
        all_statuses: 'All Statuses',
        filter_from: 'From',
        filter_to: 'To',
        search_label: 'Search',
        search_placeholder: 'Search...',
        load_error: 'Failed to load payments.',
        transaction_detail: 'Transaction Detail',
        gateway_payment_id: 'Gateway Payment ID',
        gateway_transaction_id: 'Gateway Transaction ID',
        operation_type: 'Operation',
        method_cash: 'Cash',
        method_knet: 'KNET',
        method_card: 'Card',
        method_apple_pay: 'Apple Pay',
        status_paid: 'Paid',
        status_pending: 'Pending',
        status_failed: 'Failed',
        status_refunded: 'Refunded',
        status_partially_refunded: 'Part. Refunded',
        actions: 'Actions',
      },
      common: { retry: 'Retry', close: 'Close' },
    });
  }
}

const mockResult: PaymentListResult = {
  items: [
    {
      id: 'pay-1',
      transactionId: 'txn-abc-123456',
      orderId: 'order-1',
      orderNumber: 'ORD-0001',
      customerName: 'Ahmad Al-Mansour',
      amount: 12.500,
      currency: 'KWD',
      gateway: 'knet',
      operationType: 'verify',
      status: 'paid',
      gatewayPaymentId: 'knet-pay-001',
      gatewayTransactionId: 'knet-tx-001',
      processedAt: '2026-05-20T10:30:00Z',
    },
    {
      id: 'pay-2',
      transactionId: 'txn-def-789012',
      orderId: null,
      orderNumber: '',
      customerName: 'Sara Al-Hamdan',
      amount: 5.250,
      currency: 'KWD',
      gateway: 'cash',
      operationType: 'capture',
      status: 'failed',
      gatewayPaymentId: null,
      gatewayTransactionId: null,
      processedAt: '2026-05-21T14:00:00Z',
    },
  ],
  totalCount: 2,
  totalRevenue: 12.500,
  successfulCount: 1,
  failedCount: 1,
  refundCount: 0,
};

function buildFixture() {
  const mockService = {
    getPayments: jasmine.createSpy('getPayments').and.returnValue(of(mockResult)),
    getPaymentDetail: jasmine.createSpy('getPaymentDetail').and.returnValue(of(mockResult.items[0])),
  };

  TestBed.configureTestingModule({
    imports: [
      PaymentsComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [{ provide: PaymentsService, useValue: mockService }],
  });

  return { fixture: TestBed.createComponent(PaymentsComponent), mockService };
}

describe('PaymentsComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads transactions on init', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockService.getPayments).toHaveBeenCalled();
  }));

  it('sets transactions signal after load', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.transactions().length).toBe(2);
  }));

  it('sets summary signal after load', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    const s = fixture.componentInstance.summary();
    expect(s).toBeTruthy();
    expect(s!.totalRevenue).toBe(12.500);
    expect(s!.successfulCount).toBe(1);
    expect(s!.failedCount).toBe(1);
    expect(s!.refundCount).toBe(0);
  }));

  it('loading starts true and becomes false on success', fakeAsync(() => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.loading()).toBeTrue();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.loading()).toBeFalse();
  }));

  it('sets error signal true when service fails', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    mockService.getPayments.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.error()).toBeTrue();
  }));

  it('loading becomes false on error', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    mockService.getPayments.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.loading()).toBeFalse();
  }));

  it('onFilterChange updates filters and reloads', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges();
    tick();
    const callsBefore = mockService.getPayments.calls.count();
    fixture.componentInstance.onFilterChange('status', 'paid');
    tick();
    expect(fixture.componentInstance.filters().status).toBe('paid');
    expect(mockService.getPayments.calls.count()).toBeGreaterThan(callsBefore);
  }));

  it('onFilterChange resets page to 1', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.filters.update((f) => ({ ...f, page: 3 }));
    fixture.componentInstance.onFilterChange('method', 'knet');
    tick();
    expect(fixture.componentInstance.filters().page).toBe(1);
  }));

  it('viewDetail sets selectedTransaction', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.viewDetail(mockResult.items[0]);
    expect(fixture.componentInstance.selectedTransaction()).toBeTruthy();
    expect(fixture.componentInstance.selectedTransaction()!.id).toBe('pay-1');
  }));

  it('closeDetail clears selectedTransaction', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.viewDetail(mockResult.items[0]);
    fixture.componentInstance.closeDetail();
    expect(fixture.componentInstance.selectedTransaction()).toBeNull();
  }));

  it('exportCsv creates download when transactions exist', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();

    const createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
    spyOn(URL, 'revokeObjectURL');
    const clickSpy = jasmine.createSpy('click');
    const origCreate = document.createElement.bind(document);
    spyOn(document, 'createElement').and.callFake((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: clickSpy, configurable: true });
      }
      return el;
    });

    fixture.componentInstance.exportCsv();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  }));

  it('formatKwd formats to 3 decimal places', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.formatKwd(12.5)).toBe('12.500 KD');
    expect(fixture.componentInstance.formatKwd(0)).toBe('0.000 KD');
  });

  it('formatKwd returns — for null/NaN', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.formatKwd(NaN)).toBe('—');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(fixture.componentInstance.formatKwd(null as any)).toBe('—');
  });

  it('shortId truncates long IDs', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.shortId('abcdefghijklmnop')).toBe('abcdefgh…');
    expect(fixture.componentInstance.shortId('short')).toBe('short');
    expect(fixture.componentInstance.shortId('')).toBe('—');
  });

  it('totalCount is set from result', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.totalCount()).toBe(2);
  }));

  it('normalizeGateway strips non-alphanumeric', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.normalizeGateway('apple_pay')).toBe('applepay');
    expect(fixture.componentInstance.normalizeGateway('KNET')).toBe('knet');
  });

  it('hasNextPage returns false when all items shown', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    // totalCount=2, pageSize=25, page=1 → 1*25 >= 2 → false
    expect(fixture.componentInstance.hasNextPage()).toBeFalse();
  }));
});
