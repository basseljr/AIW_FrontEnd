import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

import { AuthEventsService } from './auth-events.service';
import { AuthTokenService } from './auth-token.service';

/**
 * Auth interceptor — implements the four behaviors required by M31:
 *
 *   1. Attach the access-token cookie to every request. JWT lives in an
 *      httpOnly cookie (PRD §11/§26), so the browser sends it automatically
 *      when `withCredentials: true`. We force this flag on every outgoing
 *      request — components don't have to remember it.
 *
 *   2. Catch HTTP 401 responses.
 *
 *   3. On 401, call POST /auth/refresh (also withCredentials, so the refresh
 *      cookie goes along). The server rotates the refresh token and writes a
 *      fresh access-token cookie via Set-Cookie.
 *
 *   4. After a successful refresh, retry the original request EXACTLY ONCE.
 *      A second 401 falls through to the error stream and a `refresh-failed`
 *      event is broadcast so application code can redirect to the login page.
 *
 * The /auth/refresh request itself is excluded — if it returns 401, refreshing
 * again would loop forever. /auth/login and /auth/logout are excluded for the
 * same reason (they should never trigger a refresh).
 */
const AUTH_BYPASS_SEGMENTS = ['/auth/refresh', '/auth/login', '/auth/logout', '/auth/register'];

function shouldBypass(url: string): boolean {
  return AUTH_BYPASS_SEGMENTS.some((segment) => url.includes(segment));
}

function withCredentials<T>(req: HttpRequest<T>): HttpRequest<T> {
  return req.clone({ withCredentials: true });
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authEvents = inject(AuthEventsService);
  const authToken = inject(AuthTokenService);

  const credentialedReq = withCredentials(req);

  if (shouldBypass(credentialedReq.url)) {
    return next(credentialedReq);
  }

  return next(credentialedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return authToken.refresh().pipe(
        switchMap(() => next(withCredentials(req))),
        catchError((refreshError: unknown) => {
          authEvents.emit({ type: 'refresh-failed' });
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
