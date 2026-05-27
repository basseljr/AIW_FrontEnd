import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { AnalyticsService } from '../../core/services/analytics.service';
import { AnalyticsComponent } from './analytics.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const mockRevenueDetail = {
  totalRevenue: 250.500, deliveryRevenue: 150.000, deliveryRevenuePercent: 59.9,
  pickupRevenue: 80.000, pickupRevenuePercent: 31.9, dineInRevenue: 20.500, dineInRevenuePercent: 8.2,
  totalDiscounts: 10.000, netRevenue: 240.500, taxCollected: 5.000, refundsIssued: 0,
  revenueOverTime: [{ date: '2026-05-15T00:00:00Z', total: 50.000, net: 48.000, refunds: 0 }],
  revenueByCategory: [{ categoryName: 'Burgers', revenue: 120.000, percentage: 47.9 }],
};

const mockOrdersDetail = {
  totalOrders: 42, completedOrders: 35, completedPercent: 83.3, cancelledOrders: 5, cancelledPercent: 11.9,
  avgOrderValue: 5.964, busiestDay: 'Friday', busiestHour: 13,
  deliveryOrders: 30, pickupOrders: 8, dineInOrders: 4,
  cancellationReasons: [{ reason: 'Customer request', count: 3 }],
};

const mockCustomersDetail = {
  totalCustomers: 120, newCustomers: 15, returningCustomers: 40, returningPercent: 33.3,
  guestOrders: 10, guestPercent: 23.8, avgOrdersPerCustomer: 2.8, customerLifetimeValue: 25.500,
  topCustomers: [{ name: 'Ahmed Al-Rashid', orders: 8, totalSpent: 80.000, lastOrder: '2026-05-20T10:00:00Z' }],
};

const mockProductsDetail = {
  topSellers: [{ itemName: 'Classic Burger', categoryName: 'Burgers', unitsSold: 80, revenue: 160.000 }],
  slowMovers: [{ itemName: 'Seasonal Special', categoryName: 'Specials', unitsSold: 1, revenue: 5.000 }],
  categoryPerformance: [{ categoryName: 'Burgers', revenue: 160.000, orderCount: 35 }],
};

