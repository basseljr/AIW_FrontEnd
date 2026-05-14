import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent, EmptyStateComponent } from '@shared/ui';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { CatalogItemDetail } from '../../../../../core/models/catalog.model';
import { ImageGalleryComponent } from '../../../../shared-catalog/image-gallery/image-gallery.component';

@Component({
  selector: 'sf-service-detail',
  standalone: true,
  imports: [RouterLink, TranslateModule, DecimalPipe, SkeletonComponent, EmptyStateComponent, ImageGalleryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-svc-detail">
      <div class="sf-svc-detail__inner">
        <nav class="sf-svc-detail__breadcrumb" aria-label="Breadcrumb">
          <a [routerLink]="['/', lang(), '']">Home</a>
          <span aria-hidden="true">/</span>
          <a [routerLink]="['/', lang(), 'services']">{{ 'nav.services' | translate }}</a>
          @if (item()) {
            <span aria-hidden="true">/</span>
            <span aria-current="page">{{ lang() === 'ar' ? item()!.nameAr : item()!.nameEn }}</span>
          }
        </nav>

        @if (loading()) {
          <div class="sf-svc-detail__layout">
            <ui-skeleton variant="block" height="360px" />
            <div style="display:flex; flex-direction:column; gap:1rem">
              <ui-skeleton variant="text" height="2rem" width="80%" />
              <ui-skeleton variant="text" width="50%" />
              <ui-skeleton variant="text" />
              <ui-skeleton variant="text" />
            </div>
          </div>
        } @else if (!item()) {
          <ui-empty-state icon="🔍" [title]="'errors.not_found' | translate" />
        } @else {
          <div class="sf-svc-detail__layout">
            <sf-image-gallery [images]="item()!.images ?? []" [altText]="lang() === 'ar' ? item()!.nameAr : item()!.nameEn" />

            <div class="sf-svc-detail__info">
              <h1 class="sf-svc-detail__name">{{ lang() === 'ar' ? item()!.nameAr : item()!.nameEn }}</h1>

              @if (item()!.durationMinutes) {
                <div class="sf-svc-detail__duration">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>{{ 'item_detail.minutes' | translate: { count: item()!.durationMinutes } }}</span>
                </div>
              }

              @if (item()!.descriptionEn || item()!.descriptionAr) {
                <p class="sf-svc-detail__desc">{{ lang() === 'ar' ? item()!.descriptionAr : item()!.descriptionEn }}</p>
              }

              <div class="sf-svc-detail__price-row">
                <span class="sf-svc-detail__price">{{ item()!.price | number: '1.3-3' }} {{ 'common.currency' | translate }}</span>
              </div>

              <button class="sf-svc-detail__book-btn" type="button" (click)="onBookNow()">
                {{ 'item_detail.book_now' | translate }}
              </button>

              @if (toastVisible()) {
                <p class="sf-svc-detail__coming-soon" role="status" aria-live="polite">
                  {{ 'item_detail.booking_coming_soon' | translate }}
                </p>
              }

              <a class="sf-svc-detail__back" [routerLink]="['/', lang(), 'services']">← {{ 'item_detail.back_to_services' | translate }}</a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .sf-svc-detail { background: var(--color-background, #fff8f1); min-block-size: 80vh; padding-block: 2rem; padding-inline: 1.5rem; }
      .sf-svc-detail__inner { max-inline-size: 80rem; margin-inline: auto; }
      .sf-svc-detail__breadcrumb {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        font-size: 0.8125rem;
        color: var(--color-on-surface-variant, #514534);
        margin-block-end: 1.5rem;
      }
      .sf-svc-detail__breadcrumb a { color: var(--color-primary, #805600); text-decoration: none; }
      .sf-svc-detail__breadcrumb a:hover { text-decoration: underline; }

      .sf-svc-detail__layout { display: grid; grid-template-columns: 1fr; gap: 2.5rem; }
      @media (min-width: 768px) { .sf-svc-detail__layout { grid-template-columns: 1fr 1fr; } }

      .sf-svc-detail__info { display: flex; flex-direction: column; gap: 1rem; }
      .sf-svc-detail__name {
        font-size: clamp(1.75rem, 3vw, 2.25rem);
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
        letter-spacing: -0.02em;
      }
      .sf-svc-detail__duration {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.9375rem;
        color: var(--color-on-surface-variant, #514534);
        font-weight: 600;
      }
      .sf-svc-detail__duration svg { inline-size: 1.125rem; block-size: 1.125rem; color: var(--color-primary, #805600); }
      .sf-svc-detail__desc { font-size: 1rem; color: var(--color-on-surface-variant, #514534); line-height: 1.7; margin: 0; }
      .sf-svc-detail__price-row { display: flex; align-items: center; gap: 0.75rem; }
      .sf-svc-detail__price { font-size: 1.75rem; font-weight: 900; color: var(--color-primary-container, #f2a922); }
      .sf-svc-detail__book-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding-block: 0.875rem;
        padding-inline: 2rem;
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        border: none;
        border-radius: 9999px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
        align-self: flex-start;
      }
      .sf-svc-detail__book-btn:hover { background: var(--color-primary-container, #f2a922); color: var(--color-on-primary-container, #634100); }
      .sf-svc-detail__coming-soon {
        font-size: 0.875rem;
        color: var(--color-primary, #805600);
        font-weight: 600;
        padding: 0.625rem 1rem;
        background: color-mix(in srgb, var(--color-primary-container, #f2a922) 15%, transparent);
        border-radius: 8px;
        margin: 0;
      }
      .sf-svc-detail__back { display: inline-flex; align-items: center; gap: 0.375rem; color: var(--color-primary, #805600); font-size: 0.875rem; font-weight: 600; text-decoration: none; }
      .sf-svc-detail__back:hover { text-decoration: underline; }
    `,
  ],
})
export class ServiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly langToggle = inject(LanguageToggleService);

  readonly lang = this.langToggle.current;
  readonly loading = signal(true);
  readonly item = signal<CatalogItemDetail | null>(null);
  readonly toastVisible = signal(false);

  ngOnInit(): void {
    // Service detail uses a flat slug (not categorySlug/itemSlug), so use '' as category
    const serviceSlug = this.route.snapshot.paramMap.get('serviceSlug') ?? '';
    this.catalogService.getItemDetail('', serviceSlug).subscribe({
      next: (d) => { this.item.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onBookNow(): void {
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
