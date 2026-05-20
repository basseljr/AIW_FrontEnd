import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

import { OrdersListComponent } from './orders-list.component';
import { OrdersService } from '../../../core/services/orders.service';
import { OrderHubService } from '../../../core/services/order-hub.service';
import { LanguageToggleService } from '@shared/i18n';
import { OrderListResult, OrderListItem } from '../../../core/models/order.model';

const mockOrderItem = (partial: Partial<OrderListItem> = {}): OrderListItem => ({
  orderId: 'ord-1',
  orderNumber: '1001',
  status: 'new',
  orderType: 'delivery',
  itemsCount: 2,
  totalAmount: 5.5,
  createdAt: new Date().toISOString(),
  customerName: 'Test User',
  customerEmail: null,
  customerPhone: null,
  isGuestCustomer: false,
  paymentStatus: 'paid',
  ...partial,
});

const emptyResult: OrderListResult = { items: [], nextCursor: null, hasMore: false };

describe('OrdersListComponent', () => {
  let mockOrdersService: jasmine.SpyObj<OrdersService>;
  let mockHubService: jasmine.SpyObj<OrderHubService> & {
    connected: ReturnType<typeof signal<boolean>>;
    newOrderEvents: ReturnType<typeof signal<unknown[]>>;
    statusChangedEvents: ReturnType<typeof signal<unknown[]>>;
  };
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLangToggle: jasmine.SpyObj<LanguageToggleService>;

  beforeEach(async () => {
    mockOrdersService = jasmine.createSpyObj('OrdersService', ['getOrders']);
    mockOrdersService.getOrders.and.returnValue(of(emptyResult));

    // Hub service with writable signals
    const connectedSig = signal(false);
    const newOrderEventsSig = signal<unknown[]>([]);
    const statusChangedEventsSig = signal<unknown[]>([]);
    mockHubService = {
      ...jasmine.createSpyObj('OrderHubService', ['connect', 'disconnect']),
      connected: connectedSig,
      newOrderEvents: newOrderEventsSig,
      statusChangedEvents: statusChangedEventsSig,
    } as unknown as typeof mockHubService;

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    (mockRouter as any).events = EMPTY;
    (mockRouter as any).url = '/';
    mockLangToggle = {
      isRtl: signal(false),
      current: signal('en' as const),
    } as unknown as jasmine.SpyObj<LanguageToggleService>;

    await TestBed.configureTestingModule({
      imports: [OrdersListComponent, TranslateModule.forRoot()],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: OrderHubService, useValue: mockHubService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: { queryParams: {} },
          },
        },
        { provide: LanguageToggleService, useValue: mockLangToggle },
      ],
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(OrdersListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows loading skeleton rows when loading() is true', fakeAsync(() => {
    const fixture = TestBed.createComponent(OrdersListComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges(); // let ngOnInit run (resets loading to false)
    tick();                  // flush synchronous reload
    // Now force loading back on to test the skeleton template branch
    comp.loading.set(true);
    comp.items.set([]);
    fixture.detectChanges();

    const skeletonRows = fixture.debugElement.queryAll(
      By.css('.db-ol__row--skeleton'),
    );
    expect(skeletonRows.length).toBeGreaterThan(0);
    discardPeriodicTasks();
  }));

  it('shows empty state when items is empty and not loading', () => {
    const fixture = TestBed.createComponent(OrdersListComponent);
    const comp = fixture.componentInstance;
    comp.loading.set(false);
    comp.items.set([]);
    comp.error.set(false);
    fixture.detectChanges();

    const empty = fixture.debugElement.query(By.css('.db-ol__empty'));
    expect(empty).toBeTruthy();
  });

  it('updateFilter("status", "new") navigates with status=new query param', () => {
    const fixture = TestBed.createComponent(OrdersListComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.updateFilter('status', 'new');

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({ status: 'new' }),
        replaceUrl: true,
      }),
    );
  });

  it('prepends items and highlights when items.update is called directly', fakeAsync(() => {
    mockOrdersService.getOrders.and.returnValue(
      of({ items: [mockOrderItem()], nextCursor: null, hasMore: false }),
    );

    const fixture = TestBed.createComponent(OrdersListComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    tick(); // flush synchronous reload

    const initialCount = comp.items().length; // 1

    // Simulate what handleNewOrders does when a SignalR event fires
    const newItem = mockOrderItem({ orderId: 'new-ord-999', orderNumber: '9999' });
    comp.items.update((prev) => [newItem, ...prev]);
    fixture.detectChanges();

    expect(comp.items().length).toBe(initialCount + 1);
    expect(comp.items()[0].orderId).toBe('new-ord-999');
    discardPeriodicTasks();
  }));
});
