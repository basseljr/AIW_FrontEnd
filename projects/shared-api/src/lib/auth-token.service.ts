import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL } from './api-base-url.token';

/**
 * Wraps the auth-related endpoints used by the auth interceptor.
 *
 * Per PRD §11 and §26: access tokens live in httpOnly cookies, NEVER in
 * localStorage/sessionStorage (XSS protection). That means client JS does not
 * read or write the token itself — the browser attaches it automatically when
 * `withCredentials: true` is set on the request. This service exposes only the
 * silent-refresh call; everything else is handled by the cookie + interceptor.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Calls POST /auth/refresh. The refresh token is in an httpOnly cookie sent
   * automatically by the browser when `withCredentials: true`. On success the
   * server rotates the refresh token and issues a new access token, both as
   * Set-Cookie response headers. Returns true on success, throws on failure.
   */
  refresh(): Observable<boolean> {
    return this.http
      .post<unknown>(`${this.baseUrl}/auth/refresh`, null, { withCredentials: true })
      .pipe(
        map(() => true),
        catchError((err) => throwError(() => err)),
      );
  }

  /**
   * Calls POST /auth/logout. Clears server-side refresh token + cookies.
   * Used by application code (e.g., when user clicks "Sign Out") and by the
   * interceptor as a fallback when refresh fails.
   */
  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/auth/logout`, null, { withCredentials: true })
      .pipe(catchError(() => of(undefined)));
  }
}
