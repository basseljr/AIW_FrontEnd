import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { KdsComponent, KdsCard } from './kds.component';
import { OrdersService } from '../../core/services/orders.service';
import { OrderHubService } from '../../core/services/order-hub.service';
import { OrderListResult } from '../../core/models/order.model';

const emptyResult: OrderListResult = { items: [], nextCursor: null, hasMore: false };

const makeCard = (partial: Partial<KdsCard> = {}): KdsCard => ({
  orderId: 'ord-1',
  orderNumber: '1001',
  orderType: 'delivery',
  status: 'new',
  customerName: 'Alice',
  itemsCount: 2,
  totalAmount: 5.5,
  createdAt: new Date().toISOString(),
  isNew: false,
  ...partial,
});

describe('KdsComponent', () => {
  let mockOrdersService: jasmine.SpyObj<OrdersService>;
  let mockHubService: jasmine.SpyObj<OrderHubService> & {
    connected: ReturnType<typeof signal<boolean>>;
    newOrderEvents: ReturnType<typeof signal<unknown[]>>;
    statusChangedEvents: ReturnType<typeof signal<unknown[]>>;
  };

  beforeEach(async () => {
    mockOrdersService = jasmine.createSpyObj('OrdersService', [
      'getOrders',
      'updateOrderStatus',
    ]);
    mockOrdersService.getOrders.and.returnValue(of(emptyResult));
    mockOrdersService.updateOrderStatus.and.returnValue(of({} as any));

    const connectedSig = signal(false);
    const newOrderEventsSig = signal<unknown[]>([]);
    const statusChangedEventsSig = signal<unknown[]>([]);
    mockHubService = {
      ...jasmine.createSpyObj('OrderHubService', ['connect', 'disconnect']),
      connected: connectedSig,
      newOrderEvents: newOrderEventsSig,
      statusChangedEvents: statusChangedEventsSig,
    } as unknown as typeof mockHubService;

    await TestBed.configureTestingModule({
      imports: [KdsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: OrderHubService, useValue: mockHubService },
      ],
    }).compileComponents();
  });

  it('creates the component', fakeAsync(() => {
    const fixture = TestBed.createComponent(KdsComponent);
    expect(fixture.componentInstance).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('kdsCards signal starts empty', fakeAsync(() => {
    const fixture = TestBed.createComponent(KdsComponent);
    // Before ngOnInit's forkJoin resolves, the signal is still empty
    expect(fixture.componentInstance.kdsCards()).toEqual([]);
    tick();
    discardPeriodicTasks();
  }));

  it('newCards() computed returns only cards with status "new"', fakeAsync(() => {
    const fixture = TestBed.createComponent(KdsComponent);
    const comp = fixture.componentInstance;

    comp.kdsCards.set([
      makeCard({ orderId: 'a', status: 'new' }),
      makeCard({ orderId: 'b', status: 'confirmed' }),
      makeCard({ orderId: 'c', status: 'new' }),
    ]);

    const result = comp.newCards();
    expect(result.length).toBe(2);
    expect(result.every((c) => c.status === 'new')).toBeTrue();
    discardPeriodicTasks();
  }));

  it('prepCards() computed returns cards with status "confirmed" or "preparing"', fakeAsync(() => {
    const fixture = TestBed.createComponent(KdsComponent);
    const comp = fixture.componentInstance;

    comp.kdsCards.set([
      makeCard({ orderId: 'a', status: 'new' }),
      makeCard({ orderId: 'b', status: 'confirmed' }),
      makeCard({ orderId: 'c', status: 'preparing' }),
      makeCard({ orderId: 'd', status: 'ready' }),
    ]);

    const result = comp.prepCards();
    expect(result.length).toBe(2);
    expect(result.some((c) => c.status === 'confirmed')).toBeTrue();
    expect(result.some((c) => c.status === 'preparing')).toBeTrue();
    discardPeriodicTasks();
  }));

  it('readyCards() computed returns only cards with status "ready"', fakeAsync(() => {
    const fixture = TestBed.createComponent(KdsComponent);
    const comp = fixture.componentInstance;

    comp.kdsCards.set([
      makeCard({ orderId: 'a', status: 'new' }),
      makeCard({ orderId: 'b', status: 'ready' }),
    ]);

    expect(comp.readyCards().length).toBe(1);
    expect(comp.readyCards()[0].status).toBe('ready');
    discardPeriodicTasks();
  }));

  it('advanceStatus() calls ordersService.updateOrderStatus with correct nextStatus', fakeAsync(() => {
    const fixture = TestBed.createComponent(KdsComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    const card = makeCard({ orderId: 'ord-x', status: 'new' });
    comp.kdsCards.set([card]);

    comp.advanceStatus(card, 'confirmed');
    tick();

    expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith('ord-x', {
      newStatus: 'confirmed',
    });
    expect(comp.kdsCards()[0].status).toBe('confirmed');
    discardPeriodicTasks();
  }));

  it('ngOnDestroy clears the interval and calls hubService.disconnect', fakeAsync(() => {
    const fixture = TestBed.createComponent(KdsComponent);
    fixture.detectChanges();
    tick();

    spyOn(window, 'clearInterval').and.callThrough();

    fixture.componentInstance.ngOnDestroy();

    expect(mockHubService.disconnect).toHaveBeenCalled();
    expect(window.clearInterval).toHaveBeenCalled();

    discardPeriodicTasks();
  }));
});
