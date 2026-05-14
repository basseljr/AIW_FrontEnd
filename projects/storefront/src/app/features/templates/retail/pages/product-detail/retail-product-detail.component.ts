import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent, EmptyStateComponent } from '@shared/ui';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { CartService } from '../../../../../core/services/cart.service';
import {
  CatalogItemDetail,
  ProductVariant,
  CartItem,
} from '../../../../../core/models/catalog.model';
import { ImageGalleryComponent } from '../../../../shared-catalog/image-gallery/image-gallery.component';
import { RetailVariantSelectorComponent } from '../../components/variant-selector/retail-variant-selector.component';

@Component({
  selector: 'sf-retail-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    DecimalPipe,
    SkeletonComponent,
    EmptyStateComponent,
    ImageGalleryComponent,
    RetailVariantSelectorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-product-detail">
      <div class="sf-product-detail__inner">
        <nav class="sf-product-detail__breadcrumb" aria-label="Breadcrumb">
          <a [routerLink]="['/', lang(), '']">Home</a>
          <span aria-hidden="true">/</span>
          <a [routerLink]="['/', lang(), 'shop']">{{ 'nav.products' | translate }}</a>
          @if (item()) {
            <span aria-hidden="true">/</span>
            <span aria-current="page">{{ lang() === 'ar' ? item()!.nameAr : item()!.nameEn }}</span>
          }
        </nav>

        @if (loading()) {
          <div class="sf-product-detail__layout">
            <ui-skeleton variant="block" height="400px" />
            <div style="display:flex;flex-direction:column;gap:1rem">
              <ui-skeleton variant="text" height="2rem" width="80%" />
              <ui-skeleton variant="text" width="50%" />
              <ui-skeleton variant="text" />
              <ui-skeleton variant="text" />
            </div>
          </div>
        } @else if (!item()) {
          <ui-empty-state icon="🔍" [title]="'errors.not_found' | translate" />
        } @else {
          <div class="sf-product-detail__layout">
            <sf-image-gallery [images]="item()!.images ?? []" [altText]="lang() === 'ar' ? item()!.nameAr : item()!.nameEn" />

            <div class="sf-product-detail__info">
              <h1 class="sf-product-detail__name">{{ lang() === 'ar' ? item()!.nameAr : item()!.nameEn }}</h1>

              @if (item()!.descriptionEn || item()!.descriptionAr) {
                <p class="sf-product-detail__desc">{{ lang() === 'ar' ? item()!.descriptionAr : item()!.descriptionEn }}</p>
              }

              <div class="sf-product-detail__price-row">
                <span class="sf-product-detail__price">
                  {{ effectivePrice() | number: '1.3-3' }} {{ 'common.currency' | translate }}
                </span>
                @if (item()!.compareAtPrice) {
                  <span class="sf-product-detail__compare">{{ item()!.compareAtPrice | number: '1.3-3' }}</span>
                }
              </div>

              @if (item()!.hasVariants && (item()!.variants?.length ?? 0) > 0) {
                <sf-retail-variant-selector
                  [variants]="item()!.variants!"
                  [selectedVariantId]="selectedVariantId()"
                  [lang]="lang()"
                  (variantSelected)="onVariantSelected($event)"
                />
              }

              <div class="sf-product-detail__qty">
                <button class="sf-product-detail__qty-btn" type="button" (click)="decreaseQty()" [disabled]="quantity() <= 1">−</button>
                <span class="sf-product-detail__qty-val">{{ quantity() }}</span>
                <button class="sf-product-detail__qty-btn" type="button" (click)="increaseQty()">+</button>
              </div>

              @if (item()!.hasVariants) {
                @if (!selectedVariantId()) {
                  <p class="sf-product-detail__variant-hint">{{ 'variants.select_all_options' | translate }}</p>
                }
              }

              <button
                class="sf-product-detail__add-btn"
                type="button"
                [disabled]="!canAddToCart()"
                (click)="addToCart()"
              >
                {{ 'catalog.add_to_cart' | translate }}
              </button>

              <textarea
                class="sf-product-detail__instructions"
                [placeholder]="'item_detail.special_instructions_placeholder' | translate"
                maxlength="500"
                rows="3"
                (input)="onInstructions($event)"
              ></textarea>

              <a class="sf-product-detail__back-link" [routerLink]="['/', lang(), 'shop']">
                ← {{ 'item_detail.back_to_shop' | translate }}
              </a>
            </div>
          </div>
        }
      </div>
    </div>

    @if (toastVisible()) {
      <div class="sf-product-detail__toast" role="status" aria-live="polite">
        ✓ {{ 'item_detail.added_to_cart' | translate }}
      </div>
    }
  `,
  styles: [
    `
      .sf-product-detail {
        background: var(--color-background, #fff8f1);
        min-block-size: 80vh;
        padding-block: 2rem;
        padding-inline: 1.5rem;
      }
      .sf-product-detail__inner { max-inline-size: 80rem; margin-inline: auto; }
      .sf-product-detail__breadcrumb {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        font-size: 0.8125rem;
        color: var(--color-on-surface-variant, #514534);
        margin-block-end: 1.5rem;
      }
      .sf-product-detail__breadcrumb a { color: var(--color-primary, #805600); text-decoration: none; }
      .sf-product-detail__breadcrumb a:hover { text-decoration: underline; }

      .sf-product-detail__layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2.5rem;
      }
      @media (min-width: 768px) { .sf-product-detail__layout { grid-template-columns: 1fr 1fr; } }

      .sf-product-detail__info { display: flex; flex-direction: column; gap: 1rem; }
      .sf-product-detail__name {
        font-size: clamp(1.5rem, 3vw, 2rem);
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
        letter-spacing: -0.02em;
      }
      .sf-product-detail__desc { font-size: 1rem; color: var(--color-on-surface-variant, #514534); line-height: 1.7; margin: 0; }
      .sf-product-detail__price-row { display: flex; align-items: center; gap: 0.75rem; }
      .sf-product-detail__price { font-size: 1.625rem; font-weight: 900; color: var(--color-primary-container, #f2a922); }
      .sf-product-detail__compare { font-size: 1rem; color: var(--color-on-surface-variant, #514534); text-decoration: line-through; }

      .sf-product-detail__qty { display: flex; align-items: center; gap: 0.5rem; }
      .sf-product-detail__qty-btn {
        inline-size: 2.25rem;
        block-size: 2.25rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 50%;
        background: var(--color-surface, #ffffff);
        color: var(--color-primary, #805600);
        font-size: 1.125rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: border-color 0.15s;
      }
      .sf-product-detail__qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .sf-product-detail__qty-btn:hover:not(:disabled) { border-color: var(--color-primary, #805600); }
      .sf-product-detail__qty-val { font-size: 1rem; font-weight: 700; min-inline-size: 1.5rem; text-align: center; }

      .sf-product-detail__variant-hint { font-size: 0.8125rem; color: var(--color-on-surface-variant, #514534); margin: 0; }

      .sf-product-detail__add-btn {
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
      .sf-product-detail__add-btn:hover:not(:disabled) {
        background: var(--color-primary-container, #f2a922);
        color: var(--color-on-primary-container, #634100);
      }
      .sf-product-detail__add-btn:disabled { opacity: 0.45; cursor: not-allowed; }

      .sf-product-detail__instructions {
        inline-size: 100%;
        padding: 0.625rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 10px;
        background: var(--color-surface, #ffffff);
        color: var(--color-on-surface, #1e1b17);
        font-size: 0.875rem;
        font-family: inherit;
        resize: vertical;
      }
      .sf-product-detail__instructions:focus { outline: none; border-color: var(--color-primary, #805600); }

      .sf-product-detail__back-link { display: inline-flex; align-items: center; gap: 0.375rem; color: var(--color-primary, #805600); font-size: 0.875rem; font-weight: 600; text-decoration: none; }
      .sf-product-detail__back-link:hover { text-decoration: underline; }

      .sf-product-detail__toast {
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
        from { opacity: 0; transform: translateX(-50%) translateY(12px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `,
  ],
})
export class RetailProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly langToggle = inject(LanguageToggleService);

  readonly lang = this.langToggle.current;
  readonly loading = signal(true);
  readonly item = signal<CatalogItemDetail | null>(null);
  readonly selectedVariantId = signal<string | null>(null);
  readonly quantity = signal(1);
  readonly specialInstructions = signal('');
  readonly toastVisible = signal(false);

  readonly effectivePrice = computed(() => {
    const it = this.item();
    if (!it) return 0;
    if (this.selectedVariantId()) {
      const variant = it.variants?.find((v) => v.id === this.selectedVariantId());
      return variant?.price ?? it.price;
    }
    return it.price;
  });

  readonly canAddToCart = computed(() => {
    const it = this.item();
    if (!it) return false;
    if (it.hasVariants) return !!this.selectedVariantId();
    return it.isAvailable;
  });

  ngOnInit(): void {
    const categorySlug = this.route.snapshot.paramMap.get('categorySlug') ?? '';
    const productSlug = this.route.snapshot.paramMap.get('productSlug') ?? '';
    this.catalogService.getItemDetail(categorySlug, productSlug).subscribe({
      next: (d) => { this.item.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onVariantSelected(variant: ProductVariant): void {
    this.selectedVariantId.set(variant.id);
  }

  increaseQty(): void { this.quantity.update((q) => q + 1); }
  decreaseQty(): void { this.quantity.update((q) => Math.max(1, q - 1)); }
  onInstructions(event: Event): void { this.specialInstructions.set((event.target as HTMLTextAreaElement).value); }

  addToCart(): void {
    const it = this.item();
    if (!it || !this.canAddToCart()) return;
    const variant = it.variants?.find((v) => v.id === this.selectedVariantId());
    const cartItem: CartItem = {
      itemId: it.id,
      slug: it.slug,
      categorySlug: it.categorySlug,
      nameEn: it.nameEn,
      nameAr: it.nameAr,
      imageUrl: it.imageUrl,
      price: this.effectivePrice(),
      quantity: this.quantity(),
      selectedVariantId: this.selectedVariantId() ?? undefined,
      variantLabel: variant?.attributes.map((a) => a.valueEn).join(' / '),
      specialInstructions: this.specialInstructions(),
    };
    this.cartService.addItem(cartItem);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2500);
  }
}
