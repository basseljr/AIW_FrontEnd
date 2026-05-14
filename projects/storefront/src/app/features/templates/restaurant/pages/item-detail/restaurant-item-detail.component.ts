import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent, EmptyStateComponent } from '@shared/ui';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { CartService } from '../../../../../core/services/cart.service';
import {
  CatalogItemDetail,
  SelectedModifier,
  CartItem,
} from '../../../../../core/models/catalog.model';
import { RestaurantModifierSelectorComponent, ModifierConfirmEvent } from '../../components/modifier-selector/restaurant-modifier-selector.component';
import { ImageGalleryComponent } from '../../../../shared-catalog/image-gallery/image-gallery.component';
import { RestaurantMenuItemCardComponent } from '../../components/menu-item-card/restaurant-menu-item-card.component';

@Component({
  selector: 'sf-restaurant-item-detail',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    DecimalPipe,
    SkeletonComponent,
    EmptyStateComponent,
    RestaurantModifierSelectorComponent,
    ImageGalleryComponent,
    RestaurantMenuItemCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-item-detail">
      <div class="sf-item-detail__inner">
        <!-- Breadcrumb -->
        <nav class="sf-item-detail__breadcrumb" aria-label="Breadcrumb">
          <a [routerLink]="['/', lang(), '']">Home</a>
          <span aria-hidden="true">/</span>
          <a [routerLink]="['/', lang(), 'menu']">{{ 'nav.menu' | translate }}</a>
          @if (item()) {
            <span aria-hidden="true">/</span>
            <span>{{ lang() === 'ar' ? item()!.categoryNameAr : item()!.categoryNameEn }}</span>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{{ lang() === 'ar' ? item()!.nameAr : item()!.nameEn }}</span>
          }
        </nav>

        @if (loading()) {
          <div class="sf-item-detail__layout">
            <div>
              <ui-skeleton variant="block" height="400px" />
            </div>
            <div class="sf-item-detail__info">
              <ui-skeleton variant="text" height="2rem" width="80%" />
              <ui-skeleton variant="text" width="60%" />
              <ui-skeleton variant="text" />
              <ui-skeleton variant="text" />
            </div>
          </div>
        } @else if (!item()) {
          <ui-empty-state
            icon="🔍"
            [title]="'errors.not_found' | translate"
          />
        } @else {
          <div class="sf-item-detail__layout">
            <!-- Gallery -->
            <div class="sf-item-detail__gallery">
              <sf-image-gallery
                [images]="item()!.images ?? []"
                [altText]="lang() === 'ar' ? item()!.nameAr : item()!.nameEn"
              />
            </div>

            <!-- Info -->
            <div class="sf-item-detail__info">
              <h1 class="sf-item-detail__name">
                {{ lang() === 'ar' ? item()!.nameAr : item()!.nameEn }}
              </h1>

              @if (item()!.descriptionEn || item()!.descriptionAr) {
                <p class="sf-item-detail__desc">
                  {{ lang() === 'ar' ? item()!.descriptionAr : item()!.descriptionEn }}
                </p>
              }

              <div class="sf-item-detail__price-row">
                <span class="sf-item-detail__price">
                  {{ item()!.price | number: '1.3-3' }} {{ 'common.currency' | translate }}
                </span>
                @if (!item()!.isAvailable) {
                  <span class="sf-item-detail__oos">{{ 'catalog.out_of_stock' | translate }}</span>
                }
              </div>

              @if (item()!.isAvailable) {
                <button
                  class="sf-item-detail__add-btn"
                  type="button"
                  (click)="openModifiers()"
                >
                  {{ 'catalog.add_to_cart' | translate }}
                </button>
              }

              <a class="sf-item-detail__back-link" [routerLink]="['/', lang(), 'menu']">
                ← {{ 'item_detail.back_to_menu' | translate }}
              </a>
            </div>
          </div>

          <!-- Related items -->
          @if (item()!.relatedItems && item()!.relatedItems!.length > 0) {
            <section class="sf-item-detail__related">
              <h2 class="sf-item-detail__related-title">{{ 'item_detail.related_items' | translate }}</h2>
              <div class="sf-item-detail__related-grid">
                @for (rel of item()!.relatedItems!; track rel.id) {
                  <sf-restaurant-menu-item-card
                    [item]="rel"
                    [lang]="lang()"
                    (viewItem)="navigateTo($event)"
                  />
                }
              </div>
            </section>
          }
        }
      </div>
    </div>

    <!-- Modifier selector modal -->
    <sf-restaurant-modifier-selector
      [item]="item()"
      [open]="modifierOpen()"
      [lang]="lang()"
      (confirm)="onConfirm($event)"
      (closed)="modifierOpen.set(false)"
    />

    <!-- Added to cart toast -->
    @if (toastVisible()) {
      <div class="sf-item-detail__toast" role="status" aria-live="polite">
        ✓ {{ 'item_detail.added_to_cart' | translate }}
      </div>
    }
  `,
  styles: [
    `
      .sf-item-detail {
        background: var(--color-background, #fff8f1);
        min-block-size: 80vh;
        padding-block: 2rem;
        padding-inline: 1.5rem;
      }
      .sf-item-detail__inner {
        max-inline-size: 80rem;
        margin-inline: auto;
      }

      .sf-item-detail__breadcrumb {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        font-size: 0.8125rem;
        color: var(--color-on-surface-variant, #514534);
        margin-block-end: 1.5rem;
      }
      .sf-item-detail__breadcrumb a {
        color: var(--color-primary, #805600);
        text-decoration: none;
      }
      .sf-item-detail__breadcrumb a:hover {
        text-decoration: underline;
      }

      .sf-item-detail__layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2.5rem;
      }
      @media (min-width: 768px) {
        .sf-item-detail__layout {
          grid-template-columns: 1fr 1fr;
        }
      }

      .sf-item-detail__gallery {
        border-radius: 16px;
        overflow: hidden;
      }

      .sf-item-detail__info {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .sf-item-detail__name {
        font-size: clamp(1.75rem, 3vw, 2.25rem);
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
        letter-spacing: -0.02em;
      }
      .sf-item-detail__desc {
        font-size: 1rem;
        color: var(--color-on-surface-variant, #514534);
        line-height: 1.7;
        margin: 0;
      }
      .sf-item-detail__price-row {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .sf-item-detail__price {
        font-size: 1.75rem;
        font-weight: 900;
        color: var(--color-primary-container, #f2a922);
      }
      .sf-item-detail__oos {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--color-error, #dc2626);
        padding-block: 0.25rem;
        padding-inline: 0.75rem;
        background: rgba(220, 38, 38, 0.1);
        border-radius: 9999px;
      }

      .sf-item-detail__add-btn {
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
      .sf-item-detail__add-btn:hover {
        background: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }

      .sf-item-detail__back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        color: var(--color-primary, #805600);
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
        margin-block-start: 0.5rem;
      }
      .sf-item-detail__back-link:hover {
        text-decoration: underline;
      }

      /* Related */
      .sf-item-detail__related {
        margin-block-start: 3rem;
        padding-block-start: 2rem;
        border-block-start: 1px solid var(--color-outline-variant, #d6c4ad);
      }
      .sf-item-detail__related-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-primary, #805600);
        margin: 0 0 1.25rem;
      }
      .sf-item-detail__related-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.25rem;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        padding-block-end: 0.5rem;
      }

      /* Toast */
      .sf-item-detail__toast {
        position: fixed;
        inset-block-end: 2rem;
        inset-inline-start: 50%;
        transform: translateX(-50%);
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        padding-block: 0.75rem;
        padding-inline: 1.5rem;
        border-radius: 9999px;
        font-size: 0.9375rem;
        font-weight: 600;
        z-index: 500;
        animation: sf-toast-in 0.3s ease;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
        white-space: nowrap;
      }
      @keyframes sf-toast-in {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `,
  ],
})
export class RestaurantItemDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly langToggle = inject(LanguageToggleService);

  readonly lang = this.langToggle.current;
  readonly loading = signal(true);
  readonly item = signal<CatalogItemDetail | null>(null);
  readonly modifierOpen = signal(false);
  readonly toastVisible = signal(false);

  ngOnInit(): void {
    const categorySlug = this.route.snapshot.paramMap.get('categorySlug') ?? '';
    const itemSlug = this.route.snapshot.paramMap.get('itemSlug') ?? '';

    this.catalogService.getItemDetail(categorySlug, itemSlug).subscribe({
      next: (detail) => {
        this.item.set(detail);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openModifiers(): void {
    this.modifierOpen.set(true);
  }

  onConfirm(event: ModifierConfirmEvent): void {
    const it = this.item();
    if (!it) return;

    const cartItem: CartItem = {
      itemId: it.id,
      slug: it.slug,
      categorySlug: it.categorySlug,
      nameEn: it.nameEn,
      nameAr: it.nameAr,
      imageUrl: it.imageUrl,
      price: it.price,
      quantity: event.quantity,
      selectedModifiers: event.modifiers,
      specialInstructions: event.instructions,
    };
    this.cartService.addItem(cartItem);
    this.modifierOpen.set(false);
    this.showToast();
  }

  private showToast(): void {
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2500);
  }

  navigateTo(item: { slug: string; categorySlug: string }): void {
    this.router.navigate(['/', this.lang(), 'menu', item.categorySlug, item.slug]);
  }
}
