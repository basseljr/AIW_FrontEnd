import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { CustomersService } from '../../core/services/customers.service';
import { CustomersComponent } from './customers.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const MOCK_RESULT = {
  items: [
    { customerId: 'c1', name: 'Alice', email: 'alice@test.com', phone: null, blacklisted: false, orderCount: 5, totalSpent: 25 },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 25,
};

function buildFixture() {
  const mockCustomers = {
    getCustomers: jasmine.createSpy('getCustomers').and.returnValue(of(MOCK_RESULT)),
  };

  TestBed.configureTestingModule({
    imports: [
      CustomersComponent,
      RouterTestingModule,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: CustomersService, useValue: mockCustomers },
    ],
  });

  return { fixture: TestBed.createComponent(CustomersComponent), mockCustomers };
}

describe('CustomersComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads customers on init', fakeAsync(() => {
    const { fixture, mockCustomers } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockCustomers.getCustomers).toHaveBeenCalled();
    expect(fixture.componentInstance.items().length).toBe(1);
  }));

  it('totalCount reflects API response', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.totalCount()).toBe(1);
  }));

  it('initials returns correct uppercase initials', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(fixture.componentInstance.initials('Alice Wonder')).toBe('AW');
  });

  it('formatAmount formats correctly', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(fixture.componentInstance.formatAmount(1.5)).toBe('1.500 KD');
  });
});
