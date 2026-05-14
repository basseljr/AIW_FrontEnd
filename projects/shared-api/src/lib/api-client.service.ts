import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { API_BASE_URL } from './api-base-url.token';

/**
 * Successful response envelope from the API (PRD §25):
 *   `{ data: T, meta?: { ... }, errors: [] }`
 *
 * The client auto-unwraps `data` so callers receive `T` directly; pagination
 * metadata can still be requested via `getRaw` when needed.
 */
export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
  errors?: unknown[];
}

export type ApiQuery = Record<string, string | number | boolean | null | undefined>;

export interface ApiRequestOptions {
  params?: ApiQuery;
  headers?: Record<string, string>;
  context?: HttpContext;
}

/**
 * Tiny HttpClient wrapper that:
 *   - Prefixes every relative URL with the configured `API_BASE_URL` so feature
 *     services pass paths (`/products`) rather than full URLs.
 *   - Auto-unwraps the `data` field of the response envelope on success.
 *   - Converts the `params` object into HttpParams while skipping null/undefined.
 *
 * Feature services should depend on ApiClient, not HttpClient directly — this
 * enforces the CLAUDE.md rule that "ALL API calls go through the service
 * layer". Components depend on feature services, never on ApiClient or
 * HttpClient.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get<T>(path: string, options: ApiRequestOptions = {}): Observable<T> {
    return this.http
      .get<ApiEnvelope<T>>(this.url(path), this.toHttpOptions(options))
      .pipe(map((response) => response.data));
  }

  getRaw<T>(path: string, options: ApiRequestOptions = {}): Observable<ApiEnvelope<T>> {
    return this.http.get<ApiEnvelope<T>>(this.url(path), this.toHttpOptions(options));
  }

  post<T>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<T> {
    return this.http
      .post<ApiEnvelope<T>>(this.url(path), body, this.toHttpOptions(options))
      .pipe(map((response) => response.data));
  }

  put<T>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<T> {
    return this.http
      .put<ApiEnvelope<T>>(this.url(path), body, this.toHttpOptions(options))
      .pipe(map((response) => response.data));
  }

  patch<T>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<T> {
    return this.http
      .patch<ApiEnvelope<T>>(this.url(path), body, this.toHttpOptions(options))
      .pipe(map((response) => response.data));
  }

  delete<T>(path: string, options: ApiRequestOptions = {}): Observable<T> {
    return this.http
      .delete<ApiEnvelope<T>>(this.url(path), this.toHttpOptions(options))
      .pipe(map((response) => response.data));
  }

  private url(path: string): string {
    if (/^https?:\/\//.test(path)) {
      return path;
    }
    const normalizedBase = this.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  private toHttpOptions(options: ApiRequestOptions): {
    params?: HttpParams;
    headers?: Record<string, string>;
    context?: HttpContext;
    withCredentials: true;
  } {
    return {
      params: this.toHttpParams(options.params),
      headers: options.headers,
      context: options.context,
      withCredentials: true,
    };
  }

  private toHttpParams(query?: ApiQuery): HttpParams | undefined {
    if (!query) {
      return undefined;
    }
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) {
        continue;
      }
      params = params.set(key, String(value));
    }
    return params;
  }
}
