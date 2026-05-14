import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiClient } from '@shared/api';
import { CatalogPage, SearchSuggestion } from '../models/catalog.model';

export interface SearchParams {
  q: string;
  categorySlug?: string;
  cursor?: string;
  inStockOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly api = inject(ApiClient);

  getSuggestions(query: string): Observable<SearchSuggestion[]> {
    return this.api
      .get<SearchSuggestion[]>('/storefront/search/suggestions', {
        params: { q: query },
      })
      .pipe(catchError(() => of([])));
  }

  search(params: SearchParams): Observable<CatalogPage> {
    const query: Record<string, string | boolean | undefined> = { q: params.q };
    if (params.categorySlug != null) query['categorySlug'] = params.categorySlug;
    if (params.cursor != null) query['cursor'] = params.cursor;
    if (params.inStockOnly != null) query['inStockOnly'] = params.inStockOnly;

    return this.api
      .get<CatalogPage>('/storefront/search', { params: query })
      .pipe(catchError(() => of({ items: [], nextCursor: null, total: 0 })));
  }
}
