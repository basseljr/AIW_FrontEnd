import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

import { CustomersService } from '../../../core/services/customers.service';
import { CustomerProfileComponent } from './customer-profile.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const MOCK_DETAIL = {
  customerId: 'c1',
  name: 'Alice',
  email: 'alice@test.com',
  phone: null,
  phoneCountryCode: null,
  isActive: true,
  blacklisted: false,
  blacklistReason: null,
  blacklistedAt: null,
  createdAt: '2025-01-01T00:00:00Z',
  orderCount: 3,
  totalSpent: 15,
  loyaltyBalance: 100,
  orderHistory: [],
  addresses: [],
};

function buildFixture() {
  const mockCustomers = {
    getCustomerDetail: jasmine.createSpy('getCustomerDetail').and.returnValue(of(MOCK_DETAIL)),
    addToBlacklist: jasmine.createSpy('addToBlacklist').and.returnValue(of({})),
    removeFromBlacklist: jasmine.createSpy('removeFromBlacklist').and.returnValue(of(void 0)),
  };

  TestBed.configureTestingModule({
    imports: [
      CustomerProfileComponent,
      RouterTestingModule,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: CustomersService, useValue: mockCustomers },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => 'c1' } } },
      },
    ],
  });

  return { fixture: TestBed.createComponent(CustomerProfileComponent), mockCustomers };
}

describe('CustomerProfileComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads customer detail on init', fakeAsync(() => {
    const { fixture, mockCustomers } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockCustomers.getCustomerDetail).toHaveBeenCalledWith('c1');
    expect(fixture.componentInstance.customer()).not.toBeNull();
  }));

  it('initials() returns uppercase initials', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(fixture.componentInstance.initials('Alice Wonder')).toBe('AW');
  });

  it('avgOrder() calculates correctly', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    // 15 / 3 = 5.000
    expect(fixture.componentInstance.avgOrder()).toBe('5.000 KD');
  }));

  it('activeTab defaults to orders', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('orders');
  });
});
