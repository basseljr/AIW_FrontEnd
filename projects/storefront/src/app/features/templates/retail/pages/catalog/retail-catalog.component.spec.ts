import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PLATFORM_ID, signal } from '@angular/core';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { API_BASE_URL } from '@shared/api';
import { LanguageToggleService, SupportedLang } from '@shared/i18n';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { RetailCatalogComponent } from './retail-catalog.component';
import { CatalogItem } from '../../../../../core/models/catalog.model';

class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      nav: { products: 'Products' },
      catalog: {
        products: 'products',
        view_grid: 'Grid',
        view_list: 'List',
        load_more: 'Load More',
        no_items: 'No items',
        no_items_subtitle: 'Check back soon',
        filters: 'Filters',
        filter_count: '{{count}} active',
        close_filters: 'Close Filters',
        search_label: 'Search products',
        search_placeholder: 'Search...',
      },
      common: { loading: 'Loading...' },
      search: { filter_by_category: 'Filter by category', in_stock_only: 'In stock only' },
    });
  }
}

const mockItems: CatalogItem[] = [
  {
    id: '1',
    slug: 'shirt',
    categoryId: 'cat1',
    categorySlug: 'clothing',
    nameEn: 'Blue Shirt',
    nameAr: 'قميص أزرق',
    price: 12.5,
    isAvailable: true,
    isPublished: true,
  },
  {
    id: '2',
    slug: 'pants',
    categoryId: 'cat1',
    categorySlug: 'clothing',
    nameEn: 'Black Pants',
    nameAr: 'بنطلون أسود',
    price: 22.0,
    isAvailable: true,
    isPublished: true,
  },
];

function buildFixture(
  options: {
    items?: CatalogItem[];
    queryParams?: Record<string, string>;
    routeParams?: Record<string, string>;
  } = {},
) {
  const items = options.items ?? mockItems;
  const mockLang = signal<SupportedLang>('en');
  const mockCatalog = {
    getCatalog: jasmine.createSpy('getCatalog').and.returnValue(
      of({ items, total: items.length, nextCursor: null }),
    ),
    getCategories: jasmine.createSpy('getCategories').and.returnValue(of([])),
  };

  TestBed.configureTestingModule({
    imports: [
      RetailCatalogComponent,
      HttpClientTestingModule,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockTranslateLoader } }),
    ],
    providers: [
      provideRouter([]),
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: API_BASE_URL, useValue: 'http://localhost' },
      { provide: LanguageToggleService, useValue: { current: mockLang.asReadonly(), isRtl: signal(false).asReadonly() } },
      { provide: CatalogService, useValue: mockCatalog },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: { get: (k: string) => options.routeParams?.[k] ?? null },
            queryParamMap: { get: (k: string) => options.queryParams?.[k] ?? null },
          },
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(RetailCatalogComponent);
  fixture.detectChanges();
  return { fixture, mockCatalog };
}

describe('RetailCatalogComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders the page title', () => {
    const { fixture } = buildFixture();
    const title = fixture.nativeElement.querySelector('.sf-catalog__title');
    expect(title).toBeTruthy();
  });

  it('renders search input', () => {
    const { fixture } = buildFixture();
    const input = fixture.nativeElement.querySelector('.sf-catalog__search-input');
    expect(input).toBeTruthy();
  });

  it('calls getCatalog on init', () => {
    const { mockCatalog } = buildFixture();
    expect(mockCatalog.getCatalog).toHaveBeenCalled();
  });

  it('displays items after load', () => {
    const { fixture } = buildFixture();
    const cards = fixture.nativeElement.querySelectorAll('sf-retail-product-card');
    expect(cards.length).toBe(mockItems.length);
  });

  it('shows skeleton while loading', () => {
    const { fixture } = buildFixture({ items: [] });
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const skeletons = fixture.nativeElement.querySelectorAll('.sf-catalog__skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows filter toggle button in mobile context', () => {
    const { fixture } = buildFixture();
    const btn = fixture.nativeElement.querySelector('.sf-catalog__filter-toggle');
    expect(btn).toBeTruthy();
  });

  it('opens filter drawer when filter toggle is clicked', () => {
    const { fixture } = buildFixture();
    const btn = fixture.nativeElement.querySelector('.sf-catalog__filter-toggle');
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.filterDrawerOpen()).toBeTrue();
    const drawer = fixture.nativeElement.querySelector('.sf-catalog__drawer--open');
    expect(drawer).toBeTruthy();
  });

  it('closes filter drawer when backdrop is clicked', () => {
    const { fixture } = buildFixture();
    fixture.componentInstance.filterDrawerOpen.set(true);
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('.sf-catalog__backdrop');
    backdrop.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.filterDrawerOpen()).toBeFalse();
  });

  it('closes filter drawer via close button', () => {
    const { fixture } = buildFixture();
    fixture.componentInstance.filterDrawerOpen.set(true);
    fixture.detectChanges();
    const closeBtn = fixture.nativeElement.querySelector('.sf-catalog__drawer-close');
    closeBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.filterDrawerOpen()).toBeFalse();
  });

  it('debounces search input', fakeAsync(() => {
    const { fixture, mockCatalog } = buildFixture();
    const callsBefore = mockCatalog.getCatalog.calls.count();
    const input = fixture.nativeElement.querySelector('.sf-catalog__search-input');
    input.value = 'shirt';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(100); // not yet debounced
    expect(mockCatalog.getCatalog.calls.count()).toBe(callsBefore);
    tick(300); // debounce fires
    expect(mockCatalog.getCatalog.calls.count()).toBeGreaterThan(callsBefore);
  }));

  it('populates search from q query param', () => {
    const { fixture } = buildFixture({ queryParams: { q: 'shirt' } });
    expect(fixture.componentInstance.searchValue()).toBe('shirt');
  });

  it('shows grid view by default', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.viewMode()).toBe('grid');
    const grid = fixture.nativeElement.querySelector('.sf-catalog__grid--grid');
    expect(grid).toBeTruthy();
  });

  it('switches to list view', () => {
    const { fixture } = buildFixture();
    fixture.componentInstance.setView('list');
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.sf-catalog__grid--list');
    expect(grid).toBeTruthy();
  });

  it('shows empty state when no items', () => {
    const { fixture } = buildFixture({ items: [] });
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('ui-empty-state');
    expect(empty).toBeTruthy();
  });

  it('activeFilterCount is 0 with no filters', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.activeFilterCount()).toBe(0);
  });

  it('shows filter badge when filters are active', () => {
    const { fixture } = buildFixture({ queryParams: { q: 'shirt' } });
    expect(fixture.componentInstance.activeFilterCount()).toBeGreaterThan(0);
  });
});
