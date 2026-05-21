import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { MenuService } from '../../core/services/menu.service';
import { CategoriesService } from '../../core/services/categories.service';
import { ModifiersService } from '../../core/services/modifiers.service';
import {
  Category,
  CategoryRequest,
  MenuItem,
  MenuItemRequest,
  ModifierGroup,
} from '../../core/models/catalog.model';

type ItemTab = 'basic' | 'images' | 'availability' | 'modifiers';

interface CategoryForm {
  id: string | null;
  nameEn: string;
  nameAr: string;
  isPublished: boolean;
  sortOrder: number;
}

interface ItemForm {
  id: string | null;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  calories: number | null;
  preparationTime: number | null;
  tags: string;
  spiceLevel: number;
  isAvailable: boolean;
  isPublished: boolean;
  modifierGroupIds: string[];
  sortOrder: number;
}

function emptyCatForm(): CategoryForm {
  return { id: null, nameEn: '', nameAr: '', isPublished: true, sortOrder: 0 };
}

function emptyItemForm(categoryId = ''): ItemForm {
  return {
    id: null, categoryId, nameEn: '', nameAr: '',
    descriptionEn: '', descriptionAr: '', price: 0,
    calories: null, preparationTime: null, tags: '',
    spiceLevel: 0, isAvailable: true, isPublished: true,
    modifierGroupIds: [], sortOrder: 0,
  };
}

