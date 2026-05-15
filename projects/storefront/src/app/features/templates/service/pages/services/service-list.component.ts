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
import { CatalogService } from '../../../../../core/services/catalog.service';
import { Category, CatalogItem } from '../../../../../core/models/catalog.model';
import { ServiceCardComponent } from '../../components/service-card/service-card.component';
import { RestaurantCategoryTabsComponent } from '../../../restaurant/components/category-tabs/restaurant-category-tabs.component';

@Component({
  selector: 'sf-service-list',
  standalone: true,
  imports: [
    TranslateModule,
    SkeletonComponent,
    EmptyStateComponent,
    ServiceCardComponent,
    RestaurantCategoryTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-svc-list">
      <div class="sf-svc-list__header">
        <h1 class="sf-svc-list__title">{{ 'nav.services' | translate }}</h1>
      </div>

      <sf-restaurant-category-tabs
        [categories]="categories()"
        [activeCategorySlug]="activeCategorySlug()"
        [lang]="lang()"
        (categorySelected)="onCategorySelected($event)"
      />

      <div class="sf-svc-list__content">
        @if (loading()) {
          <div class="sf-svc-list__grid">
            @for (_ of skeletons; track $index) {
              <div class="sf-svc-list__skeleton">
                <ui-skeleton variant="block" height="192px" />
                <div style="padding:1rem; display:flex; flex-direction:column; gap:0.5rem">
                  <ui-skeleton variant="text" width="70%" />
                  <ui-skeleton variant="text" width="50%" />
                </div>
              </div>
            }
          </div>
        } @else if (items().length === 0) {
          <ui-empty-state icon="✂️" [title]="'catalog.no_items' | translate" [description]="'catalog.no_items_subtitle' | translate" />
        } @else {
          <div class="sf-svc-list__grid">
            @for (item of items(); track item.id) {
              <sf-service-card [item]="item" [lang]="lang()" (viewItem)="onViewItem(item)" />
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .sf-svc-list { background: var(--color-background, #fff8f1); min-block-size: 80vh; }
      .sf-svc-list__header {
        background: var(--color-surface-container-high, #eee7df);
        padding-block: 2.5rem 2rem;
        padding-inline: 1.5rem;
        text-align: center;
      }
      .sf-svc-list__title {
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        font-weight: 800;
        color: var(--color-primary, #805600);
        margin: 0;
        letter-spacing: -0.02em;
      }

      .sf-svc-list__content {
        max-inline-size: 80rem;
        margin-inline: auto;
        padding-inline: 1.5rem;
        padding-block: 2rem;
      }
      .sf-svc-list__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; }
      .sf-svc-list__skeleton {
        background: var(--color-surface, #ffffff);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }
    `,
  ],
})
export class ServiceListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly langToggle = inject(LanguageToggleService);

  readonly lang = this.langToggle.current;
  readonly categories = signal<Category[]>([]);
  readonly activeCategorySlug = signal<string | null>(null);
  readonly items = signal<CatalogItem[]>([]);
  readonly loading = signal(true);
  readonly skeletons = new Array(6);

  ngOnInit(): void {
    this.catalogService.getCategories().subscribe({ next: (cats) => this.categories.set(cats) });
    this.loadItems();
  }

  private loadItems(): void {
    this.loading.set(true);
    const slug = this.activeCategorySlug();
    this.catalogService.getCatalog({ categorySlug: slug ?? undefined, limit: 50 }).subscribe({
      next: (page) => { this.items.set(page.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onCategorySelected(cat: Category): void {
    this.activeCategorySlug.set(cat.id || null);
    this.loadItems();
  }

  onViewItem(item: CatalogItem): void {
    this.router.navigate(['/', this.lang(), 'services', item.id]);
  }
}
