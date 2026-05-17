import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { TenantConfigService } from '../../../core/services/tenant-config.service';

@Component({
  selector: 'sf-account-wishlist',
  standalone: true,
  imports: [RouterLink, TranslateModule],
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
      } @else {
        <!-- Retail: empty state (no wishlist API yet) -->
        <div class="wishlist__empty">
          <svg class="wishlist__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p class="wishlist__empty-title">{{ 'account.no_wishlist' | translate }}</p>
          <p class="wishlist__empty-sub">{{ 'account.no_wishlist_sub' | translate }}</p>
          <a class="wishlist__cta" [routerLink]="['/', activeLang(), '']">
            {{ 'home.shop_now' | translate }}
          </a>
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
    `,
  ],
})
export class AccountWishlistComponent {
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly lang = inject(LanguageToggleService);

  readonly activeLang = this.lang.current;
  readonly isRetail = computed(
    () => this.tenantConfig.config()?.businessType === 'retail',
  );
}
