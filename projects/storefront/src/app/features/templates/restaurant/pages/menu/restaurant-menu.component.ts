import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent, EmptyStateComponent } from '@shared/ui';
import { TenantConfigService } from '../../../../../core/services/tenant-config.service';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { CartService } from '../../../../../core/services/cart.service';
import { Category, CatalogItem } from '../../../../../core/models/catalog.model';
import { RestaurantCategoryTabsComponent } from '../../components/category-tabs/restaurant-category-tabs.component';
import { RestaurantMenuItemCardComponent } from '../../components/menu-item-card/restaurant-menu-item-card.component';

type ViewMode = 'grid' | 'list';
const VIEW_STORAGE_KEY = 'sf-menu-view';

interface CategorySection {
  category: Category;
  items: CatalogItem[];
  loading: boolean;
}

@Component({
  selector: 'sf-restaurant-menu',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    DecimalPipe,
    SkeletonComponent,
    EmptyStateComponent,
    RestaurantCategoryTabsComponent,
    RestaurantMenuItemCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="sf-menu__page-header">
      <div class="sf-menu__page-header-inner">
        <h1 class="sf-menu__page-title">{{ 'catalog.our_menu' | translate }}</h1>
        <p class="sf-menu__page-sub">{{ 'catalog.our_menu_subtitle' | translate }}</p>
      </div>
    </div>

    <!-- Category tabs -->
    <sf-restaurant-category-tabs
      [categories]="categories()"
      [activeCategorySlug]="activeCategorySlug()"
      [lang]="lang()"
      (categorySelected)="onCategorySelected($event)"
    />

    <!-- View toggle + content -->
    <div class="sf-menu__content">
      <div class="sf-menu__toolbar">
        <p class="sf-menu__item-count" aria-live="polite">
          {{ totalCount() }}
          {{ totalCount() === 1
            ? ('catalog.items_count' | translate: { count: totalCount() })
            : ('catalog.items_count_plural' | translate: { count: totalCount() }) }}
        </p>
        <div class="sf-menu__view-toggle" role="group" [attr.aria-label]="'catalog.view_toggle_grid' | translate">
          <button
            class="sf-menu__view-btn"
            [class.sf-menu__view-btn--active]="viewMode() === 'grid'"
            type="button"
            [attr.aria-label]="'catalog.view_toggle_grid' | translate"
            (click)="setView('grid')"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
          </button>
          <button
            class="sf-menu__view-btn"
            [class.sf-menu__view-btn--active]="viewMode() === 'list'"
            type="button"
            [attr.aria-label]="'catalog.view_toggle_list' | translate"
            (click)="setView('list')"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      @if (categoriesLoading()) {
        <div class="sf-menu__skeleton-sections">
          @for (_ of skeletonRows; track $index) {
            <div class="sf-menu__skeleton-section">
              <ui-skeleton variant="text" width="180px" height="1.5rem" />
              <div class="sf-menu__skeleton-grid">
                @for (__ of skeletonCards; track $index) {
                  <div class="sf-menu__skeleton-card">
                    <ui-skeleton variant="block" height="192px" />
                    <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                      <ui-skeleton variant="text" width="75%" />
                      <ui-skeleton variant="text" width="55%" />
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      } @else if (sections().length === 0) {
        <ui-empty-state
          icon="🍽️"
          [title]="'catalog.no_items' | translate"
          [description]="'catalog.no_items_subtitle' | translate"
        />
      } @else {
        @for (section of sections(); track section.category.id) {
          <section
            class="sf-menu__section"
            [id]="'category-' + (section.category.slug ?? section.category.id)"
            [attr.aria-labelledby]="'cat-heading-' + (section.category.slug ?? section.category.id)"
          >
            <div class="sf-menu__section-header">
              <h2
                class="sf-menu__section-title"
                [id]="'cat-heading-' + (section.category.slug ?? section.category.id)"
              >
                {{ lang() === 'ar' ? section.category.nameAr : section.category.nameEn }}
              </h2>
              <div class="sf-menu__section-accent"></div>
            </div>

            @if (section.loading) {
              <div [class]="'sf-menu__grid sf-menu__grid--' + viewMode()">
                @for (_ of skeletonCards; track $index) {
                  <div class="sf-menu__skeleton-card">
                    <ui-skeleton variant="block" height="192px" />
                    <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                      <ui-skeleton variant="text" width="75%" />
                      <ui-skeleton variant="text" width="55%" />
                    </div>
                  </div>
                }
              </div>
            } @else if (section.items.length === 0) {
              <ui-empty-state
                icon="🔍"
                [title]="'catalog.no_items' | translate"
              />
            } @else {
              <div [class]="'sf-menu__grid sf-menu__grid--' + viewMode()">
                @for (item of section.items; track item.id) {
                  <sf-restaurant-menu-item-card
                    [item]="item"
                    [lang]="lang()"
                    (viewItem)="onViewItem(item)"
                  />
                }
              </div>
            }
          </section>
        }
      }
    </div>
  `,
  styles: [
    `
      .sf-menu__page-header {
        background: var(--color-surface-container-high, #eee7df);
        padding-block: 3rem 2rem;
        padding-inline: 1.5rem;
        text-align: center;
      }
      .sf-menu__page-header-inner {
        max-inline-size: 80rem;
        margin-inline: auto;
      }
      .sf-menu__page-title {
        font-size: clamp(2rem, 4vw, 3rem);
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin: 0 0 0.5rem;
        letter-spacing: -0.02em;
      }
      .sf-menu__page-sub {
        font-size: 1rem;
        color: var(--color-on-surface-variant, #514534);
        margin: 0;
      }

      .sf-menu__content {
        max-inline-size: 80rem;
        margin-inline: auto;
        padding-inline: 1.5rem;
        padding-block: 2rem;
      }

      .sf-menu__toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-block-end: 1.5rem;
      }
      .sf-menu__item-count {
        font-size: 0.875rem;
        color: var(--color-on-surface-variant, #514534);
        margin: 0;
      }
      .sf-menu__view-toggle {
        display: flex;
        gap: 0.25rem;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 8px;
        overflow: hidden;
      }
      .sf-menu__view-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        inline-size: 2rem;
        block-size: 2rem;
        background: var(--color-surface, #ffffff);
        border: none;
        cursor: pointer;
        color: var(--color-on-surface-variant, #514534);
        transition: background-color 0.15s;
      }
      .sf-menu__view-btn svg {
        inline-size: 1.125rem;
        block-size: 1.125rem;
      }
      .sf-menu__view-btn:hover {
        background: var(--color-surface-container, #f4ede5);
      }
      .sf-menu__view-btn--active {
        background: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }

      /* Section */
      .sf-menu__section {
        margin-block-end: 3rem;
      }
      .sf-menu__section-header {
        margin-block-end: 1.25rem;
      }
      .sf-menu__section-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin: 0 0 0.5rem;
        letter-spacing: -0.02em;
      }
      .sf-menu__section-accent {
        inline-size: 2.5rem;
        block-size: 3px;
        background: var(--color-primary-container, #f2a922);
        border-radius: 9999px;
      }

      /* Grid */
      .sf-menu__grid {
        display: grid;
        gap: 1.25rem;
      }
      .sf-menu__grid--grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }
      @media (min-width: 640px) {
        .sf-menu__grid--grid {
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        }
      }
      .sf-menu__grid--list {
        grid-template-columns: 1fr;
      }

      /* Skeleton */
      .sf-menu__skeleton-sections {
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }
      .sf-menu__skeleton-section {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .sf-menu__skeleton-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.25rem;
      }
      .sf-menu__skeleton-card {
        background: var(--color-surface, #ffffff);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }
    `,
  ],
})
export class RestaurantMenuComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly langToggle = inject(LanguageToggleService);
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly lang = this.langToggle.current;
  readonly activeCategorySlug = signal<string | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly categoriesLoading = signal(true);
  readonly sections = signal<CategorySection[]>([]);
  readonly viewMode = signal<ViewMode>('grid');

  readonly totalCount = computed(() =>
    this.sections().reduce((s, sec) => s + sec.items.length, 0),
  );

  readonly skeletonRows = new Array(3);
  readonly skeletonCards = new Array(4);

  ngOnInit(): void {
    // Load persisted view mode
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === 'list' || stored === 'grid') {
        this.viewMode.set(stored as ViewMode);
      }
    }

    // Read category from URL
    const slug = this.route.snapshot.paramMap.get('categorySlug');
    if (slug) {
      this.activeCategorySlug.set(slug);
    }

    this.loadMenu();
  }

  private loadMenu(): void {
    this.catalogService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.categoriesLoading.set(false);
        this.loadSections(cats);
      },
      error: () => this.categoriesLoading.set(false),
    });
  }

  private loadSections(cats: Category[]): void {
    const activeSections: CategorySection[] = cats.map((cat) => ({
      category: cat,
      items: [],
      loading: true,
    }));
    this.sections.set(activeSections);

    cats.forEach((cat, idx) => {
      this.catalogService
        .getCatalog({ categoryId: cat.id, limit: 50 })
        .subscribe({
          next: (page) => {
            this.sections.update((prev) => {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], items: page.items ?? [], loading: false };
              return updated;
            });
          },
          error: () => {
            this.sections.update((prev) => {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], loading: false };
              return updated;
            });
          },
        });
    });
  }

  onCategorySelected(cat: Category): void {
    if (!cat.id) {
      this.activeCategorySlug.set(null);
      return;
    }
    this.activeCategorySlug.set(cat.slug ?? cat.id);
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById(`category-${cat.slug ?? cat.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
    });
  }

  onViewItem(item: CatalogItem): void {
    const lang = this.lang();
    this.router.navigate(['/', lang, 'menu', item.categorySlug ?? item.categoryId ?? '', item.slug ?? item.id]);
  }

  setView(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    }
  }
}
