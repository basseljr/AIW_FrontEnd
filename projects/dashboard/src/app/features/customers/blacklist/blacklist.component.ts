import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CustomersService } from '../../../core/services/customers.service';
import { BlacklistedCustomer } from '../../../core/models/customer.model';

@Component({
  selector: 'db-blacklist',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-bl">
      <header class="db-bl__header">
        <div class="db-bl__header-left">
          <a class="db-bl__back" [routerLink]="['/customers']">← {{ 'customers.back_to_customers' | translate }}</a>
          <h1 class="db-bl__title">{{ 'customers.blacklist_page_title' | translate }}</h1>
        </div>
      </header>

      <!-- Add to Blacklist Form -->
      <div class="db-bl__add-form">
        <h2 class="db-bl__form-title">{{ 'customers.blacklist_add_btn' | translate }}</h2>
        <div class="db-bl__form-row">
          <div class="db-bl__form-group">
            <label class="db-bl__label" for="bl-customer-id">{{ 'customers.blacklist_customer_id' | translate }}</label>
            <input
              id="bl-customer-id"
              class="db-bl__input"
              type="text"
              [(ngModel)]="addCustomerId"
              placeholder="UUID..."
            />
          </div>
          <div class="db-bl__form-group">
            <label class="db-bl__label" for="bl-reason">{{ 'customers.blacklist_reason_label' | translate }}</label>
            <input
              id="bl-reason"
              class="db-bl__input"
              type="text"
              [(ngModel)]="addReason"
              [placeholder]="'customers.blacklist_reason_placeholder' | translate"
            />
          </div>
          <button
            class="db-bl__btn-primary"
            type="button"
            [disabled]="!addCustomerId || !addReason || addLoading()"
            (click)="addToBlacklist()"
          >{{ 'customers.blacklist_add_btn' | translate }}</button>
        </div>
        @if (addError()) {
          <p class="db-bl__form-error">{{ addError() }}</p>
        }
        @if (addSuccess()) {
          <p class="db-bl__form-success">{{ 'customers.blacklist_added_success' | translate }}</p>
        }
      </div>

      <!-- Table -->
      <div class="db-bl__table-wrap">
        <table class="db-bl__table" role="table">
          <thead class="db-bl__thead">
            <tr>
              <th class="db-bl__th" scope="col">{{ 'customers.blacklist_col_customer' | translate }}</th>
              <th class="db-bl__th" scope="col">{{ 'customers.blacklist_col_reason' | translate }}</th>
              <th class="db-bl__th" scope="col">{{ 'customers.blacklist_col_by' | translate }}</th>
              <th class="db-bl__th" scope="col">{{ 'customers.blacklist_col_date' | translate }}</th>
              <th class="db-bl__th db-bl__th--actions" scope="col">
                <span class="db-bl__sr">{{ 'customers.blacklist_col_actions' | translate }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="db-bl__tbody">
            @if (loading()) {
              @for (_ of [1, 2, 3]; track $index) {
                <tr class="db-bl__row" aria-hidden="true">
                  <td class="db-bl__td"><span class="db-bl__sk db-bl__sk--name"></span></td>
                  <td class="db-bl__td"><span class="db-bl__sk db-bl__sk--reason"></span></td>
                  <td class="db-bl__td"><span class="db-bl__sk db-bl__sk--name"></span></td>
                  <td class="db-bl__td"><span class="db-bl__sk db-bl__sk--date"></span></td>
                  <td class="db-bl__td db-bl__td--actions"></td>
                </tr>
              }
            }
            @if (!loading()) {
              @for (item of items(); track item.customerId) {
                <tr class="db-bl__row">
                  <td class="db-bl__td">
                    <p class="db-bl__customer-name">{{ item.name }}</p>
                    <p class="db-bl__customer-email">{{ item.email }}</p>
                  </td>
                  <td class="db-bl__td">
                    <span class="db-bl__reason">{{ item.reason }}</span>
                  </td>
                  <td class="db-bl__td">
                    <span class="db-bl__by">{{ item.blacklistedByName || '—' }}</span>
                  </td>
                  <td class="db-bl__td">
                    <span class="db-bl__date">{{ formatDate(item.blacklistedAt) }}</span>
                  </td>
                  <td class="db-bl__td db-bl__td--actions">
                    <button
                      class="db-bl__remove-btn"
                      type="button"
                      (click)="removeFromBlacklist(item.customerId)"
                    >{{ 'customers.blacklist_remove' | translate }}</button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>

        @if (!loading() && !error() && items().length === 0) {
          <div class="db-bl__empty" role="status">
            <p>{{ 'customers.no_blacklisted' | translate }}</p>
          </div>
        }

        @if (error() && !loading()) {
          <div class="db-bl__error" role="alert">
            <span>{{ 'customers.error' | translate }}</span>
            <button class="db-bl__retry" type="button" (click)="load()">
              {{ 'customers.retry' | translate }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .db-bl {
      padding-block: var(--space-xl, 2rem);
      padding-inline: var(--space-xl, 2rem);
    }

    .db-bl__header {
      margin-block-end: 1.5rem;
    }

    .db-bl__header-left { display: flex; flex-direction: column; gap: 0.375rem; }

    .db-bl__back {
      color: var(--accent);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .db-bl__back:hover { text-decoration: underline; }

    .db-bl__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-bl__add-form {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 1.25rem;
      margin-block-end: 1.5rem;
    }

    .db-bl__form-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.875rem;
    }

    .db-bl__form-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: flex-end;
    }

    .db-bl__form-group { display: flex; flex-direction: column; gap: 0.375rem; flex: 1; min-inline-size: 200px; }

    .db-bl__label { font-size: 0.8125rem; font-weight: 600; color: var(--text); }

    .db-bl__input {
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.5rem;
      padding-inline: 0.75rem;
      outline: none;
      block-size: 36px;
      box-sizing: border-box;
      transition: border-color var(--motion-base) ease;
    }

    .db-bl__input:focus { border-color: var(--accent); }

    .db-bl__btn-primary {
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
      block-size: 36px;
      white-space: nowrap;
      transition: background-color var(--motion-base) ease;
    }

    .db-bl__btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .db-bl__btn-primary:hover:not(:disabled) { background: var(--accent-hover); }

    .db-bl__form-error { color: var(--error); font-size: 0.875rem; margin: 0.5rem 0 0; }
    .db-bl__form-success { color: var(--success); font-size: 0.875rem; margin: 0.5rem 0 0; }

    .db-bl__table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow-x: auto;
    }

    .db-bl__table {
      inline-size: 100%;
      min-inline-size: 600px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-bl__thead { background: var(--surface-alt); border-block-end: 1px solid var(--border); }

    .db-bl__th {
      padding-block: 0.6875rem;
      padding-inline: 0.875rem 0.5rem;
      text-align: start;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .db-bl__th--actions { inline-size: 90px; }

    .db-bl__row {
      border-block-end: 1px solid var(--border);
      transition: background-color var(--motion-fast) ease;
    }

    .db-bl__row:last-child { border-block-end: none; }
    .db-bl__row:hover { background: var(--surface-alt); }

    .db-bl__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem 0.5rem;
      vertical-align: middle;
      color: var(--text);
    }

    .db-bl__td--actions { text-align: end; padding-inline-end: 0.875rem; }

    .db-bl__customer-name { font-weight: 500; margin: 0 0 0.125rem; font-size: 0.875rem; }
    .db-bl__customer-email { color: var(--text-muted); font-size: 0.8125rem; margin: 0; }
    .db-bl__reason { color: var(--text-muted); font-size: 0.875rem; }
    .db-bl__by { color: var(--text-muted); font-size: 0.875rem; }
    .db-bl__date { color: var(--text-muted); font-size: 0.8125rem; font-variant-numeric: tabular-nums; }

    .db-bl__remove-btn {
      padding-block: 0.3125rem;
      padding-inline: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--error);
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-bl__remove-btn:hover { background: color-mix(in srgb, var(--error) 14%, transparent); }

    .db-bl__sk {
      display: inline-block;
      block-size: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-bl-shimmer 1.4s infinite;
    }

    .db-bl__sk--name   { inline-size: 120px; }
    .db-bl__sk--reason { inline-size: 180px; }
    .db-bl__sk--date   { inline-size: 80px; }

    @keyframes db-bl-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .db-bl__empty {
      padding-block: 3rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    .db-bl__error {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding-block: 2.5rem;
      color: var(--error);
      font-size: 0.875rem;
    }

    .db-bl__retry {
      padding-block: 0.3125rem;
      padding-inline: 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      background: var(--accent);
      color: var(--on-accent);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-bl__sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
    }
  `],
})
export class BlacklistComponent implements OnInit {
  private readonly customersService = inject(CustomersService);

  readonly items = signal<BlacklistedCustomer[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly addLoading = signal(false);
  readonly addError = signal<string | null>(null);
  readonly addSuccess = signal(false);

  addCustomerId = '';
  addReason = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.customersService.getBlacklist().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  addToBlacklist(): void {
    if (!this.addCustomerId || !this.addReason) return;

    this.addLoading.set(true);
    this.addError.set(null);
    this.addSuccess.set(false);

    this.customersService.addToBlacklist(this.addCustomerId, this.addReason).subscribe({
      next: () => {
        this.addCustomerId = '';
        this.addReason = '';
        this.addLoading.set(false);
        this.addSuccess.set(true);
        this.load();
        setTimeout(() => this.addSuccess.set(false), 3000);
      },
      error: () => {
        this.addError.set('Failed to add customer to blacklist.');
        this.addLoading.set(false);
      },
    });
  }

  removeFromBlacklist(customerId: string): void {
    this.customersService.removeFromBlacklist(customerId).subscribe({
      next: () => this.load(),
      error: () => {},
    });
  }

  formatDate(isoString: string): string {
    try {
      return new Date(isoString).toLocaleDateString();
    } catch {
      return '—';
    }
  }
}
