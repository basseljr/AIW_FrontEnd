import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { API_BASE_URL } from '@shared/api';
import { CatalogPage, SearchSuggestion } from '../models/catalog.model';

// Backend search endpoints return raw data (no { data: T } envelope),
// so this service uses HttpClient directly instead of ApiClient.

export interface SearchParams {
  q: string;
  categoryId?: string;
  categorySlug?: string;
  cursor?: string;
  inStockOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getSuggestions(query: string): Observable<SearchSuggestion[]> {
    return this.http
      .get<SearchSuggestion[]>(
        `${this.baseUrl}/storefront/catalog/search/suggestions`,
        { params: { q: query }, withCredentials: true },
      )
      .pipe(
        map((data) => data ?? []),
        catchError(() => of([])),
      );
  }

  search(params: SearchParams): Observable<CatalogPage> {
    let httpParams = new HttpParams().set('q', params.q);
    if (params.categoryId != null) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.cursor != null) httpParams = httpParams.set('cursor', params.cursor);
    if (params.inStockOnly != null) httpParams = httpParams.set('inStockOnly', String(params.inStockOnly));

    return this.http
      .get<CatalogPage>(
        `${this.baseUrl}/storefront/catalog/search`,
        { params: httpParams, withCredentials: true },
      )
      .pipe(
        map((data) => data ?? { items: [], nextCursor: null }),
        map((data) => ({ ...data, items: data.items ?? [] })),
        catchError(() => of({ items: [], nextCursor: null })),
      );
  }
}
