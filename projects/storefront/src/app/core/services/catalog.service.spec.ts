import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { makeStateKey, TransferState } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';

import { provideApiBaseUrl } from '@shared/api';
import { CatalogService } from './catalog.service';
import { Category, CatalogPage, CatalogItemDetail } from '../models/catalog.model';

const API_BASE = 'http://localhost:5000';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;
  let transferState: TransferState;

  function setup(platformId: string = 'browser') {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiBaseUrl(API_BASE),
        CatalogService,
        TransferState,
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
    transferState = TestBed.inject(TransferState);
  }

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
    TestBed.resetTestingModule();
  });

  it('getCategories() calls GET /storefront/catalog/categories', () => {
    setup();
    const mockCats: Category[] = [
      { id: '1', nameEn: 'Mains', nameAr: 'الرئيسية', sortOrder: 0 },
    ];

    service.getCategories().subscribe((cats) => {
      expect(cats).toEqual(mockCats);
    });

    const req = httpMock.expectOne(`${API_BASE}/storefront/catalog/categories`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCats);
  });

  it('getCatalog() builds query params correctly', () => {
    setup();
    service.getCatalog({ categoryId: 'cat-1', limit: 10, inStockOnly: true }).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${API_BASE}/storefront/catalog/items`);
    expect(req.request.params.get('categoryId')).toBe('cat-1');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('inStockOnly')).toBe('true');
    req.flush({ items: [], nextCursor: null, limit: 10 } satisfies CatalogPage);
  });

  it('getItemDetail() calls the right endpoint', () => {
    setup();
    service.getItemDetail('cat-1', 'item-1').subscribe();

    const req = httpMock.expectOne(`${API_BASE}/storefront/catalog/items/cat-1/item-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'item-1', nameEn: 'Shawarma', nameAr: 'شاورما', categoryId: 'cat-1', categoryNameEn: 'Mains', categoryNameAr: 'الرئيسية', price: 2.5 } satisfies CatalogItemDetail);
  });

  it('TransferState: uses cached data on client instead of making API call', () => {
    setup('browser');
    const cached: Category[] = [
      { id: '2', nameEn: 'Drinks', nameAr: 'مشروبات', sortOrder: 1 },
    ];
    const key = makeStateKey<Category[]>('sf-catalog-categories');
    transferState.set(key, cached);

    let result: Category[] = [];
    service.getCategories().subscribe((cats) => (result = cats));

    // Should NOT make HTTP call because data came from TransferState
    httpMock.expectNone(`${API_BASE}/storefront/catalog/categories`);
    expect(result).toEqual(cached);
  });

  it('TransferState: stores data on server', () => {
    setup('server');
    const key = makeStateKey<Category[]>('sf-catalog-categories');
    expect(transferState.hasKey(key)).toBeFalse();

    service.getCategories().subscribe();

    const req = httpMock.expectOne(`${API_BASE}/storefront/catalog/categories`);
    const mockCats: Category[] = [
      { id: '1', nameEn: 'Mains', nameAr: 'الرئيسية', sortOrder: 0 },
    ];
    req.flush(mockCats);

    expect(transferState.hasKey(key)).toBeTrue();
    expect(transferState.get(key, [])).toEqual(mockCats);
  });
});
