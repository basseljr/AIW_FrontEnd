import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'sf-account-loyalty',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loyalty">
      <h1 class="loyalty__title">{{ 'account.loyalty_title' | translate }}</h1>

      <!-- Points balance card -->
      <div class="loyalty__balance-card">
        <div class="loyalty__balance-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        </div>
        <div class="loyalty__balance-content">
          <span class="loyalty__balance-label">{{ 'account.loyalty_balance' | translate }}</span>
          <span class="loyalty__balance-value">{{ 'account.loyalty_pts' | translate: { count: 0 } }}</span>
        </div>
      </div>

      <!-- Empty state -->
      <div class="loyalty__empty">
        <svg class="loyalty__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="8" r="6"/>
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
        <p class="loyalty__empty-title">{{ 'account.loyalty_no_points' | translate }}</p>
        <p class="loyalty__empty-sub">{{ 'account.loyalty_no_points_sub' | translate }}</p>
      </div>

      <!-- How it works -->
      <div class="loyalty__how">
        <h2 class="loyalty__how-title">{{ 'account.loyalty_how_title' | translate }}</h2>
        <div class="loyalty__how-grid">
          <div class="loyalty__how-card">
            <div class="loyalty__how-icon" aria-hidden="true">🛍️</div>
            <h3 class="loyalty__how-card-title">{{ 'account.loyalty_earn' | translate }}</h3>
            <p class="loyalty__how-card-desc">{{ 'account.loyalty_earn_desc' | translate }}</p>
          </div>
          <div class="loyalty__how-card">
            <div class="loyalty__how-icon" aria-hidden="true">🎁</div>
            <h3 class="loyalty__how-card-title">{{ 'account.loyalty_redeem' | translate }}</h3>
            <p class="loyalty__how-card-desc">{{ 'account.loyalty_redeem_desc' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loyalty { padding-block-end: 2rem; }
    .loyalty__title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-on-surface, #1e1b17);
      margin-block-end: 1.5rem;
      letter-spacing: -0.02em;
    }
    .loyalty__balance-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--color-primary);
      color: var(--color-on-primary, #fff);
      border-radius: var(--border-radius-md, 8px);
      padding: 1.5rem;
      margin-block-end: 1.5rem;
    }
    .loyalty__balance-icon svg {
      inline-size: 2.5rem;
      block-size: 2.5rem;
      opacity: 0.9;
    }
    .loyalty__balance-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .loyalty__balance-label {
      font-size: 0.875rem;
      opacity: 0.85;
    }
    .loyalty__balance-value {
      font-size: 2rem;
      font-weight: 800;
      line-height: 1;
    }
    .loyalty__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-block: 3rem;
      text-align: center;
      gap: 0.75rem;
      background: #fff;
      border: 1px solid var(--color-outline-variant, #d6c4ad);
      border-radius: var(--border-radius-md, 8px);
      margin-block-end: 2rem;
    }
    .loyalty__empty-icon {
      inline-size: 3rem;
      block-size: 3rem;
      color: var(--color-outline-variant, #d6c4ad);
    }
    .loyalty__empty-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-on-surface, #1e1b17);
      margin: 0;
    }
    .loyalty__empty-sub {
      font-size: 0.875rem;
      color: var(--color-on-surface, #1e1b17);
      opacity: 0.6;
      margin: 0;
    }
    .loyalty__how-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-on-surface, #1e1b17);
      margin: 0 0 1rem;
    }
    .loyalty__how-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
      gap: 1rem;
    }
    .loyalty__how-card {
      background: #fff;
      border: 1px solid var(--color-outline-variant, #d6c4ad);
      border-radius: var(--border-radius-md, 8px);
      padding: 1.25rem;
      text-align: center;
    }
    .loyalty__how-icon { font-size: 2rem; margin-block-end: 0.75rem; }
    .loyalty__how-card-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-on-surface, #1e1b17);
      margin: 0 0 0.375rem;
    }
    .loyalty__how-card-desc {
      font-size: 0.8125rem;
      color: var(--color-on-surface, #1e1b17);
      opacity: 0.7;
      line-height: 1.6;
      margin: 0;
    }
  `],
})
export class AccountLoyaltyComponent {}
