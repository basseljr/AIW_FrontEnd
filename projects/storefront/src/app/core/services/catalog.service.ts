import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { makeStateKey, TransferState } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { API_BASE_URL } from '@shared/api';
import {
  Category,
  CatalogItem,
  CatalogItemDetail,
  CatalogPage,
} from '../models/catalog.model';

// Backend catalog endpoints return raw data (no { data: T } envelope),
// so this service uses HttpClient directly instead of ApiClient.

export interface CatalogParams {
  categoryId?: string;
  categorySlug?: string;
  cursor?: string;
  limit?: number;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

const CATEGORIES_KEY = makeStateKey<Category[]>('sf-catalog-categories');
const FEATURED_KEY = makeStateKey<CatalogItem[]>('sf-catalog-featured');

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);

  private rawGet<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value != null) httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams, withCredentials: true });
  }

  getCategories(): Observable<Category[]> {
    if (this.transferState.hasKey(CATEGORIES_KEY)) {
      const cached = this.transferState.get(CATEGORIES_KEY, []);
      this.transferState.remove(CATEGORIES_KEY);
      return of(cached);
    }
    return this.rawGet<Category[]>('/storefront/catalog/categories').pipe(
      map((data) => data ?? []),
      tap((data) => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(CATEGORIES_KEY, data);
        }
      }),
      catchError(() => of([])),
    );
  }

  getCatalog(params: CatalogParams = {}): Observable<CatalogPage> {
    const cacheKey = makeStateKey<CatalogPage>(
      `sf-catalog-page-${JSON.stringify(params)}`,
    );
    if (this.transferState.hasKey(cacheKey)) {
      const cached = this.transferState.get(cacheKey, { items: [], nextCursor: null });
      this.transferState.remove(cacheKey);
      return of(cached);
    }
    const query: Record<string, string | number | boolean> = {};
    if (params.categoryId != null) query['categoryId'] = params.categoryId;
    if (params.cursor != null) query['cursor'] = params.cursor;
    if (params.limit != null) query['limit'] = params.limit;
    if (params.q != null) query['q'] = params.q;
    if (params.minPrice != null) query['minPrice'] = params.minPrice;
    if (params.maxPrice != null) query['maxPrice'] = params.maxPrice;
    if (params.inStockOnly != null) query['inStockOnly'] = params.inStockOnly;

    return this.rawGet<CatalogPage>('/storefront/catalog/items', query).pipe(
      map((data) => data ?? { items: [], nextCursor: null }),
      map((data) => ({ ...data, items: data.items ?? [] })),
      tap((data) => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(cacheKey, data);
        }
      }),
      catchError(() => of({ items: [], nextCursor: null })),
    );
  }

  getItemDetail(categoryId: string, itemId: string): Observable<CatalogItemDetail> {
    const cacheKey = makeStateKey<CatalogItemDetail>(
      `sf-catalog-item-${categoryId}-${itemId}`,
    );
    if (this.transferState.hasKey(cacheKey)) {
      const cached = this.transferState.get(cacheKey, null as unknown as CatalogItemDetail);
      this.transferState.remove(cacheKey);
      return of(cached);
    }
    return this.rawGet<CatalogItemDetail>(`/storefront/catalog/items/${categoryId}/${itemId}`)
      .pipe(
        tap((data) => {
          if (isPlatformServer(this.platformId)) {
            this.transferState.set(cacheKey, data);
          }
        }),
      );
  }

  getFeaturedItems(): Observable<CatalogItem[]> {
    if (this.transferState.hasKey(FEATURED_KEY)) {
      const cached = this.transferState.get(FEATURED_KEY, []);
      this.transferState.remove(FEATURED_KEY);
      return of(cached);
    }
    return this.rawGet<CatalogItem[]>('/storefront/catalog/featured').pipe(
      map((data) => data ?? []),
      tap((data) => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(FEATURED_KEY, data);
        }
      }),
      catchError(() => of([])),
    );
  }
}
