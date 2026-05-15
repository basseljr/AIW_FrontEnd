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
  selector: 'sf-retail-product-card',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="sf-product-card" [class.sf-product-card--unavailable]="item.isAvailable === false">
      <div class="sf-product-card__image-wrap">
        @if (item.imageUrl && !imgError) {
          <img
            class="sf-product-card__image"
            [src]="item.imageUrl"
            [alt]="lang === 'ar' ? item.nameAr : item.nameEn"
            loading="lazy"
            width="400"
            height="192"
            (error)="imgError = true"
          />
        } @else {
          <div class="sf-product-card__image-placeholder" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        }
        @if (item.isAvailable === false) {
          <span class="sf-product-card__oos-badge">{{ 'catalog.out_of_stock' | translate }}</span>
        }
      </div>

      <div class="sf-product-card__body">
        <h3 class="sf-product-card__name">{{ lang === 'ar' ? item.nameAr : item.nameEn }}</h3>
        <div class="sf-product-card__price-row">
          <span class="sf-product-card__price">
            {{ item.price | number: '1.3-3' }} {{ 'common.currency' | translate }}
          </span>
          @if (item.compareAtPrice) {
            <span class="sf-product-card__compare-price">
              {{ item.compareAtPrice | number: '1.3-3' }}
            </span>
          }
        </div>
        <button
          class="sf-product-card__btn"
          type="button"
          [disabled]="item.isAvailable === false"
          (click)="viewItem.emit(item)"
        >
          <svg class="sf-product-card__btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {{ item.hasVariants ? ('catalog.view_item' | translate) : ('catalog.add_to_cart' | translate) }}
        </button>
      </div>
    </article>
  `,
  styles: [
    `
      .sf-product-card {
        background: var(--color-surface, #ffffff);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        transition: box-shadow 0.2s ease, transform 0.2s ease;
        display: flex;
        flex-direction: column;
      }
      .sf-product-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      .sf-product-card--unavailable { opacity: 0.7; }

      .sf-product-card__image-wrap {
        position: relative;
        block-size: 192px;
        overflow: hidden;
        background: var(--color-surface-container, #f4ede5);
        flex-shrink: 0;
      }
      .sf-product-card__image {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
        transition: transform 0.35s ease;
      }
      .sf-product-card:hover .sf-product-card__image { transform: scale(1.05); }
      .sf-product-card__image-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 100%;
        block-size: 100%;
        color: var(--color-outline-variant, #d6c4ad);
      }
      .sf-product-card__image-placeholder svg { inline-size: 3rem; block-size: 3rem; }
      .sf-product-card__oos-badge {
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

      .sf-product-card__body {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        flex: 1;
      }
      .sf-product-card__name {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
        line-height: 1.3;
      }
      .sf-product-card__price-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-block-start: auto;
      }
      .sf-product-card__price {
        font-size: 1rem;
        font-weight: 800;
        color: var(--color-primary-container, #f2a922);
      }
      .sf-product-card__compare-price {
        font-size: 0.875rem;
        color: var(--color-on-surface-variant, #514534);
        text-decoration: line-through;
      }

      .sf-product-card__btn {
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
        margin-block-start: 0.5rem;
        align-self: flex-start;
      }
      .sf-product-card__btn:hover:not(:disabled) {
        background: var(--color-primary-container, #f2a922);
        border-color: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }
      .sf-product-card__btn:disabled { opacity: 0.45; cursor: not-allowed; }
      .sf-product-card__btn-icon { inline-size: 0.9375rem; block-size: 0.9375rem; flex-shrink: 0; }
    `,
  ],
})
export class RetailProductCardComponent {
  @Input({ required: true }) item!: CatalogItem;
  @Input() lang: 'en' | 'ar' = 'en';
  @Output() viewItem = new EventEmitter<CatalogItem>();
  imgError = false;
}
