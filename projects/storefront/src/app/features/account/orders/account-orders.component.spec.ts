import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AccountOrdersComponent } from './account-orders.component';
import { AccountService } from '../../../core/services/account.service';
import { TenantConfigService } from '../../../core/services/tenant-config.service';
import { ApiClient, API_BASE_URL } from '@shared/api';
import { LanguageToggleService } from '@shared/i18n';
import { OrderHistoryResponse } from '../../../core/models/auth.model';

const EMPTY_RESPONSE: OrderHistoryResponse = {
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: 20,
};

const ORDERS_RESPONSE: OrderHistoryResponse = {
  items: [
    {
      id: 'o1',
      orderNumber: 'ORD-001',
      orderType: 'delivery',
      status: 'delivered',
      totalAmount: 12.5,
      currency: 'KWD',
      placedAt: '2025-05-01T10:00:00Z',
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

describe('AccountOrdersComponent', () => {
  function createFixture(response: OrderHistoryResponse) {
    const accountService = {
      getOrders: jasmine.createSpy('getOrders').and.returnValue(of(response)),
    };

    TestBed.configureTestingModule({
      imports: [AccountOrdersComponent, TranslateModule.forRoot(), RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AccountService, useValue: accountService },
        {
          provide: ApiClient,
          useValue: { post: jasmine.createSpy('post').and.returnValue(of({})) },
        },
        { provide: API_BASE_URL, useValue: '/api/v1' },
        {
          provide: LanguageToggleService,
          useValue: { current: signal('en'), isRtl: signal(false) },
        },
        {
          provide: TenantConfigService,
          useValue: { config: signal({ businessType: 'restaurant' }) },
        },
      ],
    });

    const fixture = TestBed.createComponent(AccountOrdersComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders order list with status badges', () => {
    const fixture = createFixture(ORDERS_RESPONSE);
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('.orders__row'));
    expect(rows.length).toBe(1);
    const badge = fixture.debugElement.query(By.css('.orders__status-badge'));
    expect(badge).toBeTruthy();
  });

  it('shows empty state when no orders', () => {
    const fixture = createFixture(EMPTY_RESPONSE);
    fixture.detectChanges();
    const empty = fixture.debugElement.query(By.css('.orders__empty'));
    expect(empty).toBeTruthy();
  });
});
