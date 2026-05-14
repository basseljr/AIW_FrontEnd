import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CatalogItem } from '../../../../../core/models/catalog.model';

@Component({
  selector: 'sf-restaurant-menu-item-card',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="sf-menu-card" [class.sf-menu-card--unavailable]="!item.isAvailable">
      <div class="sf-menu-card__image-wrap">
        @if (item.imageUrl) {
          <img
            class="sf-menu-card__image"
            [src]="item.imageUrl"
            [alt]="lang === 'ar' ? item.nameAr : item.nameEn"
            loading="lazy"
            width="400"
            height="192"
          />
        } @else {
          <div class="sf-menu-card__image-placeholder" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
              <circle cx="8.5" cy="10.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
          </div>
        }
        @if (!item.isAvailable) {
          <span class="sf-menu-card__oos-badge">
            {{ 'catalog.out_of_stock' | translate }}
          </span>
        }
      </div>

      <div class="sf-menu-card__body">
        <h3 class="sf-menu-card__name">
          {{ lang === 'ar' ? item.nameAr : item.nameEn }}
        </h3>
        @if (item.descriptionEn || item.descriptionAr) {
          <p class="sf-menu-card__desc">
            {{ lang === 'ar' ? item.descriptionAr : item.descriptionEn }}
          </p>
        }
        <div class="sf-menu-card__footer">
          <span class="sf-menu-card__price">
            {{ item.price | number: '1.3-3' }} {{ 'common.currency' | translate }}
          </span>
          <button
            class="sf-menu-card__btn"
            type="button"
            [disabled]="!item.isAvailable"
            (click)="viewItem.emit(item)"
          >
            <svg class="sf-menu-card__btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {{ 'catalog.view_item' | translate }}
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      .sf-menu-card {
        background: var(--color-surface, #ffffff);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        transition: box-shadow 0.2s ease, transform 0.2s ease;
        display: flex;
        flex-direction: column;
      }
      .sf-menu-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      .sf-menu-card--unavailable {
        opacity: 0.7;
      }

      .sf-menu-card__image-wrap {
        position: relative;
        block-size: 192px;
        overflow: hidden;
        background: var(--color-surface-container, #f4ede5);
        flex-shrink: 0;
      }
      .sf-menu-card__image {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
        transition: transform 0.35s ease;
      }
      .sf-menu-card:hover .sf-menu-card__image {
        transform: scale(1.05);
      }
      .sf-menu-card__image-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 100%;
        block-size: 100%;
        color: var(--color-outline-variant, #d6c4ad);
      }
      .sf-menu-card__image-placeholder svg {
        inline-size: 3rem;
        block-size: 3rem;
      }
      .sf-menu-card__oos-badge {
        position: absolute;
        inset-block-start: 0.75rem;
        inset-inline-end: 0.75rem;
        background: rgba(0, 0, 0, 0.65);
        color: var(--color-on-primary, #ffffff);
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding-block: 0.25rem;
        padding-inline: 0.625rem;
        border-radius: 9999px;
      }

      .sf-menu-card__body {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        flex: 1;
      }
      .sf-menu-card__name {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
        line-height: 1.3;
      }
      .sf-menu-card__desc {
        font-size: 0.8125rem;
        color: var(--color-on-surface-variant, #514534);
        line-height: 1.5;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .sf-menu-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-block-start: auto;
        padding-block-start: 0.625rem;
        gap: 0.5rem;
      }
      .sf-menu-card__price {
        font-size: 1.0625rem;
        font-weight: 800;
        background: linear-gradient(
          135deg,
          var(--color-primary-container, #f2a922),
          var(--color-primary-container, #f2a922)
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        color: var(--color-primary-container, #f2a922);
        white-space: nowrap;
      }

      .sf-menu-card__btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding-block: 0.4375rem;
        padding-inline: 0.875rem;
        border: 1.5px solid var(--color-primary, #805600);
        border-radius: 9999px;
        background: transparent;
        color: var(--color-primary, #805600);
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s, color 0.2s;
        white-space: nowrap;
      }
      .sf-menu-card__btn:hover:not(:disabled) {
        background: var(--color-primary-container, #f2a922);
        border-color: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }
      .sf-menu-card__btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .sf-menu-card__btn-icon {
        inline-size: 0.9375rem;
        block-size: 0.9375rem;
        flex-shrink: 0;
      }
    `,
  ],
})
export class RestaurantMenuItemCardComponent {
  @Input({ required: true }) item!: CatalogItem;
  @Input() lang: 'en' | 'ar' = 'en';
  @Output() viewItem = new EventEmitter<CatalogItem>();
}
