import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api';
import { OrderHubService } from './order-hub.service';
import { DashboardAuthService } from './dashboard-auth.service';

describe('OrderHubService', () => {
  let service: OrderHubService;

  beforeEach(() => {
    const mockAuth = jasmine.createSpyObj('DashboardAuthService', ['getToken']);
    mockAuth.getToken.and.returnValue('fake-token');

    TestBed.configureTestingModule({
      providers: [
        OrderHubService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test-api/api/v1' },
        { provide: DashboardAuthService, useValue: mockAuth },
      ],
    });
    service = TestBed.inject(OrderHubService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('connected signal is false initially', () => {
    expect(service.connected()).toBeFalse();
  });

  it('newOrderEvents signal is empty array initially', () => {
    expect(service.newOrderEvents()).toEqual([]);
  });

  it('statusChangedEvents signal is empty array initially', () => {
    expect(service.statusChangedEvents()).toEqual([]);
  });

  it('disconnect() does nothing when not connected (no error thrown)', () => {
    expect(() => service.disconnect()).not.toThrow();
    expect(service.connected()).toBeFalse();
  });

  it('ngOnDestroy calls disconnect without throwing', () => {
    spyOn(service, 'disconnect').and.callThrough();
    expect(() => service.ngOnDestroy()).not.toThrow();
    expect(service.disconnect).toHaveBeenCalled();
  });
});
