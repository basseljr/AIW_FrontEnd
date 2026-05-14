import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { take } from 'rxjs/operators';

import { provideApiBaseUrl } from './api-base-url.token';
import { AuthEvent, AuthEventsService } from './auth-events.service';
import { AuthTokenService } from './auth-token.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let refreshSpy: jasmine.Spy;
  let authEvents: AuthEventsService;

  beforeEach(() => {
    refreshSpy = jasmine.createSpy('refresh');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideApiBaseUrl('http://test/api/v1'),
        {
          provide: AuthTokenService,
          useValue: {
            refresh: refreshSpy,
            logout: () => of(undefined),
          },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    authEvents = TestBed.inject(AuthEventsService);
  });

  afterEach(() => {
    controller.verify();
  });

  it('attaches withCredentials to every outgoing request (cookie JWT support)', () => {
    http.get('/products').subscribe();

    const req = controller.expectOne('/products');
    expect(req.request.withCredentials).withContext('withCredentials should be true').toBe(true);
    req.flush({ data: [] });
  });

  it('on 401, calls refresh and retries the original request exactly once on success', () => {
    refreshSpy.and.returnValue(of(true));
    const successResponse = { data: { id: 1 } };

    let result: unknown;
    http.get('/orders/1').subscribe((response) => {
      result = response;
    });

    const first = controller.expectOne('/orders/1');
    first.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(refreshSpy).toHaveBeenCalledTimes(1);

    const retried = controller.expectOne('/orders/1');
    expect(retried.request.withCredentials).toBe(true);
    retried.flush(successResponse);

    expect(result).toEqual(successResponse);
  });

  it('emits refresh-failed and surfaces the error when the refresh call fails', (done) => {
    const refreshError = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    refreshSpy.and.returnValue(throwError(() => refreshError));

    const captured: AuthEvent[] = [];
    authEvents.stream$.pipe(take(1)).subscribe((event) => captured.push(event));

    http.get('/account/profile').subscribe({
      next: () => done.fail('expected error'),
      error: () => {
        expect(refreshSpy).toHaveBeenCalledTimes(1);
        expect(captured).toEqual([{ type: 'refresh-failed' }]);
        done();
      },
    });

    const first = controller.expectOne('/account/profile');
    first.flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('does not retry on non-401 errors', () => {
    let captured: HttpErrorResponse | undefined;
    http.get('/products').subscribe({
      next: () => fail('expected error'),
      error: (err) => {
        captured = err as HttpErrorResponse;
      },
    });

    const req = controller.expectOne('/products');
    req.flush({ errors: [{ code: 'BAD', message: 'Bad request' }] }, {
      status: 400,
      statusText: 'Bad Request',
    });

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(captured?.status).toBe(400);
  });

  it('does not attempt to refresh when the failing request is /auth/refresh itself', () => {
    http
      .post('http://test/api/v1/auth/refresh', null)
      .subscribe({ next: () => fail('expected error'), error: () => undefined });

    const req = controller.expectOne('http://test/api/v1/auth/refresh');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('does not retry more than once even if the retried request also returns 401', (done) => {
    refreshSpy.and.returnValue(of(true));

    http.get('/orders').subscribe({
      next: () => done.fail('expected error'),
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
        expect(refreshSpy).toHaveBeenCalledTimes(1);
        done();
      },
    });

    controller.expectOne('/orders').flush(null, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne('/orders').flush(null, { status: 401, statusText: 'Unauthorized' });
  });
});
