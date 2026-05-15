import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { provideApiBaseUrl } from '@shared/api';
import { SearchService } from './search.service';
import { SearchSuggestion } from '../models/catalog.model';

const API_BASE = 'http://localhost:5000';

describe('SearchService', () => {
  let service: SearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiBaseUrl(API_BASE),
        SearchService,
      ],
    });
    service = TestBed.inject(SearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getSuggestions() calls the right endpoint', () => {
    const mockSuggestions: SearchSuggestion[] = [
      { id: '1', nameEn: 'Shawarma', nameAr: 'شاورما', price: 2.5 },
    ];

    service.getSuggestions('sha').subscribe((results) => {
      expect(results).toEqual(mockSuggestions);
    });

    const req = httpMock.expectOne(
      (r) => r.url === `${API_BASE}/storefront/catalog/search/suggestions` && r.params.get('q') === 'sha',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockSuggestions);
  });

  it('search() passes query params', () => {
    service.search({ q: 'shawarma', categoryId: 'cat-1', inStockOnly: true }).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${API_BASE}/storefront/catalog/search`);
    expect(req.request.params.get('q')).toBe('shawarma');
    expect(req.request.params.get('categoryId')).toBe('cat-1');
    expect(req.request.params.get('inStockOnly')).toBe('true');
    req.flush({ items: [], nextCursor: null, limit: 20 });
  });

  it('returns empty array on API error (with catchError)', () => {
    let result: SearchSuggestion[] = [{ id: 'sentinel', nameEn: '', nameAr: '', price: 0 }];

    service.getSuggestions('error-test').subscribe((r) => (result = r));

    const req = httpMock.expectOne(
      (r) => r.url === `${API_BASE}/storefront/catalog/search/suggestions`,
    );
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(result).toEqual([]);
  });
});
