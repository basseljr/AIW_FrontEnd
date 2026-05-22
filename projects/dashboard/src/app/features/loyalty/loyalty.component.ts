import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { LoyaltyService } from '../../core/services/loyalty.service';
import { LoyaltySettings } from '../../core/models/settings.model';

@Component({
  selector: 'db-loyalty',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-loy">
      <header class="db-loy__header">
        <h1 class="db-loy__title">{{ 'loyalty.title' | translate }}</h1>
      </header>

      <!-- Feature not enabled -->
      @if (!loading() && featureDisabled()) {
        <div class="db-loy__disabled" role="status">
          <div class="db-loy__disabled-icon" aria-hidden="true">⭐</div>
          <h2 class="db-loy__disabled-title">{{ 'loyalty.not_enabled' | translate }}</h2>
          <p class="db-loy__disabled-hint">{{ 'loyalty.not_enabled_hint' | translate }}</p>
        </div>
      }

      @if (!loading() && !featureDisabled()) {
        <!-- Summary Cards -->
        <div class="db-loy__cards">
          <div class="db-loy__card">
            <p class="db-loy__card-label">{{ 'loyalty.card_members' | translate }}</p>
            <p class="db-loy__card-value">—</p>
          </div>
          <div class="db-loy__card">
            <p class="db-loy__card-label">{{ 'loyalty.card_issued' | translate }}</p>
            <p class="db-loy__card-value">—</p>
          </div>
          <div class="db-loy__card">
            <p class="db-loy__card-label">{{ 'loyalty.card_redeemed' | translate }}</p>
            <p class="db-loy__card-value">—</p>
          </div>
          <div class="db-loy__card">
            <p class="db-loy__card-label">{{ 'loyalty.card_outstanding' | translate }}</p>
            <p class="db-loy__card-value">—</p>
          </div>
        </div>

        <!-- Settings Form -->
        <div class="db-loy__form-card">
          @if (loadError()) {
            <div class="db-loy__error-banner" role="alert">
              {{ 'loyalty.error' | translate }}
              <button class="db-loy__error-close" type="button" (click)="load()">{{ 'common.retry' | translate }}</button>
            </div>
          }

          @if (successMsg()) {
            <div class="db-loy__success-banner" role="status">
              {{ 'loyalty.save_success' | translate }}
            </div>
          }

          @if (saveError()) {
            <div class="db-loy__error-banner" role="alert">
              {{ saveError() }}
            </div>
          }

          <div class="db-loy__field">
            <label class="db-loy__label" for="earn-rate">{{ 'loyalty.field_earn_rate' | translate }}</label>
            <input
              id="earn-rate"
              class="db-loy__input"
              type="number"
              min="0"
              step="0.01"
              [ngModel]="earnRate"
              (ngModelChange)="earnRate = +$event"
            />
          </div>

          <div class="db-loy__field">
            <label class="db-loy__label" for="redeem-rate">{{ 'loyalty.field_redeem_rate' | translate }}</label>
            <input
              id="redeem-rate"
              class="db-loy__input"
              type="number"
              min="0"
              step="1"
              [ngModel]="redeemRate"
              (ngModelChange)="redeemRate = +$event"
            />
          </div>

          <div class="db-loy__field">
            <label class="db-loy__label" for="min-redeem">{{ 'loyalty.field_min_redeem' | translate }}</label>
            <input
              id="min-redeem"
              class="db-loy__input"
              type="number"
              min="0"
              step="1"
              [ngModel]="minRedeemPoints"
              (ngModelChange)="minRedeemPoints = +$event"
            />
          </div>

          <button
            class="db-loy__save-btn"
            type="button"
            [disabled]="saving()"
            (click)="save()"
          >
            @if (saving()) {
              <span class="db-loy__spinner" aria-hidden="true"></span>
            }
            {{ 'loyalty.save_btn' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .db-loy {
      padding-block: var(--space-xl, 2rem);
      padding-inline: var(--space-xl, 2rem);
      max-inline-size: 720px;
    }

    .db-loy__header { margin-block-end: 1.5rem; }

    .db-loy__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-loy__disabled {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-block: 4rem;
      text-align: center;
      gap: 0.75rem;
    }

    .db-loy__disabled-icon { font-size: 3rem; line-height: 1; }

    .db-loy__disabled-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-loy__disabled-hint {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
      max-inline-size: 40ch;
      line-height: 1.6;
    }

    .db-loy__cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
      margin-block-end: 1.5rem;
    }

    .db-loy__card {
      padding: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
    }

    .db-loy__card-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 0.375rem;
    }

    .db-loy__card-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-loy__form-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .db-loy__error-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-control);
      color: var(--error);
      font-size: 0.875rem;
    }

    .db-loy__error-close {
      background: transparent;
      border: none;
      color: var(--error);
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
    }

    .db-loy__success-banner {
      padding: 0.875rem 1rem;
      background: color-mix(in srgb, var(--success) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
      border-radius: var(--radius-control);
      color: var(--success);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .db-loy__field { display: flex; flex-direction: column; gap: 0.375rem; }

    .db-loy__label { font-size: 0.875rem; font-weight: 600; color: var(--text); }

    .db-loy__input {
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.5rem;
      padding-inline: 0.75rem;
      outline: none;
      block-size: 38px;
      box-sizing: border-box;
      transition: border-color var(--motion-base) ease;
      max-inline-size: 200px;
    }

    .db-loy__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-loy__save-btn {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding-block: 0.5rem;
      padding-inline: 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      background: var(--accent);
      color: var(--on-accent);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-base) ease;
    }

    .db-loy__save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .db-loy__save-btn:hover:not(:disabled) { background: var(--accent-hover); }

    .db-loy__spinner {
      display: inline-block;
      inline-size: 14px;
      block-size: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-block-start-color: var(--on-accent);
      border-radius: 50%;
      animation: db-loy-spin 0.7s linear infinite;
    }

    @keyframes db-loy-spin { to { transform: rotate(360deg); } }
  `],
})
export class LoyaltyComponent implements OnInit {
  private readonly loyaltyService = inject(LoyaltyService);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly featureDisabled = signal(false);
  readonly saving = signal(false);
  readonly successMsg = signal(false);
  readonly saveError = signal<string | null>(null);

  earnRate = 0;
  redeemRate = 0;
  minRedeemPoints = 0;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.loyaltyService.getSettings().subscribe({
      next: (data) => {
        this.earnRate = data.earnRate;
        this.redeemRate = data.redeemRate;
        this.minRedeemPoints = data.minRedeemPoints;
        this.featureDisabled.set(false);
        this.loading.set(false);
      },
      error: (err) => {
        if (err.status === 403 || err.status === 404) {
          this.featureDisabled.set(true);
          this.loading.set(false);
        } else {
          this.loadError.set(true);
          this.loading.set(false);
        }
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.saveError.set(null);
    this.successMsg.set(false);

    const body: LoyaltySettings = {
      earnRate: this.earnRate,
      redeemRate: this.redeemRate,
      minRedeemPoints: this.minRedeemPoints,
    };

    this.loyaltyService.updateSettings(body).subscribe({
      next: (data) => {
        this.earnRate = data.earnRate;
        this.redeemRate = data.redeemRate;
        this.minRedeemPoints = data.minRedeemPoints;
        this.saving.set(false);
        this.successMsg.set(true);
        setTimeout(() => this.successMsg.set(false), 3000);
      },
      error: (err) => {
        this.saveError.set(err?.error?.message ?? 'Failed to save settings.');
        this.saving.set(false);
      },
    });
  }
}
