import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { LanguageToggleService, SupportedLang } from '@shared/i18n';
import { TenantConfigService } from '../../../core/services/tenant-config.service';
import { AccountService } from '../../../core/services/account.service';
import { AccountReturnsComponent, ReturnRequest } from './account-returns.component';
import { DEFAULT_DEV_TENANT } from '../../../core/models/tenant-config.model';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      account: {
        returns_title: 'My Returns',
        new_return: 'New Return',
        returns_not_available: 'Not available',
        no_returns: 'No returns',
        no_returns_sub: 'Your returns will appear here',
        return_order: 'Order',
        return_item: 'Item ID',
        return_reason: 'Reason',
        submit_return: 'Submit',
        order_number: 'Order #{{number}}',
        order_total: '{{amount}} KD',
        return_status_pending: 'Pending',
        return_status_approved: 'Approved',
        return_status_rejected: 'Rejected',
        return_status_processing: 'Processing',
      },
      common: { loading: 'Loading...', cancel: 'Cancel' },
      errors: { generic: 'Something went wrong' },
    });
  }
}

const mockReturns: ReturnRequest[] = [
  {
    id: 'r1',
    orderId: 'order-aabbcc',
    orderItemId: 'item-001',
    reason: 'Wrong size',
    status: 'pending',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'r2',
    orderId: 'order-ddeeff',
    orderItemId: 'item-002',
    reason: 'Damaged item',
    status: 'approved',
    refundAmount: 15.0,
    createdAt: '2026-04-20T10:00:00Z',
  },
];

function buildFixture(opts: { isRetail?: boolean; returns?: ReturnRequest[] } = {}) {
  const isRetailTenant = opts.isRetail !== false;
  const mockLang = signal<SupportedLang>('en');
  const config = { ...DEFAULT_DEV_TENANT, businessType: isRetailTenant ? 'retail' : 'restaurant' };
  const mockConfig = signal(config);

  const mockAccount = {
    getOrders: jasmine.createSpy('getOrders').and.returnValue(of({ items: [], totalCount: 0, page: 1, pageSize: 10 })),
  };

  TestBed.configureTestingModule({
    imports: [
      AccountReturnsComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockTranslateLoader } }),
    ],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: 'http://localhost' },
      { provide: TenantConfigService, useValue: { config: mockConfig.asReadonly() } },
      { provide: LanguageToggleService, useValue: { current: mockLang.asReadonly(), isRtl: signal(false).asReadonly() } },
      { provide: AccountService, useValue: mockAccount },
    ],
  });

  const fixture = TestBed.createComponent(AccountReturnsComponent);
  const httpTesting = TestBed.inject(HttpTestingController);

  fixture.detectChanges();

  // Flush the GET returns request for retail tenant
  if (isRetailTenant) {
    const req = httpTesting.expectOne('http://localhost/storefront/returns');
    req.flush(opts.returns ?? mockReturns);
    fixture.detectChanges();
  }

  return { fixture, httpTesting, mockAccount };
}

describe('AccountReturnsComponent', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('shows unavailable message for non-retail tenants', () => {
    const { fixture } = buildFixture({ isRetail: false });
    const el = fixture.nativeElement.querySelector('.returns__unavailable');
    expect(el).toBeTruthy();
  });

  it('renders returns title', () => {
    const { fixture } = buildFixture();
    const title = fixture.nativeElement.querySelector('.returns__title');
    expect(title).toBeTruthy();
  });

  it('renders return items', () => {
    const { fixture } = buildFixture();
    const items = fixture.nativeElement.querySelectorAll('.returns__item');
    expect(items.length).toBe(mockReturns.length);
  });

  it('shows empty state when no returns', () => {
    const { fixture } = buildFixture({ returns: [] });
    const empty = fixture.nativeElement.querySelector('.returns__empty');
    expect(empty).toBeTruthy();
  });

  it('shows "new return" toggle button', () => {
    const { fixture } = buildFixture();
    const btn = fixture.nativeElement.querySelector('.returns__toggle-form');
    expect(btn).toBeTruthy();
  });

  it('shows form when toggle is clicked', () => {
    const { fixture } = buildFixture();
    const btn = fixture.nativeElement.querySelector('.returns__toggle-form');
    btn.click();
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('.returns__form');
    expect(form).toBeTruthy();
  });

  it('hides form after resetForm()', () => {
    const { fixture } = buildFixture();
    fixture.componentInstance.showForm.set(true);
    fixture.componentInstance.resetForm();
    fixture.detectChanges();
    expect(fixture.componentInstance.showForm()).toBeFalse();
  });

  it('shows status chips', () => {
    const { fixture } = buildFixture();
    const chips = fixture.nativeElement.querySelectorAll('.returns__status-chip');
    expect(chips.length).toBe(mockReturns.length);
  });

  it('renders correct status label for pending', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.statusLabel('pending')).toBe('account.return_status_pending');
  });

  it('renders correct status label for approved', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.statusLabel('approved')).toBe('account.return_status_approved');
  });

  it('submits a new return and adds it to the list', () => {
    const { fixture, httpTesting } = buildFixture();
    fixture.componentInstance.showForm.set(true);
    fixture.componentInstance.formOrderId = 'order-001';
    fixture.componentInstance.formOrderItemId = 'item-001';
    fixture.componentInstance.formReason = 'Wrong item received';
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('.returns__form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = httpTesting.expectOne('http://localhost/storefront/returns');
    const newReturn: ReturnRequest = {
      id: 'r3',
      orderId: 'order-001',
      orderItemId: 'item-001',
      reason: 'Wrong item received',
      status: 'pending',
      createdAt: '2026-05-28T10:00:00Z',
    };
    req.flush(newReturn);
    fixture.detectChanges();

    expect(fixture.componentInstance.returns().length).toBe(mockReturns.length + 1);
    expect(fixture.componentInstance.showForm()).toBeFalse();
  });
});