function buildFixture() {
  const mockService = {
    getRevenueDetail: jasmine.createSpy('getRevenueDetail').and.returnValue(of(mockRevenueDetail)),
    getOrdersDetail: jasmine.createSpy('getOrdersDetail').and.returnValue(of(mockOrdersDetail)),
    getCustomersDetail: jasmine.createSpy('getCustomersDetail').and.returnValue(of(mockCustomersDetail)),
    getProductsDetail: jasmine.createSpy('getProductsDetail').and.returnValue(of(mockProductsDetail)),
    getSummary: jasmine.createSpy('getSummary').and.returnValue(of({})),
    getSales: jasmine.createSpy('getSales').and.returnValue(of([])),
    getTopProducts: jasmine.createSpy('getTopProducts').and.returnValue(of([])),
    getOrdersByStatus: jasmine.createSpy('getOrdersByStatus').and.returnValue(of([])),
    getRevenueByPaymentMethod: jasmine.createSpy('getRevenueByPaymentMethod').and.returnValue(of([])),
  };
  TestBed.configureTestingModule({
    imports: [
      AnalyticsComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [{ provide: AnalyticsService, useValue: mockService }],
  });
  return { fixture: TestBed.createComponent(AnalyticsComponent), mockService };
}

describe('AnalyticsComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges(); tick(100); fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('starts on revenue tab', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.activeTab).toBe('revenue');
  });

  it('loads revenue tab data on init', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges(); tick(100);
    expect(mockService.getRevenueDetail).toHaveBeenCalled();
    expect(fixture.componentInstance.revenueDetail()).toBeTruthy();
  }));

  it('does not load other tabs on init', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges(); tick(100);
    expect(mockService.getOrdersDetail).not.toHaveBeenCalled();
    expect(mockService.getCustomersDetail).not.toHaveBeenCalled();
    expect(mockService.getProductsDetail).not.toHaveBeenCalled();
  }));

  it('loads orders tab data when switching to orders', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges(); tick(100);
    fixture.componentInstance.switchTab('orders');
    tick(100);
    expect(mockService.getOrdersDetail).toHaveBeenCalled();
    expect(fixture.componentInstance.ordersDetail()).toBeTruthy();
  }));

  it('loads customers tab data when switching to customers', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges(); tick(100);
    fixture.componentInstance.switchTab('customers');
    tick(100);
    expect(mockService.getCustomersDetail).toHaveBeenCalled();
    expect(fixture.componentInstance.customersDetail()).toBeTruthy();
  }));

  it('loads products tab data when switching to products', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges(); tick(100);
    fixture.componentInstance.switchTab('products');
    tick(100);
    expect(mockService.getProductsDetail).toHaveBeenCalled();
    expect(fixture.componentInstance.productsDetail()).toBeTruthy();
  }));

  it('revenueDetail has correct values after load', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges(); tick(100);
    expect(fixture.componentInstance.revenueDetail()!.totalRevenue).toBe(250.500);
    expect(fixture.componentInstance.revenueDetail()!.netRevenue).toBe(240.500);
  }));

  it('ordersDetail has correct values after switch', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges(); tick(100);
    fixture.componentInstance.switchTab('orders');
    tick(100);
    expect(fixture.componentInstance.ordersDetail()!.totalOrders).toBe(42);
    expect(fixture.componentInstance.ordersDetail()!.busiestDay).toBe('Friday');
  }));

  it('does not re-fetch already loaded tab', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges(); tick(100);
    fixture.componentInstance.switchTab('orders');
    tick(100);
    const callCount = mockService.getOrdersDetail.calls.count();
    fixture.componentInstance.switchTab('revenue');
    fixture.componentInstance.switchTab('orders');
    tick(100);
    expect(mockService.getOrdersDetail.calls.count()).toBe(callCount);
  }));

  it('invalidates all tabs when date range changes', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges(); tick(100);
    const callsBefore = mockService.getRevenueDetail.calls.count();
    fixture.componentInstance.selectPreset('last30');
    tick(100);
    expect(mockService.getRevenueDetail.calls.count()).toBeGreaterThan(callsBefore);
  }));

  it('revenueLoading is false after successful load', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges(); tick(100);
    expect(fixture.componentInstance.revenueLoading()).toBeFalse();
  }));

  it('revenueError set true when getRevenueDetail fails', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    mockService.getRevenueDetail.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges(); tick(100);
    expect(fixture.componentInstance.revenueError()).toBeTrue();
  }));

  it('ordersError set true when getOrdersDetail fails', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    mockService.getOrdersDetail.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges(); tick(100);
    fixture.componentInstance.switchTab('orders');
    tick(100);
    expect(fixture.componentInstance.ordersError()).toBeTrue();
  }));

  it('formatCurrency returns 3 decimal places with KD', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.formatCurrency(5.5)).toBe('5.500 KD');
  });

  it('formatPercent returns 1 decimal with %', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.formatPercent(59.9)).toBe('59.9%');
  });

  it('formatHour formats 13 as 1:00 PM', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.formatHour(13)).toBe('1:00 PM');
  });

  it('formatHour returns — for -1', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.formatHour(-1)).toBe('—');
  });

  it('formatDate returns — for null', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.formatDate(null)).toBe('—');
  });

  it('tabs array has 4 entries', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.tabs.length).toBe(4);
  });

  it('presets array has 7 entries', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.presets.length).toBe(7);
  });

  it('revenueSeries array has 3 entries', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.revenueSeries.length).toBe(3);
  });

  it('setRevenueSeries changes activeRevenueSeries', () => {
    const { fixture } = buildFixture();
    fixture.componentInstance.setRevenueSeries('net');
    expect(fixture.componentInstance.activeRevenueSeries).toBe('net');
  });

  it('switchTab changes activeTab', () => {
    const { fixture } = buildFixture();
    fixture.componentInstance.switchTab('products');
    expect(fixture.componentInstance.activeTab).toBe('products');
  });

  it('activePreset defaults to last7', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.activePreset).toBe('last7');
  });
});
