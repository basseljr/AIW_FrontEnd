import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { OrderTrackingService } from './order-tracking.service';

describe('OrderTrackingService', () => {
  let service: OrderTrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderTrackingService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    service = TestBed.inject(OrderTrackingService);
  });

  it('starts in disconnected state', () => {
    let state = '';
    service.connectionState$.subscribe((s) => (state = s));
    expect(state).toBe('disconnected');
  });

  it('status$ starts null', () => {
    let status: unknown = 'not-null';
    service.status$.subscribe((s) => (status = s));
    expect(status).toBeNull();
  });

  it('connect is a no-op on server platform', async () => {
    await service.connect('order-1', 'token-abc');
    let state = '';
    service.connectionState$.subscribe((s) => (state = s));
    expect(state).toBe('disconnected');
  });

  it('disconnect is safe to call when not connected', async () => {
    await expectAsync(service.disconnect()).toBeResolved();
    let state = '';
    service.connectionState$.subscribe((s) => (state = s));
    expect(state).toBe('disconnected');
  });
});
