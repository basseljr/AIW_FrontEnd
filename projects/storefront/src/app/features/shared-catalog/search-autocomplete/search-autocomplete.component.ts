import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent } from '@shared/ui';
import { SearchService } from '../../../core/services/search.service';
import { SearchSuggestion } from '../../../core/models/catalog.model';

@Component({
  selector: 'sf-search-autocomplete',
  standalone: true,
  imports: [TranslateModule, DecimalPipe, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-search-ac">
      <div class="sf-search-ac__input-wrap">
        <svg class="sf-search-ac__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <circle cx="8" cy="8" r="5"/>
          <path d="m14 14 4 4" stroke-linecap="round"/>
        </svg>
        <input
          class="sf-search-ac__input"
          type="search"
          [placeholder]="placeholder || ('search.placeholder' | translate)"
          [attr.aria-label]="placeholder || ('search.placeholder' | translate)"
          [attr.aria-autocomplete]="'list'"
          [attr.aria-expanded]="showDropdown()"
          [value]="query()"
          autocomplete="off"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
        />
        @if (loading()) {
          <span class="sf-search-ac__spinner" aria-hidden="true"></span>
        }
      </div>

      @if (showDropdown()) {
        <ul
          class="sf-search-ac__dropdown"
          role="listbox"
          [attr.aria-label]="'search.placeholder' | translate"
        >
          @if (loading()) {
            <li class="sf-search-ac__loading-item" role="option">
              <div class="sf-search-ac__skeleton-row">
                <ui-skeleton variant="circle" width="2.5rem" height="2.5rem" />
                <div style="flex:1; display:flex; flex-direction:column; gap:0.25rem;">
                  <ui-skeleton variant="text" width="60%" />
                  <ui-skeleton variant="text" width="35%" />
                </div>
              </div>
            </li>
          } @else if (suggestions().length === 0) {
            <li class="sf-search-ac__no-results" role="option" aria-selected="false">
              {{ 'search.no_results' | translate: { query: query() } }}
            </li>
          } @else {
            @for (sug of suggestions(); track sug.id; let i = $index) {
              <li
                class="sf-search-ac__item"
                [class.sf-search-ac__item--focused]="focusedIndex() === i"
                role="option"
                [attr.aria-selected]="focusedIndex() === i"
                (click)="selectSuggestion(sug)"
              >
                @if (sug.imageUrl) {
                  <img
                    class="sf-search-ac__thumb"
                    [src]="sug.imageUrl"
                    [alt]="lang() === 'ar' ? sug.nameAr : sug.nameEn"
                    loading="lazy"
                    width="40"
                    height="40"
                  />
                } @else {
                  <div class="sf-search-ac__thumb-placeholder" aria-hidden="true">🍽️</div>
                }
                <div class="sf-search-ac__item-info">
                  <span class="sf-search-ac__item-name">
                    {{ lang() === 'ar' ? sug.nameAr : sug.nameEn }}
                  </span>
                  <span class="sf-search-ac__item-price">
                    {{ sug.price | number: '1.3-3' }} {{ 'common.currency' | translate }}
                  </span>
                </div>
              </li>
            }
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      .sf-search-ac {
        position: relative;
        inline-size: 100%;
      }
      .sf-search-ac__input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }
      .sf-search-ac__icon {
        position: absolute;
        inset-inline-start: 0.875rem;
        inline-size: 1.125rem;
        block-size: 1.125rem;
        color: var(--color-on-surface-variant, #514534);
        pointer-events: none;
      }
      .sf-search-ac__input {
        inline-size: 100%;
        padding-block: 0.625rem;
        padding-inline-start: 2.5rem;
        padding-inline-end: 2.5rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 9999px;
        background: var(--color-surface, #ffffff);
        color: var(--color-on-surface, #1e1b17);
        font-size: 0.9375rem;
        font-family: inherit;
        transition: border-color 0.15s;
      }
      .sf-search-ac__input:focus {
        outline: none;
        border-color: var(--color-primary, #805600);
      }
      .sf-search-ac__spinner {
        position: absolute;
        inset-inline-end: 0.875rem;
        inline-size: 1rem;
        block-size: 1rem;
        border: 2px solid var(--color-outline-variant, #d6c4ad);
        border-block-start-color: var(--color-primary, #805600);
        border-radius: 50%;
        animation: sf-spin 0.7s linear infinite;
      }
      @keyframes sf-spin {
        to { transform: rotate(360deg); }
      }

      .sf-search-ac__dropdown {
        position: absolute;
        inset-block-start: calc(100% + 0.375rem);
        inset-inline-start: 0;
        inset-inline-end: 0;
        background: var(--color-surface, #ffffff);
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        z-index: 100;
        list-style: none;
        margin: 0;
        padding: 0.375rem;
        max-block-size: 20rem;
        overflow-y: auto;
      }

      .sf-search-ac__loading-item,
      .sf-search-ac__no-results {
        padding: 0.75rem 0.875rem;
        font-size: 0.875rem;
        color: var(--color-on-surface-variant, #514534);
      }
      .sf-search-ac__skeleton-row {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .sf-search-ac__item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.875rem;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.12s;
      }
      .sf-search-ac__item:hover,
      .sf-search-ac__item--focused {
        background: var(--color-surface-container, #f4ede5);
      }
      .sf-search-ac__thumb {
        inline-size: 2.5rem;
        block-size: 2.5rem;
        object-fit: cover;
        border-radius: 6px;
        flex-shrink: 0;
      }
      .sf-search-ac__thumb-placeholder {
        inline-size: 2.5rem;
        block-size: 2.5rem;
        background: var(--color-surface-container, #f4ede5);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.125rem;
        flex-shrink: 0;
      }
      .sf-search-ac__item-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-inline-size: 0;
      }
      .sf-search-ac__item-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sf-search-ac__item-price {
        font-size: 0.8125rem;
        color: var(--color-primary-container, #f2a922);
        font-weight: 700;
      }
    `,
  ],
})
export class SearchAutocompleteComponent implements OnInit, OnDestroy {
  @Input() placeholder = '';
  @Output() search = new EventEmitter<string>();

  private readonly searchService = inject(SearchService);
  private readonly langToggle = inject(LanguageToggleService);

  readonly lang = this.langToggle.current;
  readonly query = signal('');
  readonly suggestions = signal<SearchSuggestion[]>([]);
  readonly loading = signal(false);
  readonly showDropdown = signal(false);
  readonly focusedIndex = signal(-1);

  private readonly input$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.input$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.length < 2) {
            this.suggestions.set([]);
            this.loading.set(false);
            return [];
          }
          this.loading.set(true);
          return this.searchService.getSuggestions(q);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (results) => {
          this.suggestions.set((results as SearchSuggestion[]).slice(0, 5));
          this.loading.set(false);
          this.showDropdown.set(true);
          this.focusedIndex.set(-1);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.query.set(q);
    if (q.length < 2) {
      this.showDropdown.set(false);
      this.suggestions.set([]);
    }
    this.input$.next(q);
  }

  onKeydown(event: KeyboardEvent): void {
    const total = this.suggestions().length;
    if (!this.showDropdown() || total === 0) {
      if (event.key === 'Enter') {
        this.search.emit(this.query());
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.update((i) => Math.min(i + 1, total - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (this.focusedIndex() >= 0) {
          const sug = this.suggestions()[this.focusedIndex()];
          if (sug) this.selectSuggestion(sug);
        } else {
          this.search.emit(this.query());
          this.showDropdown.set(false);
        }
        break;
      case 'Escape':
        this.showDropdown.set(false);
        this.focusedIndex.set(-1);
        break;
    }
  }

  selectSuggestion(sug: SearchSuggestion): void {
    this.query.set(this.lang() === 'ar' ? sug.nameAr : sug.nameEn);
    this.showDropdown.set(false);
    this.search.emit(this.query());
  }
}
