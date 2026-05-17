import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent, EmptyStateComponent } from '@shared/ui';
import { SearchService } from '../../../core/services/search.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { Category, CatalogItem } from '../../../core/models/catalog.model';
import { RestaurantMenuItemCardComponent } from '../../templates/restaurant/components/menu-item-card/restaurant-menu-item-card.component';

@Component({
  selector: 'sf-search-results',
  standalone: true,
  imports: [
    TranslateModule,
    SkeletonComponent,
    EmptyStateComponent,
    RestaurantMenuItemCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-results">
      <div class="sf-results__inner">
        <div class="sf-results__header">
          <h1 class="sf-results__title">
            @if (query()) {
              {{ 'search.results_for' | translate: { query: query() } }}
            } @else {
              {{ 'search.placeholder' | translate }}
            }
          </h1>
          @if (!loading() && total() > 0) {
            <p class="sf-results__count">{{ 'search.results_count' | translate: { count: total() } }}</p>
          }
        </div>

        <!-- Category filter chips -->
        @if (categories().length > 0) {
          <div class="sf-results__filters" role="group" [attr.aria-label]="'search.filter_by_category' | translate">
            <button
              class="sf-results__chip"
              [class.sf-results__chip--active]="!activeCategory()"
              type="button"
              (click)="filterByCategory(null)"
            >
              {{ 'catalog.filter_all' | translate }}
            </button>
            @for (cat of categories(); track cat.id) {
              <button
                class="sf-results__chip"
                [class.sf-results__chip--active]="activeCategory() === cat.id"
                type="button"
                (click)="filterByCategory(cat.id)"
              >
                {{ lang() === 'ar' ? cat.nameAr : cat.nameEn }}
              </button>
            }
          </div>
        }

        <!-- Availability toggle -->
        <div class="sf-results__availability">
          <label class="sf-results__toggle-label">
            <input
              type="checkbox"
              class="sf-results__toggle-input"
              [checked]="inStockOnly()"
              (change)="onStockToggle($event)"
            />
            {{ 'search.in_stock_only' | translate }}
          </label>
        </div>

        @if (loading()) {
          <div class="sf-results__grid">
            @for (_ of skeletons; track $index) {
              <div class="sf-results__skeleton-card">
                <ui-skeleton variant="block" height="192px" />
                <div style="padding: 1rem; display:flex; flex-direction:column; gap:0.5rem;">
                  <ui-skeleton variant="text" width="75%" />
                  <ui-skeleton variant="text" width="50%" />
                </div>
              </div>
            }
          </div>
        } @else if (items().length === 0) {
          <ui-empty-state
            icon="🔍"
            [title]="'search.no_results' | translate: { query: query() }"
            [description]="'search.no_results_subtitle' | translate"
          />
        } @else {
          <div class="sf-results__grid">
            @for (item of items(); track item.id) {
              <sf-restaurant-menu-item-card
                [item]="item"
                [lang]="lang()"
                (viewItem)="onViewItem($event)"
              />
            }
          </div>

          @if (nextCursor()) {
            <div class="sf-results__load-more">
              <button
                class="sf-results__load-btn"
                type="button"
                [disabled]="loadingMore()"
                (click)="loadMore()"
              >
                @if (loadingMore()) {
                  {{ 'common.loading' | translate }}
                } @else {
                  {{ 'catalog.load_more' | translate }}
                }
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .sf-results {
        background: var(--color-background, #fff8f1);
        min-block-size: 80vh;
        padding-block: 2.5rem;
        padding-inline: 1.5rem;
      }
      .sf-results__inner {
        max-inline-size: 80rem;
        margin-inline: auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .sf-results__header {
        display: flex;
        align-items: baseline;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .sf-results__title {
        font-size: clamp(1.25rem, 3vw, 2rem);
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin: 0;
        letter-spacing: -0.02em;
      }
      .sf-results__count {
        font-size: 0.875rem;
        color: var(--color-on-surface-variant, #514534);
        margin: 0;
      }

      .sf-results__filters {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .sf-results__chip {
        padding-block: 0.375rem;
        padding-inline: 1rem;
        border-radius: 9999px;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        background: var(--color-surface-container, #f4ede5);
        color: var(--color-on-surface-variant, #514534);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.15s;
      }
      .sf-results__chip--active {
        background: var(--color-primary-container, #f2a922);
        border-color: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
        font-weight: 700;
      }

      .sf-results__availability {
        display: flex;
        align-items: center;
      }
      .sf-results__toggle-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--color-on-surface-variant, #514534);
        cursor: pointer;
      }
      .sf-results__toggle-input {
        accent-color: var(--color-primary, #805600);
        cursor: pointer;
      }

      .sf-results__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.25rem;
      }
      @media (min-width: 640px) {
        .sf-results__grid {
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        }
      }

      .sf-results__skeleton-card {
        background: var(--color-surface, #ffffff);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }

      .sf-results__load-more {
        display: flex;
        justify-content: center;
        padding-block-start: 1rem;
      }
      .sf-results__load-btn {
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
      .sf-results__load-btn:hover:not(:disabled) {
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
      }
      .sf-results__load-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class SearchResultsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly catalogService = inject(CatalogService);
  private readonly langToggle = inject(LanguageToggleService);

  readonly lang = this.langToggle.current;
  readonly query = signal('');
  readonly activeCategory = signal<string | null>(null);
  readonly inStockOnly = signal(false);
  readonly categories = signal<Category[]>([]);
  readonly items = signal<CatalogItem[]>([]);
  readonly total = signal(0);
  readonly nextCursor = signal<string | null>(null);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly skeletons = new Array(8);

  ngOnInit(): void {
    this.catalogService.getCategories().subscribe((cats) => this.categories.set(cats));

    this.route.queryParams.subscribe((params) => {
      this.query.set(params['q'] ?? '');
      this.items.set([]);
      this.nextCursor.set(null);
      this.doSearch();
    });
  }

  private doSearch(): void {
    const q = this.query();
    if (!q) return;
    this.loading.set(true);
    this.searchService
      .search({
        q,
        categoryId: this.activeCategory() ?? undefined,
        inStockOnly: this.inStockOnly() || undefined,
      })
      .subscribe({
        next: (page) => {
          this.items.set(page.items);
          this.total.set(page.total ?? 0);
          this.nextCursor.set(page.nextCursor);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  filterByCategory(slug: string | null): void {
    this.activeCategory.set(slug);
    this.doSearch();
  }

  onStockToggle(event: Event): void {
    this.inStockOnly.set((event.target as HTMLInputElement).checked);
    this.doSearch();
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor) return;
    this.loadingMore.set(true);
    this.searchService
      .search({
        q: this.query(),
        categoryId: this.activeCategory() ?? undefined,
        cursor,
        inStockOnly: this.inStockOnly() || undefined,
      })
      .subscribe({
        next: (page) => {
          this.items.update((current) => [...current, ...page.items]);
          this.nextCursor.set(page.nextCursor);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false),
      });
  }

  onViewItem(item: CatalogItem): void {
    this.router.navigate(['/', this.lang(), 'menu', item.categorySlug, item.slug]);
  }
}
