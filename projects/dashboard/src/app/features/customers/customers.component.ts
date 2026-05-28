import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { CustomersService } from '../../core/services/customers.service';
import { CustomerListItem } from '../../core/models/customer.model';

const SHIMMER_ROWS = [1, 2, 3, 4, 5];

@Component({
  selector: 'db-customers',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-cust">
      <header class="db-cust__header">
        <h1 class="db-cust__title">{{ 'customers.title' | translate }}</h1>
        <div class="db-cust__header-actions">
          <a class="db-cust__link-btn" [routerLink]="['/customers/blacklist']">
            🚫 {{ 'customers.blacklist_page_title' | translate }}
          </a>
          <button class="db-cust__btn-ghost" type="button" (click)="exportCsv()">
            {{ 'customers.export_csv' | translate }}
          </button>
        </div>
      </header>

      <div class="db-cust__filters">
        <div class="db-cust__search-wrap">
          <svg class="db-cust__search-icon" width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            #searchEl
            class="db-cust__input db-cust__search"
            type="search"
            [placeholder]="'customers.search_placeholder' | translate"
            [value]="searchInput()"
            (input)="onSearchChange(searchEl.value)"
          />
        </div>
        <select
          class="db-cust__input db-cust__select"
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusFilter($event)"
        >
          <option value="">{{ 'customers.status_all' | translate }}</option>
          <option value="active">{{ 'customers.status_active' | translate }}</option>
          <option value="blacklisted">{{ 'customers.status_blacklisted' | translate }}</option>
        </select>
      </div>

      <div class="db-cust__table-wrap">
        <table class="db-cust__table" role="table">
          <thead class="db-cust__thead">
            <tr>
              <th class="db-cust__th" scope="col">{{ 'customers.col_name' | translate }}</th>
              <th class="db-cust__th" scope="col">{{ 'customers.col_email' | translate }}</th>
              <th class="db-cust__th" scope="col">{{ 'customers.col_phone' | translate }}</th>
              <th class="db-cust__th db-cust__th--num" scope="col">{{ 'customers.col_orders' | translate }}</th>
              <th class="db-cust__th db-cust__th--num" scope="col">{{ 'customers.col_spent' | translate }}</th>
              <th class="db-cust__th" scope="col">{{ 'customers.col_status' | translate }}</th>
              <th class="db-cust__th db-cust__th--actions" scope="col">
                <span class="db-cust__sr">{{ 'customers.col_actions' | translate }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="db-cust__tbody">
            @if (loading()) {
              @for (_ of shimmerRows; track $index) {
                <tr class="db-cust__row" aria-hidden="true">
                  <td class="db-cust__td"><span class="db-cust__sk db-cust__sk--name"></span></td>
                  <td class="db-cust__td"><span class="db-cust__sk db-cust__sk--email"></span></td>
                  <td class="db-cust__td"><span class="db-cust__sk db-cust__sk--phone"></span></td>
                  <td class="db-cust__td db-cust__td--num"><span class="db-cust__sk db-cust__sk--xs"></span></td>
                  <td class="db-cust__td db-cust__td--num"><span class="db-cust__sk db-cust__sk--xs"></span></td>
                  <td class="db-cust__td"><span class="db-cust__sk db-cust__sk--badge"></span></td>
                  <td class="db-cust__td db-cust__td--actions"></td>
                </tr>
              }
            }
            @if (!loading()) {
              @for (customer of filteredItems(); track customer.customerId) {
                <tr class="db-cust__row">
                  <td class="db-cust__td">
                    <div class="db-cust__name-cell">
                      <div class="db-cust__avatar" aria-hidden="true">{{ initials(customer.name) }}</div>
                      <span class="db-cust__name">{{ customer.name }}</span>
                    </div>
                  </td>
                  <td class="db-cust__td">
                    <span class="db-cust__email">{{ customer.email }}</span>
                  </td>
                  <td class="db-cust__td">
                    <span class="db-cust__phone">{{ customer.phone || '—' }}</span>
                  </td>
                  <td class="db-cust__td db-cust__td--num">
                    <span class="db-cust__count">{{ customer.orderCount }}</span>
                  </td>
                  <td class="db-cust__td db-cust__td--num">
                    <span class="db-cust__amount">{{ formatAmount(customer.totalSpent) }}</span>
                  </td>
                  <td class="db-cust__td">
                    <span class="db-cust__badge" [attr.data-status]="customer.blacklisted ? 'blacklisted' : 'active'">
                      {{ (customer.blacklisted ? 'customers.status_blacklisted' : 'customers.status_active') | translate }}
                    </span>
                  </td>
                  <td class="db-cust__td db-cust__td--actions">
                    <a
                      class="db-cust__view-btn"
                      [routerLink]="['/customers', customer.customerId]"
                    >{{ 'customers.view_profile' | translate }}</a>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>

        @if (!loading() && !error() && filteredItems().length === 0) {
          <div class="db-cust__empty" role="status">
            <p>{{ 'customers.no_customers' | translate }}</p>
          </div>
        }

        @if (error() && !loading()) {
          <div class="db-cust__error" role="alert">
            <span>{{ 'customers.error' | translate }}</span>
            <button class="db-cust__retry" type="button" (click)="load()">
              {{ 'customers.retry' | translate }}
            </button>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (!loading() && totalCount() > pageSize) {
        <div class="db-cust__pagination">
          <button
            class="db-cust__page-btn"
            type="button"
            [disabled]="page() <= 1"
            (click)="prevPage()"
          >{{ 'common.previous' | translate }}</button>
          <span class="db-cust__page-info">
            {{ (page() - 1) * pageSize + 1 }}–{{ min(page() * pageSize, totalCount()) }}
            / {{ totalCount() }}
          </span>
          <button
            class="db-cust__page-btn"
            type="button"
            [disabled]="page() * pageSize >= totalCount()"
            (click)="nextPage()"
          >{{ 'common.next' | translate }}</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .db-cust {
      padding-block: var(--space-xl, 2rem);
      padding-inline: var(--space-xl, 2rem);
      container-type: inline-size;
    }

    .db-cust__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-block-end: 1.5rem;
    }

    .db-cust__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-cust__header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .db-cust__link-btn {
      display: inline-flex;
      align-items: center;
      padding-block: 0.4375rem;
      padding-inline: 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-control);
      text-decoration: none;
      transition: background-color var(--motion-fast) ease;
    }

    .db-cust__link-btn:hover { background: var(--surface-alt); }

    .db-cust__btn-ghost {
      padding-block: 0.4375rem;
      padding-inline: 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-cust__btn-ghost:hover { background: var(--surface-alt); }

    .db-cust__filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-end: 1.25rem;
      align-items: center;
    }

    .db-cust__input {
      font-family: inherit;
      font-size: 0.8125rem;
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

    .db-cust__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-cust__search-wrap {
      position: relative;
      flex: 1;
      min-inline-size: 200px;
      max-inline-size: 320px;
    }

    .db-cust__search-icon {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 0.625rem;
      transform: translateY(-50%);
      color: var(--text-subtle);
      pointer-events: none;
    }

    .db-cust__search { inline-size: 100%; padding-inline-start: 2rem; }

    .db-cust__select {
      padding-inline-end: 2rem;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 0.625rem) 50%;
      cursor: pointer;
      min-inline-size: 140px;
    }

    [dir='rtl'] .db-cust__select {
      background-position: 0.625rem 50%;
      padding-inline-end: 0.75rem;
      padding-inline-start: 2rem;
    }

    .db-cust__table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow-x: auto;
    }

    .db-cust__table {
      inline-size: 100%;
      min-inline-size: 680px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-cust__thead { background: var(--surface-alt); border-block-end: 1px solid var(--border); }

    .db-cust__th {
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

    .db-cust__th--num { text-align: end; }
    .db-cust__th--actions { inline-size: 80px; }

    .db-cust__row {
      border-block-end: 1px solid var(--border);
      transition: background-color var(--motion-fast) ease;
    }

    .db-cust__row:last-child { border-block-end: none; }
    .db-cust__row:hover { background: var(--surface-alt); }

    .db-cust__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem 0.5rem;
      vertical-align: middle;
      color: var(--text);
      white-space: nowrap;
    }

    .db-cust__td--num { text-align: end; }
    .db-cust__td--actions { text-align: end; padding-inline-end: 0.875rem; }

    .db-cust__name-cell {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .db-cust__avatar {
      inline-size: 32px;
      block-size: 32px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .db-cust__name { font-weight: 500; color: var(--text); }
    .db-cust__email { color: var(--text-muted); font-size: 0.8125rem; }
    .db-cust__phone { color: var(--text-muted); font-size: 0.8125rem; }
    .db-cust__count { font-variant-numeric: tabular-nums; }
    .db-cust__amount { font-weight: 600; font-variant-numeric: tabular-nums; }

    .db-cust__badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .db-cust__badge[data-status='active'] {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
      outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
    }

    .db-cust__badge[data-status='blacklisted'] {
      background: color-mix(in srgb, var(--error) 10%, transparent);
      color: var(--error);
      outline: 1px solid color-mix(in srgb, var(--error) 25%, transparent);
    }

    .db-cust__view-btn {
      display: inline-flex;
      align-items: center;
      padding-block: 0.3125rem;
      padding-inline: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--accent);
      background: color-mix(in srgb, var(--accent) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
      border-radius: var(--radius-control);
      text-decoration: none;
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-cust__view-btn:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); }

    /* Skeleton */
    .db-cust__sk {
      display: inline-block;
      block-size: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-cust-shimmer 1.4s infinite;
    }

    .db-cust__sk--name   { inline-size: 120px; }
    .db-cust__sk--email  { inline-size: 160px; }
    .db-cust__sk--phone  { inline-size: 90px; }
    .db-cust__sk--xs     { inline-size: 40px; }
    .db-cust__sk--badge  { inline-size: 68px; block-size: 20px; border-radius: 999px; }

    @keyframes db-cust-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .db-cust__empty {
      padding-block: 3rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    .db-cust__error {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding-block: 2.5rem;
      color: var(--error);
      font-size: 0.875rem;
    }

    .db-cust__retry {
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

    .db-cust__pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-block-start: 1.25rem;
    }

    .db-cust__page-btn {
      padding-block: 0.4375rem;
      padding-inline: 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-cust__page-btn:hover:not(:disabled) { background: var(--surface-alt); }
    .db-cust__page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .db-cust__page-info {
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }

    .db-cust__sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
    }
  `],
})
export class CustomersComponent implements OnInit, OnDestroy {
  private readonly customersService = inject(CustomersService);
  private readonly router = inject(Router);

  readonly items = signal<CustomerListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly searchInput = signal('');
  readonly statusFilter = signal('');

  readonly pageSize = 25;
  readonly shimmerRows = SHIMMER_ROWS;

  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  constructor() {}

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.customersService.getCustomers({
      search: this.searchInput() || undefined,
      page: this.page(),
      pageSize: this.pageSize,
    }).subscribe({
      next: (result) => {
        this.items.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  filteredItems(): CustomerListItem[] {
    const status = this.statusFilter();
    if (!status) return this.items();
    if (status === 'blacklisted') return this.items().filter((c) => c.blacklisted);
    if (status === 'active') return this.items().filter((c) => !c.blacklisted);
    return this.items();
  }

  onSearchChange(value: string): void {
    this.searchInput.set(value);
    this.searchSubject.next(value);
  }

  onStatusFilter(value: string): void {
    this.statusFilter.set(value);
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.page() * this.pageSize < this.totalCount()) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  exportCsv(): void {
    this.customersService.exportCsv().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
  }

  formatAmount(amount: number): string {
    return amount.toFixed(3) + ' KD';
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
