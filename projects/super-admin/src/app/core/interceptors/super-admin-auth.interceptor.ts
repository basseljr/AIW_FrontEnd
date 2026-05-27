import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { AuthEventsService } from '@shared/api';
import { SuperAdminAuthService } from '../services/super-admin-auth.service';

const BYPASS_SEGMENTS = [
  '/admin/auth/login',
  '/admin/auth/login/mfa',
  '/admin/auth/refresh',
  '/admin/auth/logout',
];

function isBypassed(url: string): boolean {
  return BYPASS_SEGMENTS.some((s) => url.includes(s));
}

function addBearer<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({
    withCredentials: true,
    ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
  });
}

/**
 * Shared in-flight refresh observable — see dashboard interceptor for the rationale.
 * Without sharing, concurrent 401s race each other and the refresh-token-rotation
 * logic on the backend treats the second call as token reuse.
 */
let pendingRefresh$: Observable<string> | null = null;

export const superAdminAuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth = inject(SuperAdminAuthService);
  const authEvents = inject(AuthEventsService);
  const backend = inject(HttpBackend);

  if (isBypassed(req.url)) {
    return next(req.clone({ withCredentials: true }));
  }

  if (auth.isAuthenticated() && auth.enforceInactivityTimeout()) {
    authEvents.emit({ type: 'session-expired' });
    return throwError(() => new HttpErrorResponse({ status: 401 }));
  }
  auth.recordActivity();

  return next(addBearer(req, auth.getToken())).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }

      if (!pendingRefresh$) {
        pendingRefresh$ = new HttpClient(backend)
          .post<{ accessToken: string }>(
            `${auth.baseUrl}/admin/auth/refresh`,
            null,
            { withCredentials: true },
          )
          .pipe(
            map((res) => {
              if (!res?.accessToken) throw new Error('Refresh response missing accessToken');
              return res.accessToken;
            }),
            tap((token) => auth.updateToken(token)),
            shareReplay(1),
            finalize(() => {
              pendingRefresh$ = null;
            }),
          );
      }

      return pendingRefresh$.pipe(
        switchMap((newToken) => next(addBearer(req, newToken))),
        catchError(() => {
          authEvents.emit({ type: 'refresh-failed' });
          return throwError(() => err);
        }),
      );
    }),
  );
};
