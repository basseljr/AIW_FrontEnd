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
import { Observable, catchError, finalize, map, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { AuthEventsService } from '@shared/api';
import { DashboardAuthService } from '../services/dashboard-auth.service';

const BYPASS_SEGMENTS = ['/auth/refresh', '/auth/login', '/auth/logout', '/auth/register'];

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
 * Module-level shared observable for the in-flight refresh call.
 *
 * When multiple requests fail with 401 simultaneously (common when the token
 * just expired), they all share THIS single refresh call via shareReplay(1).
 * Without this, each 401 triggers its own POST /auth/refresh — the backend
 * uses single-use refresh token rotation, so the second call gets a
 * IsReuseDetected=true rejection, emitting refresh-failed and logging the
 * user out even though the first refresh succeeded.
 */
let pendingRefresh$: Observable<string> | null = null;

export const dashboardAuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth       = inject(DashboardAuthService);
  const authEvents = inject(AuthEventsService);
  const backend    = inject(HttpBackend);

  if (isBypassed(req.url)) {
    return next(req.clone({ withCredentials: true }));
  }

  return next(addBearer(req, auth.getToken())).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }

      // Build the refresh observable once; all concurrent 401 callers share it.
      if (!pendingRefresh$) {
        pendingRefresh$ = new HttpClient(backend)
          .post<{ accessToken: string }>(
            `${auth.baseUrl}/auth/refresh`,
            null,
            { withCredentials: true },
          )
          .pipe(
            map((res) => {
              if (!res?.accessToken) throw new Error('Refresh response missing accessToken');
              return res.accessToken;
            }),
            tap((token) => auth.updateToken(token)),
            // Replay the single token value to all concurrent 401 subscribers.
            shareReplay(1),
            // Clear the shared ref once the refresh call settles (success or error).
            finalize(() => { pendingRefresh$ = null; }),
          );
      }

      return pendingRefresh$.pipe(
        switchMap((newToken) => next(addBearer(req, newToken))),
        catchError(() => {
          // Refresh failed or retry returned 401 again → force re-login.
          authEvents.emit({ type: 'refresh-failed' });
          return throwError(() => err);
        }),
      );
    }),
  );
};
