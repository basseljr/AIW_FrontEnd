import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Category, CatalogFilters } from '../../../../../core/models/catalog.model';

@Component({
  selector: 'sf-retail-filter-sidebar',
  standalone: true,
  imports: [TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sf-filter">
      <h3 class="sf-filter__title">{{ 'search.filter_by_category' | translate }}</h3>

      <!-- Category list -->
      @if (categories.length > 0) {
        <div class="sf-filter__section">
          <ul class="sf-filter__category-list" role="list">
            <li>
              <label class="sf-filter__category-item">
                <input
                  type="checkbox"
                  [checked]="!selectedCategories().length"
                  (change)="clearCategories()"
                />
                {{ 'catalog.filter_all' | translate }}
              </label>
            </li>
            @for (cat of categories; track cat.id) {
              <li>
                <label class="sf-filter__category-item">
                  <input
                    type="checkbox"
                    [checked]="selectedCategories().includes(cat.slug)"
                    (change)="toggleCategory(cat.slug)"
                  />
                  {{ lang === 'ar' ? cat.nameAr : cat.nameEn }}
                  @if (cat.itemCount != null) {
                    <span class="sf-filter__count">({{ cat.itemCount }})</span>
                  }
                </label>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Price range -->
      <div class="sf-filter__section">
        <h4 class="sf-filter__section-title">{{ 'catalog.price_range' | translate }}</h4>
        <div class="sf-filter__price-range">
          <div class="sf-filter__price-input-wrap">
            <label class="sf-filter__price-label" for="sf-filter-min">{{ 'catalog.price_min' | translate }}</label>
            <input
              id="sf-filter-min"
              class="sf-filter__price-input"
              type="number"
              min="0"
              [value]="minPrice()"
              (input)="onMinPrice($event)"
              placeholder="0"
            />
          </div>
          <span class="sf-filter__price-sep">—</span>
          <div class="sf-filter__price-input-wrap">
            <label class="sf-filter__price-label" for="sf-filter-max">{{ 'catalog.price_max' | translate }}</label>
            <input
              id="sf-filter-max"
              class="sf-filter__price-input"
              type="number"
              min="0"
              [value]="maxPrice()"
              (input)="onMaxPrice($event)"
              placeholder="∞"
            />
          </div>
        </div>
      </div>

      <!-- Availability -->
      <div class="sf-filter__section">
        <label class="sf-filter__toggle">
          <input
            type="checkbox"
            [checked]="inStockOnly()"
            (change)="onStockToggle($event)"
          />
          {{ 'catalog.availability_in_stock' | translate }}
        </label>
      </div>

      <!-- Apply button -->
      <button
        class="sf-filter__apply-btn"
        type="button"
        (click)="applyFilters()"
      >
        {{ 'catalog.apply_filters' | translate }}
      </button>
    </aside>
  `,
  styles: [
    `
      .sf-filter {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 1.25rem;
        background: var(--color-surface, #ffffff);
        border-radius: 12px;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
      }
      .sf-filter__title {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-primary, #805600);
        margin: 0;
      }
      .sf-filter__section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-block-start: 1rem;
        border-block-start: 1px solid var(--color-outline-variant, #d6c4ad);
      }
      .sf-filter__section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
        margin: 0 0 0.5rem;
      }

      .sf-filter__category-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .sf-filter__category-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--color-on-surface-variant, #514534);
        cursor: pointer;
      }
      .sf-filter__category-item input {
        accent-color: var(--color-primary, #805600);
        cursor: pointer;
      }
      .sf-filter__count {
        font-size: 0.75rem;
        color: var(--color-on-surface-variant, #514534);
      }

      .sf-filter__price-range {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .sf-filter__price-input-wrap { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
      .sf-filter__price-label { font-size: 0.75rem; color: var(--color-on-surface-variant, #514534); }
      .sf-filter__price-input {
        inline-size: 100%;
        padding: 0.5rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 8px;
        background: var(--color-surface, #ffffff);
        color: var(--color-on-surface, #1e1b17);
        font-size: 0.875rem;
        font-family: inherit;
      }
      .sf-filter__price-input:focus {
        outline: none;
        border-color: var(--color-primary, #805600);
      }
      .sf-filter__price-sep { color: var(--color-on-surface-variant, #514534); font-weight: 300; }

      .sf-filter__toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--color-on-surface-variant, #514534);
        cursor: pointer;
      }
      .sf-filter__toggle input { accent-color: var(--color-primary, #805600); cursor: pointer; }

      .sf-filter__apply-btn {
        padding-block: 0.625rem;
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        border: none;
        border-radius: 9999px;
        font-size: 0.9375rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
      }
      .sf-filter__apply-btn:hover {
        background: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }
    `,
  ],
})
export class RetailFilterSidebarComponent {
  @Input() categories: Category[] = [];
  @Input() lang: 'en' | 'ar' = 'en';
  @Output() filtersChanged = new EventEmitter<CatalogFilters>();

  readonly selectedCategories = signal<string[]>([]);
  readonly minPrice = signal<number | undefined>(undefined);
  readonly maxPrice = signal<number | undefined>(undefined);
  readonly inStockOnly = signal(false);

  clearCategories(): void {
    this.selectedCategories.set([]);
  }

  toggleCategory(slug: string): void {
    this.selectedCategories.update((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  onMinPrice(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.minPrice.set(isNaN(val) ? undefined : val);
  }

  onMaxPrice(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.maxPrice.set(isNaN(val) ? undefined : val);
  }

  onStockToggle(event: Event): void {
    this.inStockOnly.set((event.target as HTMLInputElement).checked);
  }

  applyFilters(): void {
    const cats = this.selectedCategories();
    this.filtersChanged.emit({
      categorySlug: cats.length === 1 ? cats[0] : undefined,
      minPrice: this.minPrice(),
      maxPrice: this.maxPrice(),
      inStockOnly: this.inStockOnly(),
    });
  }
}