@Component({
  selector: 'db-menu',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-menu">
      <!-- Header -->
      <header class="db-menu__header">
        <h1 class="db-menu__title">{{ 'menu.title' | translate }}</h1>
        <div class="db-menu__header-actions">
          <button class="db-menu__btn-secondary" type="button" (click)="openAddCategory()">
            + {{ 'menu.add_category' | translate }}
          </button>
          <button class="db-menu__btn-primary" type="button" [disabled]="!selectedCategoryId()" (click)="openAddItem()">
            + {{ 'menu.add_item' | translate }}
          </button>
        </div>
      </header>

      <!-- Search bar -->
      <div class="db-menu__toolbar">
        <div class="db-menu__search-wrap">
          <svg class="db-menu__search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            #menuSearchEl
            class="db-menu__search"
            type="search"
            [placeholder]="'menu.search_items' | translate"
            [value]="searchTerm()"
            (input)="searchTerm.set(menuSearchEl.value)"
          />
        </div>
      </div>

      <!-- Two-panel layout -->
      <div class="db-menu__panels">
        <!-- Left: category list -->
        <aside class="db-menu__cats">
          @if (loadingCats()) {
            @for (_ of [1,2,3,4]; track $index) {
              <div class="db-menu__cat-row db-menu__cat-row--skeleton" aria-hidden="true">
                <span class="db-menu__sk db-menu__sk--name"></span>
              </div>
            }
          }
          @if (!loadingCats()) {
            @if (categories().length === 0) {
              <p class="db-menu__empty-cats">{{ 'menu.no_categories' | translate }}</p>
            }
            @for (cat of categories(); track cat.id) {
              <div
                class="db-menu__cat-row"
                [class.db-menu__cat-row--active]="selectedCategoryId() === cat.id"
                (click)="selectCategory(cat.id)"
                tabindex="0"
                role="button"
                (keydown.enter)="selectCategory(cat.id)"
              >
                <div class="db-menu__cat-info">
                  <span class="db-menu__cat-name">{{ cat.nameEn }}</span>
                  @if (cat.nameAr) {
                    <span class="db-menu__cat-name-ar">{{ cat.nameAr }}</span>
                  }
                </div>
                <div class="db-menu__cat-meta">
                  <span class="db-menu__cat-badge" [attr.data-pub]="cat.isPublished ? 'yes' : 'no'">
                    {{ cat.isPublished ? '●' : '○' }}
                  </span>
                  <div class="db-menu__cat-row-actions" (click)="$event.stopPropagation()">
                    <button class="db-menu__icon-btn" type="button" [attr.aria-label]="'common.edit' | translate" (click)="openEditCategory(cat)">✎</button>
                    <button class="db-menu__icon-btn db-menu__icon-btn--danger" type="button" [attr.aria-label]="'common.delete' | translate" (click)="confirmDeleteCat(cat)">✕</button>
                  </div>
                </div>
              </div>
            }
          }
        </aside>

        <!-- Right: item list -->
        <section class="db-menu__items">
          @if (!selectedCategoryId()) {
            <div class="db-menu__empty-panel">
              <p class="db-menu__empty-text">{{ 'menu.no_items' | translate }}</p>
            </div>
          }
          @if (selectedCategoryId() && loadingItems()) {
            @for (_ of [1,2,3]; track $index) {
              <div class="db-menu__item-row db-menu__item-row--skeleton" aria-hidden="true">
                <span class="db-menu__sk db-menu__sk--thumb"></span>
                <span class="db-menu__sk db-menu__sk--name"></span>
              </div>
            }
          }
          @if (selectedCategoryId() && !loadingItems()) {
            @if (filteredItems().length === 0) {
              <div class="db-menu__empty-panel">
                <p class="db-menu__empty-text">{{ 'menu.no_items_in_category' | translate }}</p>
              </div>
            }
            @for (item of filteredItems(); track item.id) {
              <div class="db-menu__item-row">
                <div class="db-menu__item-thumb" [attr.aria-hidden]="true">
                  @if (item.imageUrl) {
                    <img [src]="item.imageUrl" [alt]="item.nameEn" class="db-menu__item-thumb-img" loading="lazy" />
                  } @else {
                    <span class="db-menu__item-thumb-placeholder">{{ item.nameEn.charAt(0) }}</span>
                  }
                </div>
                <div class="db-menu__item-info">
                  <span class="db-menu__item-name">{{ item.nameEn }}</span>
                  @if (item.nameAr) {
                    <span class="db-menu__item-name-ar">{{ item.nameAr }}</span>
                  }
                </div>
                <div class="db-menu__item-price">{{ item.price.toFixed(3) }}</div>
                <span class="db-menu__item-avail" [attr.data-avail]="item.isAvailable ? 'yes' : 'no'">
                  {{ (item.isAvailable ? 'menu.status_available' : 'menu.status_unavailable') | translate }}
                </span>
                <div class="db-menu__item-actions">
                  <button class="db-menu__btn-ghost-sm" type="button" (click)="openEditItem(item)">{{ 'common.edit' | translate }}</button>
                  <button class="db-menu__btn-danger-sm" type="button" (click)="confirmDeleteItem(item)">{{ 'common.delete' | translate }}</button>
                </div>
              </div>
            }
          }
        </section>
      </div>

      <!-- Category dialog -->
      @if (showCatForm()) {
        <div class="db-menu__overlay" role="dialog" [attr.aria-modal]="true" (click)="closeCatForm()">
          <div class="db-menu__dialog" (click)="$event.stopPropagation()">
            <header class="db-menu__dialog-header">
              <h2 class="db-menu__dialog-title">
                {{ (catForm().id ? 'menu.category_form_title_edit' : 'menu.category_form_title_add') | translate }}
              </h2>
              <button class="db-menu__close" type="button" (click)="closeCatForm()">✕</button>
            </header>
            <div class="db-menu__dialog-body">
              <label class="db-menu__label">
                {{ 'menu.category_name_en' | translate }}
                <input class="db-menu__input" type="text" [(ngModel)]="catForm().nameEn" />
              </label>
              <label class="db-menu__label">
                {{ 'menu.category_name_ar' | translate }}
                <input class="db-menu__input" type="text" [(ngModel)]="catForm().nameAr" dir="rtl" />
              </label>
              <label class="db-menu__label">
                {{ 'menu.category_sort_order' | translate }}
                <input class="db-menu__input" type="number" min="0" [(ngModel)]="catForm().sortOrder" />
              </label>
              <label class="db-menu__toggle-label">
                <input class="db-menu__toggle-input" type="checkbox" [(ngModel)]="catForm().isPublished" />
                <span class="db-menu__toggle-track"><span class="db-menu__toggle-thumb"></span></span>
                {{ 'menu.category_visible' | translate }}
              </label>
            </div>
            @if (catFormError()) {
              <div class="db-menu__form-error" role="alert">{{ catFormError() }}</div>
            }
            <footer class="db-menu__dialog-footer">
              <button class="db-menu__btn-secondary" type="button" (click)="closeCatForm()">{{ 'common.cancel' | translate }}</button>
              <button class="db-menu__btn-primary" type="button" (click)="saveCatForm()" [disabled]="saving()">
                @if (saving()) { <span class="db-menu__spinner" aria-hidden="true"></span> }
                {{ 'common.save' | translate }}
              </button>
            </footer>
          </div>
        </div>
      }

      <!-- Item drawer -->
      @if (showItemForm()) {
        <div class="db-menu__overlay" role="dialog" [attr.aria-modal]="true" (click)="closeItemForm()">
          <div class="db-menu__drawer" (click)="$event.stopPropagation()">
            <header class="db-menu__drawer-header">
              <h2 class="db-menu__drawer-title">
                {{ (itemForm().id ? 'menu.item_form_title_edit' : 'menu.item_form_title_add') | translate }}
              </h2>
              <button class="db-menu__close" type="button" (click)="closeItemForm()">✕</button>
            </header>

            <!-- Tabs -->
            <div class="db-menu__tabs" role="tablist">
              @for (tab of itemTabs; track tab) {
                <button
                  class="db-menu__tab"
                  type="button"
                  role="tab"
                  [class.db-menu__tab--active]="activeItemTab() === tab"
                  (click)="activeItemTab.set(tab)"
                >
                  {{ tabLabel(tab) | translate }}
                </button>
              }
            </div>

            <div class="db-menu__drawer-body">
              <!-- Basic tab -->
              @if (activeItemTab() === 'basic') {
                <label class="db-menu__label">
                  {{ 'menu.item_name_en' | translate }}
                  <input class="db-menu__input" type="text" [(ngModel)]="itemForm().nameEn" />
                </label>
                <label class="db-menu__label">
                  {{ 'menu.item_name_ar' | translate }}
                  <input class="db-menu__input" type="text" [(ngModel)]="itemForm().nameAr" dir="rtl" />
                </label>
                <label class="db-menu__label">
                  {{ 'menu.item_desc_en' | translate }}
                  <textarea class="db-menu__input db-menu__textarea" [(ngModel)]="itemForm().descriptionEn" rows="2"></textarea>
                </label>
                <label class="db-menu__label">
                  {{ 'menu.item_desc_ar' | translate }}
                  <textarea class="db-menu__input db-menu__textarea" [(ngModel)]="itemForm().descriptionAr" rows="2" dir="rtl"></textarea>
                </label>
                <label class="db-menu__label">
                  {{ 'menu.item_category' | translate }}
                  <select class="db-menu__input db-menu__select" [(ngModel)]="itemForm().categoryId">
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.nameEn }}</option>
                    }
                  </select>
                </label>
                <div class="db-menu__row-3">
                  <label class="db-menu__label">
                    {{ 'menu.item_price' | translate }}
                    <input class="db-menu__input" type="number" [(ngModel)]="itemForm().price" min="0" step="0.001" />
                  </label>
                  <label class="db-menu__label">
                    {{ 'menu.item_calories' | translate }}
                    <input class="db-menu__input" type="number" [(ngModel)]="itemForm().calories" min="0" />
                  </label>
                  <label class="db-menu__label">
                    {{ 'menu.item_prep_time' | translate }}
                    <input class="db-menu__input" type="number" [(ngModel)]="itemForm().preparationTime" min="0" />
                  </label>
                </div>
                <label class="db-menu__label">
                  {{ 'menu.item_tags' | translate }}
                  <input class="db-menu__input" type="text" [(ngModel)]="itemForm().tags" />
                </label>
              }

              <!-- Images tab -->
              @if (activeItemTab() === 'images') {
                <p class="db-menu__hint">{{ 'menu.tab_images' | translate }}</p>
              }

              <!-- Availability tab -->
              @if (activeItemTab() === 'availability') {
                <label class="db-menu__toggle-label">
                  <input class="db-menu__toggle-input" type="checkbox" [(ngModel)]="itemForm().isAvailable" />
                  <span class="db-menu__toggle-track"><span class="db-menu__toggle-thumb"></span></span>
                  {{ 'menu.item_available' | translate }}
                </label>
                <label class="db-menu__toggle-label">
                  <input class="db-menu__toggle-input" type="checkbox" [(ngModel)]="itemForm().isPublished" />
                  <span class="db-menu__toggle-track"><span class="db-menu__toggle-thumb"></span></span>
                  {{ 'menu.item_published' | translate }}
                </label>
              }

              <!-- Modifiers tab -->
              @if (activeItemTab() === 'modifiers') {
                <p class="db-menu__hint db-menu__hint--bold">{{ 'menu.item_modifiers' | translate }}</p>
                @if (modifierGroups().length === 0) {
                  <p class="db-menu__hint">{{ 'menu.item_no_modifiers' | translate }}</p>
                }
                @for (grp of modifierGroups(); track grp.id) {
                  <label class="db-menu__mod-row">
                    <input
                      class="db-menu__checkbox"
                      type="checkbox"
                      [checked]="itemForm().modifierGroupIds.includes(grp.id)"
                      (change)="toggleModifier(grp.id, $any($event.target).checked)"
                    />
                    <div class="db-menu__mod-info">
                      <span class="db-menu__mod-name">{{ grp.nameEn }}</span>
                      <span class="db-menu__mod-meta">
                        {{ grp.options.length }} {{ grp.selectionType }}
                      </span>
                    </div>
                  </label>
                }
              }
            </div>

            @if (itemFormError()) {
              <div class="db-menu__form-error" role="alert">{{ itemFormError() }}</div>
            }
            <footer class="db-menu__drawer-footer">
              <button class="db-menu__btn-secondary" type="button" (click)="closeItemForm()">{{ 'common.cancel' | translate }}</button>
              <button class="db-menu__btn-primary" type="button" (click)="saveItemForm()" [disabled]="saving()">
                @if (saving()) { <span class="db-menu__spinner" aria-hidden="true"></span> }
                {{ 'common.save' | translate }}
              </button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .db-menu {
      padding-block: 2rem;
      padding-inline: 2rem;
      container-type: inline-size;
      container-name: menu-page;
    }

    .db-menu__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-block-end: 1.25rem;
      flex-wrap: wrap;
    }

    .db-menu__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      letter-spacing: -0.025em;
    }

    .db-menu__header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .db-menu__toolbar {
      margin-block-end: 1.25rem;
    }

    .db-menu__search-wrap {
      position: relative;
      max-inline-size: 320px;
    }

    .db-menu__search-icon {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 0.625rem;
      transform: translateY(-50%);
      color: var(--text-subtle);
      pointer-events: none;
    }

    .db-menu__search {
      inline-size: 100%;
      padding-inline-start: 2rem;
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.5rem;
      padding-inline-end: 0.75rem;
      outline: none;
      block-size: 36px;
      box-sizing: border-box;
      transition: border-color var(--motion-base) ease, box-shadow var(--motion-base) ease;
    }

    .db-menu__search:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    /* Two-panel layout */
    .db-menu__panels {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 1.25rem;
      align-items: start;
    }

    /* Left panel */
    .db-menu__cats {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow: hidden;
    }

    .db-menu__cat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding-block: 0.75rem;
      padding-inline: 0.875rem;
      border-block-end: 1px solid var(--border);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-menu__cat-row:last-child { border-block-end: none; }

    .db-menu__cat-row:hover { background: var(--surface-alt); }

    .db-menu__cat-row--active {
      background: color-mix(in srgb, var(--accent) 8%, transparent);
      border-inline-start: 3px solid var(--accent);
    }

    .db-menu__cat-row--skeleton { cursor: default; }

    .db-menu__cat-info { display: flex; flex-direction: column; gap: 0.125rem; flex: 1; min-inline-size: 0; }

    .db-menu__cat-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .db-menu__cat-name-ar {
      font-size: 0.75rem;
      color: var(--text-muted);
      direction: rtl;
    }

    .db-menu__cat-meta { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }

    .db-menu__cat-row-actions { display: flex; gap: 0.125rem; }

    .db-menu__icon-btn {
      padding: 0.25rem 0.375rem;
      font-size: 0.875rem;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
      line-height: 1;
    }

    .db-menu__icon-btn:hover { background: var(--surface-alt); color: var(--accent); }
    .db-menu__icon-btn--danger:hover { color: var(--error); }

    .db-menu__cat-badge { font-size: 0.625rem; }
    .db-menu__cat-badge[data-pub='yes'] { color: var(--success); }
    .db-menu__cat-badge[data-pub='no'] { color: var(--text-muted); }

    .db-menu__empty-cats {
      padding: 1.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
      margin: 0;
    }

    /* Right panel */
    .db-menu__items {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow: hidden;
      min-block-size: 200px;
    }

    .db-menu__empty-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-block: 4rem;
    }

    .db-menu__empty-text {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
    }

    .db-menu__item-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-block: 0.75rem;
      padding-inline: 1rem;
      border-block-end: 1px solid var(--border);
      transition: background-color var(--motion-fast) ease;
    }

    .db-menu__item-row:last-child { border-block-end: none; }
    .db-menu__item-row:hover { background: var(--surface-alt); }
    .db-menu__item-row--skeleton { cursor: default; }

    .db-menu__item-thumb {
      inline-size: 40px;
      block-size: 40px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--surface-alt);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .db-menu__item-thumb-img { inline-size: 100%; block-size: 100%; object-fit: cover; }

    .db-menu__item-thumb-placeholder {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .db-menu__item-info { flex: 1; min-inline-size: 0; display: flex; flex-direction: column; gap: 0.125rem; }

    .db-menu__item-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .db-menu__item-name-ar {
      font-size: 0.75rem;
      color: var(--text-muted);
      direction: rtl;
    }

    .db-menu__item-price {
      font-size: 0.875rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--text);
      white-space: nowrap;
    }

    .db-menu__item-avail {
      font-size: 0.75rem;
      font-weight: 600;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      white-space: nowrap;
    }

    .db-menu__item-avail[data-avail='yes'] {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
      outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
    }

    .db-menu__item-avail[data-avail='no'] {
      background: color-mix(in srgb, var(--error) 8%, transparent);
      color: var(--error);
      outline: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
    }

    .db-menu__item-actions { display: flex; gap: 0.375rem; flex-shrink: 0; }

    /* Buttons */
    .db-menu__btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding-block: 0.5rem;
      padding-inline: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--accent-text);
      background: var(--accent);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-menu__btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
    .db-menu__btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

    .db-menu__btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding-block: 0.5rem;
      padding-inline: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-menu__btn-secondary:hover { background: var(--surface-alt); }

    .db-menu__btn-ghost-sm {
      padding-block: 0.25rem;
      padding-inline: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--accent);
      background: color-mix(in srgb, var(--accent) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-menu__btn-ghost-sm:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); }

    .db-menu__btn-danger-sm {
      padding-block: 0.25rem;
      padding-inline: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--error);
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-menu__btn-danger-sm:hover { background: color-mix(in srgb, var(--error) 14%, transparent); }

    /* Skeleton */
    .db-menu__sk {
      display: inline-block;
      block-size: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-shimmer 1.4s infinite;
    }

    .db-menu__sk--name  { inline-size: 120px; }
    .db-menu__sk--thumb { inline-size: 40px; block-size: 40px; border-radius: 8px; }

    @keyframes db-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Spinner */
    .db-menu__spinner {
      display: inline-block;
      inline-size: 14px;
      block-size: 14px;
      border: 2px solid color-mix(in srgb, var(--accent-text) 40%, transparent);
      border-block-start-color: var(--accent-text);
      border-radius: 50%;
      animation: db-spin 0.7s linear infinite;
    }

    @keyframes db-spin { to { transform: rotate(360deg); } }

    /* Dialog */
    .db-menu__overlay {
      position: fixed;
      inset: 0;
      background: color-mix(in srgb, #000 55%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding-inline: 1rem;
    }

    .db-menu__dialog {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      inline-size: 100%;
      max-inline-size: 480px;
      box-shadow: 0 24px 48px color-mix(in srgb, #000 30%, transparent);
    }

    .db-menu__dialog-header,
    .db-menu__drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-block: 1.25rem;
      padding-inline: 1.5rem;
      border-block-end: 1px solid var(--border);
    }

    .db-menu__dialog-title,
    .db-menu__drawer-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-menu__close {
      padding: 0.25rem 0.5rem;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-menu__close:hover { background: var(--surface-alt); color: var(--text); }

    .db-menu__dialog-body,
    .db-menu__drawer-body {
      padding-block: 1.25rem;
      padding-inline: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .db-menu__drawer-body { flex: 1; overflow-y: auto; }

    .db-menu__form-error {
      margin-inline: 1.25rem;
      margin-block-end: 0.75rem;
      padding-block: 0.625rem;
      padding-inline: 0.875rem;
      background: color-mix(in srgb, var(--error) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 30%, transparent);
      border-radius: var(--radius-control);
      font-size: 0.8125rem;
      color: var(--error);
      line-height: 1.5;
    }

    .db-menu__dialog-footer,
    .db-menu__drawer-footer {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      padding-block: 1rem 1.25rem;
      padding-inline: 1.5rem;
      border-block-start: 1px solid var(--border);
    }

    /* Drawer */
    .db-menu__drawer {
      background: var(--card);
      border-inline-start: 1px solid var(--border);
      inline-size: 100%;
      max-inline-size: 540px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      align-self: stretch;
    }

    /* Override overlay for drawer */
    .db-menu__overlay:has(.db-menu__drawer) {
      align-items: stretch;
      justify-content: flex-end;
    }

    /* Tabs */
    .db-menu__tabs {
      display: flex;
      border-block-end: 1px solid var(--border);
      flex-shrink: 0;
    }

    .db-menu__tab {
      flex: 1;
      padding-block: 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-block-end: 2px solid transparent;
      cursor: pointer;
      transition: color var(--motion-base) ease, border-color var(--motion-base) ease;
    }

    .db-menu__tab--active { color: var(--accent); border-block-end-color: var(--accent); }

    /* Form elements */
    .db-menu__label {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .db-menu__input {
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.5rem;
      padding-inline: 0.75rem;
      outline: none;
      transition: border-color var(--motion-base) ease, box-shadow var(--motion-base) ease;
    }

    .db-menu__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-menu__select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 0.625rem) 50%;
      padding-inline-end: 2rem;
      cursor: pointer;
    }

    .db-menu__textarea { block-size: auto; resize: vertical; }

    .db-menu__row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }

    .db-menu__toggle-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
    }

    .db-menu__toggle-input { display: none; }

    .db-menu__toggle-track {
      inline-size: 36px;
      block-size: 20px;
      background: var(--border);
      border-radius: 999px;
      position: relative;
      transition: background-color var(--motion-base) ease;
      flex-shrink: 0;
    }

    .db-menu__toggle-input:checked ~ .db-menu__toggle-track { background: var(--accent); }

    .db-menu__toggle-thumb {
      position: absolute;
      inset-block-start: 2px;
      inset-inline-start: 2px;
      inline-size: 16px;
      block-size: 16px;
      background: #fff;
      border-radius: 50%;
      transition: inset-inline-start var(--motion-base) ease;
    }

    .db-menu__toggle-input:checked ~ .db-menu__toggle-track .db-menu__toggle-thumb {
      inset-inline-start: 18px;
    }

    /* Modifiers list */
    .db-menu__mod-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-block: 0.5rem;
      padding-inline: 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-menu__mod-row:hover { background: var(--surface-alt); }

    .db-menu__checkbox { inline-size: 16px; block-size: 16px; accent-color: var(--accent); cursor: pointer; }

    .db-menu__mod-info { display: flex; flex-direction: column; gap: 0.125rem; }

    .db-menu__mod-name { font-size: 0.875rem; font-weight: 600; color: var(--text); }

    .db-menu__mod-meta { font-size: 0.75rem; color: var(--text-muted); }

    .db-menu__hint { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; margin: 0; }

    .db-menu__hint--bold { font-weight: 600; color: var(--text); }

    /* Responsive */
    @container menu-page (max-width: 768px) {
      .db-menu { padding-inline: 1rem; padding-block: 1.25rem; }
      .db-menu__title { font-size: 1.125rem; }
      .db-menu__panels { grid-template-columns: 1fr; }
      .db-menu__drawer { max-inline-size: 100%; }
      .db-menu__row-3 { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class MenuComponent implements OnInit {
  private readonly menuSvc = inject(MenuService);
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly modifiersSvc = inject(ModifiersService);

  readonly categories = signal<Category[]>([]);
  readonly allItems = signal<MenuItem[]>([]);
  readonly modifierGroups = signal<ModifierGroup[]>([]);
  readonly loadingCats = signal(false);
  readonly loadingItems = signal(false);
  readonly saving = signal(false);
  readonly catFormError = signal<string | null>(null);
  readonly itemFormError = signal<string | null>(null);
  readonly showCatForm = signal(false);
  readonly showItemForm = signal(false);
  readonly selectedCategoryId = signal('');
  readonly catForm = signal<CategoryForm>(emptyCatForm());
  readonly itemForm = signal<ItemForm>(emptyItemForm());
  readonly activeItemTab = signal<ItemTab>('basic');

  readonly itemTabs: ItemTab[] = ['basic', 'images', 'availability', 'modifiers'];

  readonly searchTerm = signal('');

  readonly filteredItems = computed(() => {
    const catId = this.selectedCategoryId();
    const search = this.searchTerm().toLowerCase();
    return this.allItems().filter((item) => {
      const matchesCat = !catId || item.categoryId === catId;
      const matchesSearch = !search || item.nameEn.toLowerCase().includes(search) || (item.nameAr ?? '').toLowerCase().includes(search);
      return matchesCat && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadAllItems();
    this.modifiersSvc.getAll().subscribe({ next: (groups) => this.modifierGroups.set(groups) });
  }

  loadCategories(): void {
    this.loadingCats.set(true);
    this.categoriesSvc.getAll().subscribe({
      next: (cats) => { this.categories.set(cats); this.loadingCats.set(false); },
      error: () => { this.loadingCats.set(false); },
    });
  }

  loadAllItems(): void {
    this.loadingItems.set(true);
    this.menuSvc.getAll({ pageSize: 500 }).subscribe({
      next: (res) => { this.allItems.set(res.items); this.loadingItems.set(false); },
      error: () => { this.loadingItems.set(false); },
    });
  }

  selectCategory(id: string): void {
    this.selectedCategoryId.set(id);
  }

  tabLabel(tab: ItemTab): string {
    const map: Record<ItemTab, string> = {
      basic: 'menu.tab_basic',
      images: 'menu.tab_images',
      availability: 'menu.tab_availability',
      modifiers: 'menu.tab_modifiers',
    };
    return map[tab];
  }

  // Category form
  openAddCategory(): void {
    this.catForm.set(emptyCatForm());
    this.catFormError.set(null);
    this.showCatForm.set(true);
  }

  openEditCategory(cat: Category): void {
    this.catForm.set({ id: cat.id, nameEn: cat.nameEn, nameAr: cat.nameAr, isPublished: cat.isPublished, sortOrder: cat.sortOrder });
    this.showCatForm.set(true);
  }

  closeCatForm(): void { this.showCatForm.set(false); this.catFormError.set(null); }

  saveCatForm(): void {
    const f = this.catForm();
    if (!f.nameEn.trim()) return;

    const body: CategoryRequest = {
      nameEn: f.nameEn,
      nameAr: f.nameAr,
      sortOrder: f.sortOrder,
      isPublished: f.isPublished,
    };

    this.saving.set(true);
    this.catFormError.set(null);
    const obs = f.id ? this.categoriesSvc.update(f.id, body) : this.categoriesSvc.create(body);
    obs.subscribe({
      next: () => { this.saving.set(false); this.showCatForm.set(false); this.loadCategories(); },
      error: (err) => {
        this.saving.set(false);
        this.catFormError.set(
          err?.details?.length > 0
            ? err.details.map((d: { message: string }) => d.message).join(' ')
            : (err?.message || 'Failed to save category.')
        );
      },
    });
  }

  confirmDeleteCat(cat: Category): void {
    if (!confirm('Delete this category? Items will become uncategorized.')) return;
    this.categoriesSvc.delete(cat.id).subscribe({
      next: () => {
        if (this.selectedCategoryId() === cat.id) this.selectedCategoryId.set('');
        this.loadCategories();
        this.loadAllItems();
      },
    });
  }

  // Item form
  openAddItem(): void {
    this.itemForm.set(emptyItemForm(this.selectedCategoryId()));
    this.activeItemTab.set('basic');
    this.itemFormError.set(null);
    this.showItemForm.set(true);
  }

  openEditItem(item: MenuItem): void {
    this.itemForm.set({
      id: item.id,
      categoryId: item.categoryId,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      descriptionEn: item.descriptionEn ?? '',
      descriptionAr: item.descriptionAr ?? '',
      price: item.price,
      calories: item.calories,
      preparationTime: item.preparationTime,
      tags: item.tags ?? '',
      spiceLevel: Number(item.spiceLevel) || 0,
      isAvailable: item.isAvailable,
      isPublished: item.isPublished,
      modifierGroupIds: [...(item.modifierGroupIds ?? [])],
      sortOrder: item.sortOrder,
    });
    this.activeItemTab.set('basic');
    this.itemFormError.set(null);
    this.showItemForm.set(true);
  }

  closeItemForm(): void { this.showItemForm.set(false); this.itemFormError.set(null); }

  toggleModifier(groupId: string, checked: boolean): void {
    this.itemForm.update((f) => {
      const ids = checked
        ? [...f.modifierGroupIds, groupId]
        : f.modifierGroupIds.filter((id) => id !== groupId);
      return { ...f, modifierGroupIds: ids };
    });
  }

  saveItemForm(): void {
    const f = this.itemForm();
    if (!f.nameEn.trim() || !f.categoryId) return;

    const body: MenuItemRequest = {
      categoryId: f.categoryId,
      nameEn: f.nameEn,
      nameAr: f.nameAr,
      descriptionEn: f.descriptionEn || null,
      descriptionAr: f.descriptionAr || null,
      price: f.price,
      isPublished: f.isPublished,
      isAvailable: f.isAvailable,
      preparationTime: f.preparationTime,
      calories: f.calories,
      spiceLevel: Number(f.spiceLevel) || 0,
      tags: f.tags || null,
      sortOrder: f.sortOrder,
      modifierGroupIds: f.modifierGroupIds,
    };

    this.saving.set(true);
    this.itemFormError.set(null);
    const obs = f.id ? this.menuSvc.update(f.id, body) : this.menuSvc.create(body);
    obs.subscribe({
      next: () => { this.saving.set(false); this.showItemForm.set(false); this.loadAllItems(); },
      error: (err) => {
        this.saving.set(false);
        this.itemFormError.set(
          err?.details?.length > 0
            ? err.details.map((d: { message: string }) => d.message).join(' ')
            : (err?.message || 'Failed to save item.')
        );
      },
    });
  }

  confirmDeleteItem(item: MenuItem): void {
    if (!confirm('Delete this menu item?')) return;
    this.menuSvc.delete(item.id).subscribe({ next: () => this.loadAllItems() });
  }
}
