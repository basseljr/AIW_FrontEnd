import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Category } from '../../../../../core/models/catalog.model';

@Component({
  selector: 'sf-restaurant-category-tabs',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="sf-cat-tabs" aria-label="Categories">
      <div class="sf-cat-tabs__track" role="list">
        <button
          class="sf-cat-tabs__chip"
          [class.sf-cat-tabs__chip--active]="activeCategorySlug === null"
          role="listitem"
          type="button"
          (click)="selectAll()"
        >
          {{ 'catalog.all_categories' | translate }}
        </button>
        @for (cat of categories; track cat.id) {
          <button
            class="sf-cat-tabs__chip"
            [class.sf-cat-tabs__chip--active]="activeCategorySlug === cat.slug"
            role="listitem"
            type="button"
            [attr.aria-current]="activeCategorySlug === cat.slug ? 'true' : null"
            (click)="select(cat)"
          >
            {{ lang === 'ar' ? cat.nameAr : cat.nameEn }}
          </button>
        }
      </div>
    </nav>
  `,
  styles: [
    `
      .sf-cat-tabs {
        position: sticky;
        inset-block-start: 64px;
        z-index: 40;
        background: var(--color-background, #fff8f1);
        border-block-end: 1px solid var(--color-outline-variant, #d6c4ad);
        padding-block: 0.75rem;
      }

      .sf-cat-tabs__track {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        padding-inline: 1.5rem;
        -ms-overflow-style: none;
      }
      .sf-cat-tabs__track::-webkit-scrollbar {
        display: none;
      }

      .sf-cat-tabs__chip {
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        scroll-snap-align: start;
        padding-block: 0.375rem;
        padding-inline: 1rem;
        border-radius: 9999px;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        background: var(--color-surface-container, #f4ede5);
        color: var(--color-on-surface-variant, #514534);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s, color 0.2s;
        font-family: inherit;
        flex-shrink: 0;
      }
      .sf-cat-tabs__chip:hover {
        border-color: var(--color-primary, #805600);
        color: var(--color-primary, #805600);
      }
      .sf-cat-tabs__chip--active {
        background: var(--color-primary-container, #f2a922);
        border-color: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
        font-weight: 700;
      }
      .sf-cat-tabs__chip--active:hover {
        background: var(--color-primary-container, #f2a922);
        border-color: var(--color-primary-container, #f2a922);
      }
    `,
  ],
})
export class RestaurantCategoryTabsComponent {
  @Input() categories: Category[] = [];
  @Input() activeCategorySlug: string | null = null;
  @Input() lang: 'en' | 'ar' = 'en';
  @Output() categorySelected = new EventEmitter<Category>();

  select(cat: Category): void {
    this.categorySelected.emit(cat);
  }

  selectAll(): void {
    this.categorySelected.emit({ id: '', slug: '', nameEn: 'All', nameAr: 'الكل', sortOrder: 0 });
  }
}
