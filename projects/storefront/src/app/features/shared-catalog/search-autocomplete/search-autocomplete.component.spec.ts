import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { LanguageToggleService } from '@shared/i18n';
import { SearchService } from '../../../core/services/search.service';
import { SearchAutocompleteComponent } from './search-autocomplete.component';
import { SearchSuggestion } from '../../../core/models/catalog.model';
import type { SupportedLang } from '@shared/i18n';

class MockLoader implements TranslateLoader {
  getTranslation() {
    return of({
      search: { placeholder: 'Search...' },
      common: { currency: 'KD' },
    });
  }
}

const mockSuggestions: SearchSuggestion[] = [
  { id: '1', slug: 'shawarma', categorySlug: 'mains', nameEn: 'Shawarma', nameAr: 'شاورما', price: 2.5 },
];

function buildFixture(searchServiceOverride?: Partial<SearchService>) {
  const mockSearchService = {
    getSuggestions: jasmine.createSpy('getSuggestions').and.returnValue(of(mockSuggestions)),
    search: jasmine.createSpy('search').and.returnValue(of({ items: [], nextCursor: null, total: 0 })),
    ...searchServiceOverride,
  };
  const mockLangToggle = {
    current: signal<SupportedLang>('en').asReadonly(),
    isRtl: signal(false).asReadonly(),
    toggle: jasmine.createSpy('toggle'),
    set: jasmine.createSpy('set'),
  };

  TestBed.configureTestingModule({
    imports: [
      SearchAutocompleteComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: SearchService, useValue: mockSearchService },
      { provide: LanguageToggleService, useValue: mockLangToggle },
    ],
  });

  const fixture = TestBed.createComponent(SearchAutocompleteComponent);
  fixture.detectChanges();
  return { fixture, mockSearchService };
}

describe('SearchAutocompleteComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('fires after 300ms debounce', fakeAsync(() => {
    const { fixture, mockSearchService } = buildFixture();
    const input = fixture.nativeElement.querySelector('.sf-search-ac__input') as HTMLInputElement;

    input.value = 'sha';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Not yet called
    expect(mockSearchService.getSuggestions).not.toHaveBeenCalled();

    // After 300ms debounce
    tick(300);
    expect(mockSearchService.getSuggestions).toHaveBeenCalledWith('sha');
  }));

  it('does NOT fire for less than 2 chars', fakeAsync(() => {
    const { fixture, mockSearchService } = buildFixture();
    const input = fixture.nativeElement.querySelector('.sf-search-ac__input') as HTMLInputElement;

    input.value = 's';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(400);

    expect(mockSearchService.getSuggestions).not.toHaveBeenCalled();
  }));

  it('shows suggestions from service', fakeAsync(() => {
    const { fixture } = buildFixture();
    const input = fixture.nativeElement.querySelector('.sf-search-ac__input') as HTMLInputElement;

    input.value = 'sha';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.sf-search-ac__item');
    expect(items.length).toBe(1);
  }));

  it('keyboard Enter submits the search', fakeAsync(() => {
    const { fixture } = buildFixture();
    const searchSpy = jasmine.createSpy('search');
    fixture.componentInstance.search.subscribe(searchSpy);

    fixture.componentInstance.query.set('shawarma');
    fixture.componentInstance.showDropdown.set(false);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.sf-search-ac__input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(searchSpy).toHaveBeenCalledWith('shawarma');
  }));

  it('Escape closes dropdown', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.componentInstance.suggestions.set(mockSuggestions);
    fixture.componentInstance.showDropdown.set(true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.sf-search-ac__input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.showDropdown()).toBeFalse();
  }));
});
