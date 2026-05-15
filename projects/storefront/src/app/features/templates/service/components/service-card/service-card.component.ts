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
  selector: 'sf-service-card',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="sf-svc-card" [class.sf-svc-card--unavailable]="item.isAvailable === false">
      <div class="sf-svc-card__image-wrap">
        @if (item.imageUrl && !imgError) {
          <img
            class="sf-svc-card__image"
            [src]="item.imageUrl"
            [alt]="lang === 'ar' ? item.nameAr : item.nameEn"
            loading="lazy"
            width="400"
            height="192"
            (error)="imgError = true"
          />
        } @else {
          <div class="sf-svc-card__image-placeholder" aria-hidden="true">✂️</div>
        }
        @if (item.durationMinutes) {
          <span class="sf-svc-card__duration-badge">
            {{ 'item_detail.minutes' | translate: { count: item.durationMinutes } }}
          </span>
        }
      </div>
      <div class="sf-svc-card__body">
        <h3 class="sf-svc-card__name">{{ lang === 'ar' ? item.nameAr : item.nameEn }}</h3>
        @if (item.descriptionEn) {
          <p class="sf-svc-card__desc">{{ lang === 'ar' ? item.descriptionAr : item.descriptionEn }}</p>
        }
        <div class="sf-svc-card__footer">
          <span class="sf-svc-card__price">
            {{ item.price | number: '1.3-3' }} {{ 'common.currency' | translate }}
          </span>
          <button class="sf-svc-card__btn" type="button" [disabled]="item.isAvailable === false" (click)="viewItem.emit(item)">
            {{ 'home.book_now' | translate }}
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      .sf-svc-card {
        background: var(--color-surface, #ffffff);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        transition: box-shadow 0.2s ease, transform 0.2s ease;
        display: flex;
        flex-direction: column;
      }
      .sf-svc-card:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
      .sf-svc-card--unavailable { opacity: 0.7; }

      .sf-svc-card__image-wrap {
        position: relative;
        block-size: 192px;
        overflow: hidden;
        background: var(--color-surface-container, #f4ede5);
      }
      .sf-svc-card__image { inline-size: 100%; block-size: 100%; object-fit: cover; transition: transform 0.35s ease; }
      .sf-svc-card:hover .sf-svc-card__image { transform: scale(1.05); }
      .sf-svc-card__image-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 100%;
        block-size: 100%;
        font-size: 4rem;
      }
      .sf-svc-card__duration-badge {
        position: absolute;
        inset-block-start: 0.75rem;
        inset-inline-start: 0.75rem;
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        font-size: 0.75rem;
        font-weight: 700;
        padding-block: 0.25rem;
        padding-inline: 0.625rem;
        border-radius: 9999px;
      }

      .sf-svc-card__body { padding: 1rem; display: flex; flex-direction: column; gap: 0.375rem; flex: 1; }
      .sf-svc-card__name { font-size: 1rem; font-weight: 700; color: var(--color-on-surface, #1e1b17); margin: 0; line-height: 1.3; }
      .sf-svc-card__desc {
        font-size: 0.8125rem;
        color: var(--color-on-surface-variant, #514534);
        line-height: 1.5;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .sf-svc-card__footer { display: flex; align-items: center; justify-content: space-between; margin-block-start: auto; padding-block-start: 0.625rem; gap: 0.5rem; }
      .sf-svc-card__price { font-size: 1.0625rem; font-weight: 800; color: var(--color-primary-container, #f2a922); }
      .sf-svc-card__btn {
        display: inline-flex;
        align-items: center;
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
      .sf-svc-card__btn:hover:not(:disabled) {
        background: var(--color-primary-container, #f2a922);
        border-color: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }
      .sf-svc-card__btn:disabled { opacity: 0.45; cursor: not-allowed; }
    `,
  ],
})
export class ServiceCardComponent {
  @Input({ required: true }) item!: CatalogItem;
  @Input() lang: 'en' | 'ar' = 'en';
  @Output() viewItem = new EventEmitter<CatalogItem>();
  imgError = false;
}
