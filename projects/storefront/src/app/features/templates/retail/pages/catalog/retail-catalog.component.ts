import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent, EmptyStateComponent } from '@shared/ui';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { Category, CatalogItem, CatalogFilters } from '../../../../../core/models/catalog.model';
import { RetailProductCardComponent } from '../../components/product-card/retail-product-card.component';
import { RetailFilterSidebarComponent } from '../../components/filter-sidebar/retail-filter-sidebar.component';

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'sf-retail-catalog',
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    SkeletonComponent,
    EmptyStateComponent,
    RetailProductCardComponent,
    RetailFilterSidebarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-catalog">
      <!-- Page header -->
      <div class="sf-catalog__header">
        <div class="sf-catalog__header-inner">
          <h1 class="sf-catalog__title">{{ 'nav.products' | translate }}</h1>

          <!-- Search bar -->
          <div class="sf-catalog__search-row">
            <label class="sf-catalog__search-label" for="sf-catalog-search">
              {{ 'catalog.search_label' | translate }}
            </label>
            <div class="sf-catalog__search-wrap">
              <svg class="sf-catalog__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="sf-catalog-search"
                class="sf-catalog__search-input"
                type="search"
                [placeholder]="'catalog.search_placeholder' | translate"
                [value]="searchValue()"
                (input)="onSearchInput($event)"
                [attr.aria-label]="'catalog.search_label' | translate"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="sf-catalog__layout">
        <!-- Filter sidebar (desktop always visible) -->
        <aside class="sf-catalog__sidebar">
          <sf-retail-filter-sidebar
            [categories]="categories()"
            [lang]="lang()"
            (filtersChanged)="onFiltersChanged($event)"
          />
        </aside>

        <!-- Product grid -->
        <div class="sf-catalog__main">
          <div class="sf-catalog__toolbar">
            <div class="sf-catalog__toolbar-start">
              <!-- Mobile: filter toggle button (visible below 768px) -->
              <button
                class="sf-catalog__filter-toggle"
                type="button"
                (click)="openFilterDrawer()"
                [attr.aria-label]="'catalog.filters' | translate"
                [attr.aria-expanded]="filterDrawerOpen()"
                aria-controls="sf-catalog-drawer"
              >
                <svg class="sf-catalog__filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="14" y2="12" />
                  <line x1="4" y1="18" x2="10" y2="18" />
                </svg>
                {{ 'catalog.filters' | translate }}
                @if (activeFilterCount() > 0) {
                  <span class="sf-catalog__filter-badge">{{ activeFilterCount() }}</span>
                }
              </button>
              <p class="sf-catalog__count">{{ total() }} {{ 'catalog.products' | translate }}</p>
            </div>
            <div class="sf-catalog__view-btns">
              <button class="sf-catalog__view-btn" [class.sf-catalog__view-btn--active]="viewMode() === 'grid'" type="button" (click)="setView('grid')">{{ 'catalog.view_grid' | translate }}</button>
              <button class="sf-catalog__view-btn" [class.sf-catalog__view-btn--active]="viewMode() === 'list'" type="button" (click)="setView('list')">{{ 'catalog.view_list' | translate }}</button>
            </div>
          </div>

          @if (loading()) {
            <div class="sf-catalog__grid">
              @for (_ of skeletons; track $index) {
                <div class="sf-catalog__skeleton">
                  <ui-skeleton variant="block" height="192px" />
                  <div style="padding:1rem; display:flex; flex-direction:column; gap:0.5rem">
                    <ui-skeleton variant="text" width="70%" />
                    <ui-skeleton variant="text" width="50%" />
                  </div>
                </div>
              }
            </div>
          } @else if (items().length === 0) {
            <ui-empty-state icon="🛒" [title]="'catalog.no_items' | translate" [description]="'catalog.no_items_subtitle' | translate" />
          } @else {
            <div [class]="'sf-catalog__grid sf-catalog__grid--' + viewMode()">
              @for (item of items(); track item.id) {
                <sf-retail-product-card [item]="item" [lang]="lang()" (viewItem)="onViewItem(item)" />
              }
            </div>

            @if (nextCursor()) {
              <div class="sf-catalog__load-more">
                <button class="sf-catalog__load-btn" type="button" [disabled]="loadingMore()" (click)="loadMore()">
                  {{ loadingMore() ? ('common.loading' | translate) : ('catalog.load_more' | translate) }}
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- Mobile filter drawer backdrop -->
    @if (filterDrawerOpen()) {
      <div
        class="sf-catalog__backdrop"
        (click)="closeFilterDrawer()"
        aria-hidden="true"
      ></div>
    }

    <!-- Mobile filter drawer -->
    <div
      id="sf-catalog-drawer"
      class="sf-catalog__drawer"
      [class.sf-catalog__drawer--open]="filterDrawerOpen()"
      role="dialog"
      [attr.aria-modal]="filterDrawerOpen()"
      [attr.aria-label]="'catalog.filters' | translate"
    >
      <div class="sf-catalog__drawer-header">
        <span class="sf-catalog__drawer-title">{{ 'catalog.filters' | translate }}</span>
        <button
          class="sf-catalog__drawer-close"
          type="button"
          (click)="closeFilterDrawer()"
          [attr.aria-label]="'catalog.close_filters' | translate"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div class="sf-catalog__drawer-body">
        <sf-retail-filter-sidebar
          [categories]="categories()"
          [lang]="lang()"
          (filtersChanged)="onFiltersChangedFromDrawer($event)"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .sf-catalog {
        background: var(--color-background, #fff8f1);
        min-block-size: 80vh;
      }
      .sf-catalog__header {
        background: var(--color-surface-container-high, #eee7df);
        padding-block: 2.5rem 2rem;
        padding-inline: 1.5rem;
      }
      .sf-catalog__header-inner { max-inline-size: 80rem; margin-inline: auto; }
      .sf-catalog__title {
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin: 0 0 1rem;
        letter-spacing: -0.02em;
      }

      /* Search bar */
      .sf-catalog__search-row { margin-block-start: 0.5rem; }
      .sf-catalog__search-label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-on-surface-variant, #514534);
        margin-block-end: 0.375rem;
      }
      .sf-catalog__search-wrap {
        position: relative;
        max-inline-size: 32rem;
      }
      .sf-catalog__search-icon {
        position: absolute;
        inset-inline-start: 0.75rem;
        inset-block-start: 50%;
        transform: translateY(-50%);
        inline-size: 1rem;
        block-size: 1rem;
        color: var(--color-on-surface-variant, #514534);
        opacity: 0.6;
        pointer-events: none;
      }
      .sf-catalog__search-input {
        inline-size: 100%;
        padding-block: 0.625rem;
        padding-inline: 2.25rem 0.875rem;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 8px;
        background: var(--color-surface, #ffffff);
        color: var(--color-on-surface, #1e1b17);
        font-size: 0.9375rem;
        font-family: inherit;
        transition: border-color 0.15s, box-shadow 0.15s;
        outline: none;
      }
      .sf-catalog__search-input:focus {
        border-color: var(--color-primary, #805600);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #805600) 15%, transparent);
      }
      .sf-catalog__search-input::placeholder { opacity: 0.5; }

      .sf-catalog__layout {
        max-inline-size: 80rem;
        margin-inline: auto;
        padding-inline: 1.5rem;
        padding-block: 2rem;
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      @media (min-width: 768px) {
        .sf-catalog__layout { grid-template-columns: 280px 1fr; }
        .sf-catalog__sidebar { display: block; }
      }
      .sf-catalog__sidebar { display: none; }
      @media (min-width: 768px) { .sf-catalog__sidebar { display: block; } }

      .sf-catalog__toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-block-end: 1.25rem;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .sf-catalog__toolbar-start {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .sf-catalog__count { font-size: 0.875rem; color: var(--color-on-surface-variant, #514534); margin: 0; }

      /* Mobile filter toggle */
      .sf-catalog__filter-toggle {
        display: none;
        align-items: center;
        gap: 0.375rem;
        padding-block: 0.5rem;
        padding-inline: 0.875rem;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 8px;
        background: var(--color-surface, #ffffff);
        color: var(--color-on-surface, #1e1b17);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: border-color 0.15s, background-color 0.15s;
        position: relative;
      }
      @media (max-width: 767px) {
        .sf-catalog__filter-toggle { display: flex; }
      }
      .sf-catalog__filter-toggle:hover {
        border-color: var(--color-primary, #805600);
        background: var(--color-surface-container, #f4ede5);
      }
      .sf-catalog__filter-icon {
        inline-size: 1rem;
        block-size: 1rem;
        flex-shrink: 0;
      }
      .sf-catalog__filter-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-inline-size: 1.25rem;
        block-size: 1.25rem;
        border-radius: 9999px;
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        font-size: 0.6875rem;
        font-weight: 700;
        padding-inline: 0.25rem;
        margin-inline-start: 0.125rem;
      }

      .sf-catalog__view-btns { display: flex; gap: 0.25rem; }
      .sf-catalog__view-btn {
        padding-block: 0.375rem;
        padding-inline: 0.75rem;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        background: var(--color-surface, #ffffff);
        color: var(--color-on-surface-variant, #514534);
        font-size: 0.8125rem;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.15s;
      }
      .sf-catalog__view-btn:first-child { border-radius: 6px 0 0 6px; }
      .sf-catalog__view-btn:last-child { border-radius: 0 6px 6px 0; }
      .sf-catalog__view-btn--active {
        background: var(--color-primary-container, #f2a922);
        border-color: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
        font-weight: 700;
      }

      .sf-catalog__grid {
        display: grid;
        gap: 1.25rem;
      }
      .sf-catalog__grid--grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
      .sf-catalog__grid--list { grid-template-columns: 1fr; }

      .sf-catalog__skeleton {
        background: var(--color-surface, #ffffff);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }

      .sf-catalog__load-more { display: flex; justify-content: center; padding-block-start: 1.5rem; }
      .sf-catalog__load-btn {
        padding-block: 0.75rem;
        padding-inline: 2rem;
        border: 2px solid var(--color-primary, #805600);
        border-radius: 9999px;
        background: transparent;
        color: var(--color-primary, #805600);
        font-size: 0.9375rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s, color 0.2s;
      }
      .sf-catalog__load-btn:hover:not(:disabled) { background: var(--color-primary, #805600); color: var(--color-on-primary, #ffffff); }
      .sf-catalog__load-btn:disabled { opacity: 0.6; cursor: not-allowed; }

      /* Mobile filter drawer backdrop */
      .sf-catalog__backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 40;
        animation: sf-backdrop-in 0.2s ease;
      }
      @keyframes sf-backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Mobile filter drawer */
      .sf-catalog__drawer {
        position: fixed;
        inset-block: 0;
        inset-inline-start: 0;
        inline-size: min(85vw, 20rem);
        background: var(--color-surface, #ffffff);
        z-index: 41;
        display: flex;
        flex-direction: column;
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
        transform: translateX(-100%);
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }
      /* RTL support for drawer */
      :host-context([dir="rtl"]) .sf-catalog__drawer {
        inset-inline-start: auto;
        inset-inline-end: 0;
        transform: translateX(100%);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
      }
      :host-context([dir="rtl"]) .sf-catalog__drawer--open {
        transform: translateX(0);
      }
      .sf-catalog__drawer--open {
        transform: translateX(0);
      }

      .sf-catalog__drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-block: 1rem;
        padding-inline: 1.25rem;
        border-block-end: 1px solid var(--color-outline-variant, #d6c4ad);
        flex-shrink: 0;
      }
      .sf-catalog__drawer-title {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
      }
      .sf-catalog__drawer-close {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 2rem;
        block-size: 2rem;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--color-on-surface-variant, #514534);
        cursor: pointer;
        padding: 0;
        transition: background-color 0.15s;
      }
      .sf-catalog__drawer-close:hover {
        background: var(--color-surface-container, #f4ede5);
      }
      .sf-catalog__drawer-close svg {
        inline-size: 1.125rem;
        block-size: 1.125rem;
      }
      .sf-catalog__drawer-body {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
      }
    `,
  ],
})
export class RetailCatalogComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly langToggle = inject(LanguageToggleService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly lang = this.langToggle.current;
  readonly categories = signal<Category[]>([]);
  readonly items = signal<CatalogItem[]>([]);
  readonly total = signal(0);
  readonly nextCursor = signal<string | null>(null);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly viewMode = signal<ViewMode>('grid');
  readonly filterDrawerOpen = signal(false);
  readonly searchValue = signal('');
  readonly skeletons = new Array(12);

  /** Reactive snapshot of active filters — used by computed(). Updated on every filter change. */
  private readonly activeFiltersSignal = signal<CatalogFilters>({});

  readonly activeFilterCount = computed(() => {
    const f = this.activeFiltersSignal();
    let count = 0;
    if (f.categoryId || f.categorySlug) count++;
    if (f.minPrice != null) count++;
    if (f.maxPrice != null) count++;
    if (f.inStockOnly) count++;
    if (f.q) count++;
    return count;
  });

  private _activeFilters: CatalogFilters = {};
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('categorySlug');
    if (slug) this._activeFilters = { categoryId: slug };

    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this._activeFilters.q = q;
      this.searchValue.set(q);
    }
    this.activeFiltersSignal.set({ ...this._activeFilters });

    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('sf-catalog-view');
      if (stored === 'list' || stored === 'grid') this.viewMode.set(stored as ViewMode);
    }

    // Debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((value) => {
      this._activeFilters = { ...this._activeFilters, q: value || undefined };
      this.activeFiltersSignal.set({ ...this._activeFilters });
      this.doLoad();
    });

    this.catalogService.getCategories().subscribe({ next: (cats) => this.categories.set(cats) });
    this.doLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    this.searchSubject.next(value);
  }

  private doLoad(): void {
    this.loading.set(true);
    this.catalogService.getCatalog({ ...this._activeFilters, limit: 24 }).subscribe({
      next: (page) => {
        this.items.set(page.items);
        this.total.set(page.total ?? 0);
        this.nextCursor.set(page.nextCursor);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFiltersChanged(filters: CatalogFilters): void {
    this._activeFilters = filters;
    this.activeFiltersSignal.set({ ...filters });
    this.doLoad();
  }

  onFiltersChangedFromDrawer(filters: CatalogFilters): void {
    this._activeFilters = filters;
    this.activeFiltersSignal.set({ ...filters });
    this.closeFilterDrawer();
    this.doLoad();
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor) return;
    this.loadingMore.set(true);
    this.catalogService.getCatalog({ ...this._activeFilters, cursor, limit: 24 }).subscribe({
      next: (page) => {
        this.items.update((prev) => [...prev, ...page.items]);
        this.nextCursor.set(page.nextCursor);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  setView(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('sf-catalog-view', mode);
  }

  openFilterDrawer(): void {
    this.filterDrawerOpen.set(true);
  }

  closeFilterDrawer(): void {
    this.filterDrawerOpen.set(false);
  }

  onViewItem(item: CatalogItem): void {
    this.router.navigate(['/', this.lang(), 'shop', item.categorySlug, item.slug]);
  }
}
