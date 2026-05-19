import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { DashboardService } from '../../core/services/dashboard.service';
import { OverviewComponent } from './overview.component';

class MockLoader implements TranslateLoader {
  getTranslation() {
    return of({
      overview: {
        title: 'Overview',
        todays_orders: "Today's Orders",
        todays_revenue: "Today's Revenue",
        new_customers: 'New Customers',
        pending_orders: 'Pending Orders',
        loading: 'Loading...',
        error: 'Failed to load',
        retry: 'Retry',
        as_of: 'As of {{time}}',
        currency: 'KWD',
      },
    });
  }
}

const MOCK_OVERVIEW = {
  todaysOrdersCount: 42,
  todaysRevenue: 187.500,
  newCustomersCount: 5,
  pendingOrdersCount: 3,
  generatedAtUtc: '2026-05-17T08:00:00Z',
};

function buildFixture(overviewData = MOCK_OVERVIEW, fail = false) {
  const mockService = {
    getOverview: jasmine.createSpy('getOverview').and.returnValue(
      fail ? throwError(() => new Error('failed')) : of(overviewData),
    ),
  };

  TestBed.configureTestingModule({
    imports: [
      OverviewComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [{ provide: DashboardService, useValue: mockService }],
  });

  return { fixture: TestBed.createComponent(OverviewComponent), mockService };
}

describe('OverviewComponent', () => {
  it('shows loading skeletons initially', fakeAsync(() => {
    let resolveObs!: () => void;
    const mockService = {
      getOverview: jasmine.createSpy('getOverview').and.returnValue(
        new Observable<typeof MOCK_OVERVIEW>((obs) => {
          resolveObs = () => { obs.next(MOCK_OVERVIEW); obs.complete(); };
        }),
      ),
    };

    TestBed.configureTestingModule({
      imports: [
        OverviewComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
      ],
      providers: [{ provide: DashboardService, useValue: mockService }],
    });

    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();

    const skeletons = fixture.nativeElement.querySelectorAll('.db-overview__skeleton');
    expect(skeletons.length).toBe(4);

    resolveObs();
    tick();
  }));

  it('renders 4 stat widgets after loading', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const widgets = fixture.nativeElement.querySelectorAll('db-stat-widget');
    expect(widgets.length).toBe(4);
  }));

  it('shows error state and retry button on failure', fakeAsync(() => {
    const { fixture } = buildFixture(MOCK_OVERVIEW, true);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.db-overview__error')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.db-overview__retry')).toBeTruthy();
  }));

  it('retries on retry button click', fakeAsync(() => {
    const { fixture, mockService } = buildFixture(MOCK_OVERVIEW, true);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    mockService.getOverview.and.returnValue(of(MOCK_OVERVIEW));
    fixture.nativeElement.querySelector('.db-overview__retry')?.click();
    tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.db-overview__error')).toBeNull();
  }));

  it('formats amount to 3 decimal places', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.formatCurrency(7.5)).toContain('7.500');
  });
});
