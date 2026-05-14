import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { makeStateKey, TransferState } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ApiClient } from '@shared/api';
import {
  Category,
  CatalogItem,
  CatalogItemDetail,
  CatalogPage,
} from '../models/catalog.model';

const CATEGORIES_KEY = makeStateKey<Category[]>('sf-catalog-categories');
const FEATURED_KEY = makeStateKey<CatalogItem[]>('sf-catalog-featured');

export interface CatalogParams {
  categorySlug?: string;
  cursor?: string;
  limit?: number;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);

  getCategories(): Observable<Category[]> {
    if (this.transferState.hasKey(CATEGORIES_KEY)) {
      const cached = this.transferState.get(CATEGORIES_KEY, []);
      this.transferState.remove(CATEGORIES_KEY);
      return of(cached);
    }
    return this.api.get<Category[]>('/storefront/categories').pipe(
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
      const cached = this.transferState.get(cacheKey, { items: [], nextCursor: null, total: 0 });
      this.transferState.remove(cacheKey);
      return of(cached);
    }
    const query: Record<string, string | number | boolean | null | undefined> = {};
    if (params.categorySlug != null) query['categorySlug'] = params.categorySlug;
    if (params.cursor != null) query['cursor'] = params.cursor;
    if (params.limit != null) query['limit'] = params.limit;
    if (params.q != null) query['q'] = params.q;
    if (params.minPrice != null) query['minPrice'] = params.minPrice;
    if (params.maxPrice != null) query['maxPrice'] = params.maxPrice;
    if (params.inStockOnly != null) query['inStockOnly'] = params.inStockOnly;

    return this.api.get<CatalogPage>('/storefront/catalog', { params: query }).pipe(
      tap((data) => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(cacheKey, data);
        }
      }),
      catchError(() => of({ items: [], nextCursor: null, total: 0 })),
    );
  }

  getItemDetail(categorySlug: string, itemSlug: string): Observable<CatalogItemDetail> {
    const cacheKey = makeStateKey<CatalogItemDetail>(
      `sf-catalog-item-${categorySlug}-${itemSlug}`,
    );
    if (this.transferState.hasKey(cacheKey)) {
      const cached = this.transferState.get(cacheKey, null as unknown as CatalogItemDetail);
      this.transferState.remove(cacheKey);
      return of(cached);
    }
    return this.api
      .get<CatalogItemDetail>(`/storefront/catalog/${categorySlug}/${itemSlug}`)
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
    return this.api.get<CatalogItem[]>('/storefront/featured').pipe(
      tap((data) => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(FEATURED_KEY, data);
        }
      }),
      catchError(() => of([])),
    );
  }
}
