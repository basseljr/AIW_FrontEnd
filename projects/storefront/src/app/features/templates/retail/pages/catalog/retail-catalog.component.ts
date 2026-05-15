import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';

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
        </div>
      </div>

      <div class="sf-catalog__layout">
        <!-- Filter sidebar (desktop always visible, mobile drawer) -->
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
            <p class="sf-catalog__count">{{ total() }} {{ 'catalog.products' | translate }}</p>
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
        margin: 0;
        letter-spacing: -0.02em;
      }

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
      }
      .sf-catalog__count { font-size: 0.875rem; color: var(--color-on-surface-variant, #514534); margin: 0; }
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
    `,
  ],
})
export class RetailCatalogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly langToggle = inject(LanguageToggleService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly lang = this.langToggle.current;
  readonly categories = signal<Category[]>([]);
  readonly items = signal<CatalogItem[]>([]);
  readonly total = signal(0);
  readonly nextCursor = signal<string | null>(null);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly viewMode = signal<ViewMode>('grid');
  readonly skeletons = new Array(12);

  private activeFilters: CatalogFilters = {};

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('categorySlug');
    if (slug) this.activeFilters = { categoryId: slug };

    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) this.activeFilters.q = q;

    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('sf-catalog-view');
      if (stored === 'list' || stored === 'grid') this.viewMode.set(stored as ViewMode);
    }

    this.catalogService.getCategories().subscribe({ next: (cats) => this.categories.set(cats) });
    this.doLoad();
  }

  private doLoad(): void {
    this.loading.set(true);
    this.catalogService.getCatalog({ ...this.activeFilters, limit: 24 }).subscribe({
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
    this.activeFilters = filters;
    this.doLoad();
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor) return;
    this.loadingMore.set(true);
    this.catalogService.getCatalog({ ...this.activeFilters, cursor, limit: 24 }).subscribe({
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

  onViewItem(item: CatalogItem): void {
    this.router.navigate(['/', this.lang(), 'shop', item.categorySlug, item.slug]);
  }
}
