import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent } from '@shared/ui';
import { TenantConfigService } from '../../../core/services/tenant-config.service';
import { WishlistService, WishlistItem } from '../../../core/services/wishlist.service';

@Component({
  selector: 'sf-account-wishlist',
  standalone: true,
  imports: [RouterLink, TranslateModule, SkeletonComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wishlist">
      <h1 class="wishlist__title">{{ 'account.wishlist_title' | translate }}</h1>

      @if (!isRetail()) {
        <div class="wishlist__unavailable">
          <svg class="wishlist__unavailable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p class="wishlist__unavailable-text">{{ 'account.wishlist_not_available' | translate }}</p>
        </div>
      } @else if (loading()) {
        <!-- Loading skeleton -->
        <div class="wishlist__grid">
          @for (_ of skeletons; track $index) {
            <div class="wishlist__skeleton-card">
              <ui-skeleton variant="block" height="180px" />
              <div class="wishlist__skeleton-body">
                <ui-skeleton variant="text" width="75%" />
                <ui-skeleton variant="text" width="40%" />
                <ui-skeleton variant="text" width="60%" />
              </div>
            </div>
          }
        </div>
      } @else if (items().length === 0) {
        <!-- Empty state -->
        <div class="wishlist__empty">
          <svg class="wishlist__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p class="wishlist__empty-title">{{ 'account.no_wishlist' | translate }}</p>
          <p class="wishlist__empty-sub">{{ 'account.no_wishlist_sub' | translate }}</p>
          <a class="wishlist__cta" [routerLink]="['/', activeLang(), 'shop']">
            {{ 'home.shop_now' | translate }}
          </a>
        </div>
      } @else {
        <!-- Wishlist items grid -->
        <div class="wishlist__grid">
          @for (item of items(); track item.id) {
            <div class="wishlist__card">
              <a
                class="wishlist__card-img-wrap"
                [routerLink]="['/', activeLang(), 'shop', item.categorySlug, item.slug]"
                [attr.aria-label]="activeLang() === 'ar' ? item.productNameAr : item.productNameEn"
              >
                @if (item.imageUrl) {
                  <img
                    class="wishlist__card-img"
                    [src]="item.imageUrl"
                    [alt]="activeLang() === 'ar' ? item.productNameAr : item.productNameEn"
                    loading="lazy"
                  />
                } @else {
                  <div class="wishlist__card-img-placeholder" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                }
              </a>

              <div class="wishlist__card-body">
                <a
                  class="wishlist__card-name"
                  [routerLink]="['/', activeLang(), 'shop', item.categorySlug, item.slug]"
                >
                  {{ activeLang() === 'ar' ? item.productNameAr : item.productNameEn }}
                </a>
                <p class="wishlist__card-price">
                  {{ item.price | number:'1.3-3' }} {{ 'common.currency' | translate }}
                </p>

                <div class="wishlist__card-actions">
                  <button
                    class="wishlist__card-btn wishlist__card-btn--primary"
                    type="button"
                    [disabled]="movingToCart().has(item.productId)"
                    (click)="onMoveToCart(item)"
                  >
                    @if (movingToCart().has(item.productId)) {
                      {{ 'common.loading' | translate }}
                    } @else {
                      {{ 'account.wishlist_move_to_cart' | translate }}
                    }
                  </button>
                  <button
                    class="wishlist__card-btn wishlist__card-btn--ghost"
                    type="button"
                    [attr.aria-label]="'common.remove' | translate"
                    (click)="onRemove(item)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>

                @if (errors().has(item.productId)) {
                  <p class="wishlist__card-error" role="alert">
                    {{ errors().get(item.productId) }}
                  </p>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .wishlist {
        padding-block-end: 2rem;
      }

      .wishlist__title {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        margin-block-end: 1.5rem;
        letter-spacing: -0.02em;
      }

      /* Unavailable state */
      .wishlist__unavailable {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-block: 4rem;
        text-align: center;
        gap: 1rem;
      }

      .wishlist__unavailable-icon {
        inline-size: 4rem;
        block-size: 4rem;
        color: var(--color-outline-variant, #d6c4ad);
      }

      .wishlist__unavailable-text {
        font-size: 1rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.65;
        margin: 0;
        max-inline-size: 22rem;
      }

      /* Empty state */
      .wishlist__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-block: 4rem;
        text-align: center;
        gap: 0.75rem;
      }

      .wishlist__empty-icon {
        inline-size: 4rem;
        block-size: 4rem;
        color: var(--color-outline-variant, #d6c4ad);
        margin-block-end: 0.5rem;
      }

      .wishlist__empty-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
      }

      .wishlist__empty-sub {
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.6;
        margin: 0;
      }

      .wishlist__cta {
        margin-block-start: 0.5rem;
        display: inline-block;
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        padding-block: 0.625rem;
        padding-inline: 1.5rem;
        border-radius: var(--border-radius-full, 9999px);
        font-size: 0.875rem;
        font-weight: 700;
        text-decoration: none;
        transition: opacity 0.2s;
      }
      .wishlist__cta:hover { opacity: 0.9; }

      /* Skeleton grid */
      .wishlist__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.25rem;
      }

      .wishlist__skeleton-card {
        background: var(--color-surface, #ffffff);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
      }

      .wishlist__skeleton-body {
        padding: 0.875rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      /* Wishlist card */
      .wishlist__card {
        background: var(--color-surface, #ffffff);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        display: flex;
        flex-direction: column;
        transition: box-shadow 0.2s, border-color 0.2s;
      }
      .wishlist__card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        border-color: var(--color-primary, #805600);
      }

      .wishlist__card-img-wrap {
        display: block;
        aspect-ratio: 4 / 3;
        overflow: hidden;
        background: var(--color-surface-container, #f4ede5);
      }

      .wishlist__card-img {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
        transition: transform 0.3s;
      }
      .wishlist__card:hover .wishlist__card-img { transform: scale(1.04); }

      .wishlist__card-img-placeholder {
        inline-size: 100%;
        block-size: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-outline-variant, #d6c4ad);
      }
      .wishlist__card-img-placeholder svg {
        inline-size: 3rem;
        block-size: 3rem;
      }

      .wishlist__card-body {
        padding: 0.875rem;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        flex: 1;
      }

      .wishlist__card-name {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
        text-decoration: none;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        transition: color 0.15s;
      }
      .wishlist__card-name:hover { color: var(--color-primary, #805600); }

      .wishlist__card-price {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-primary, #805600);
        margin: 0 0 0.25rem;
      }

      .wishlist__card-actions {
        display: flex;
        gap: 0.5rem;
        margin-block-start: 0.25rem;
      }

      .wishlist__card-btn {
        flex: 1;
        padding-block: 0.5rem;
        padding-inline: 0.75rem;
        border-radius: 8px;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.15s, color 0.15s, opacity 0.15s;
        border: 1px solid transparent;
      }
      .wishlist__card-btn:disabled { opacity: 0.6; cursor: not-allowed; }

      .wishlist__card-btn--primary {
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        border-color: var(--color-primary, #805600);
      }
      .wishlist__card-btn--primary:hover:not(:disabled) {
        opacity: 0.88;
      }

      .wishlist__card-btn--ghost {
        flex: 0;
        padding-inline: 0.625rem;
        background: transparent;
        border-color: var(--color-outline-variant, #d6c4ad);
        color: var(--color-error, #dc2626);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .wishlist__card-btn--ghost svg {
        inline-size: 1rem;
        block-size: 1rem;
      }
      .wishlist__card-btn--ghost:hover:not(:disabled) {
        background: color-mix(in srgb, var(--color-error, #dc2626) 10%, transparent);
        border-color: var(--color-error, #dc2626);
      }

      .wishlist__card-error {
        font-size: 0.75rem;
        color: var(--color-error, #dc2626);
        margin: 0;
      }
    `,
  ],
})
export class AccountWishlistComponent implements OnInit {
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly lang = inject(LanguageToggleService);
  private readonly wishlistService = inject(WishlistService);

  readonly activeLang = this.lang.current;
  readonly isRetail = computed(
    () => this.tenantConfig.config()?.businessType === 'retail',
  );

  readonly loading = signal(false);
  readonly items = signal<WishlistItem[]>([]);
  readonly movingToCart = signal<Set<string>>(new Set());
  readonly errors = signal<Map<string, string>>(new Map());
  readonly skeletons = new Array(4);

  ngOnInit(): void {
    if (!this.isRetail()) return;
    this.loadWishlist();
  }

  private loadWishlist(): void {
    this.loading.set(true);
    this.wishlistService.getWishlist().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onRemove(item: WishlistItem): void {
    // Optimistic removal
    this.items.update((prev) => prev.filter((i) => i.productId !== item.productId));

    this.wishlistService.removeItem(item.productId).subscribe({
      error: () => {
        // Restore item on failure
        this.items.update((prev) => [item, ...prev]);
      },
    });
  }

  onMoveToCart(item: WishlistItem): void {
    const moving = new Set(this.movingToCart());
    moving.add(item.productId);
    this.movingToCart.set(moving);

    this.wishlistService.moveToCart(item.productId, 1).subscribe({
      next: () => {
        // Remove from wishlist after successful move
        this.items.update((prev) => prev.filter((i) => i.productId !== item.productId));
        const m = new Set(this.movingToCart());
        m.delete(item.productId);
        this.movingToCart.set(m);
      },
      error: () => {
        const m = new Set(this.movingToCart());
        m.delete(item.productId);
        this.movingToCart.set(m);
        const e = new Map(this.errors());
        e.set(item.productId, 'Failed to move to cart. Please try again.');
        this.errors.set(e);
      },
    });
  }
}
