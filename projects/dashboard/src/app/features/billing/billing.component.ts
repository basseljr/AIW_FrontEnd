import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BillingService } from '../../core/services/billing.service';
import { BillingCurrentPlan, BillingInvoice } from '../../core/models/billing.model';

@Component({
  selector: 'db-billing',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-bill">
      <header class="db-bill__header">
        <h1 class="db-bill__title">{{ 'billing.title' | translate }}</h1>
      </header>

      <!-- Current Plan Card -->
      <div class="db-bill__plan-card">
        <div class="db-bill__plan-card-header">
          <h2 class="db-bill__section-title">{{ 'billing.current_plan' | translate }}</h2>
          @if (planLoading()) {
            <span class="db-bill__badge db-bill__badge--sk" aria-hidden="true"></span>
          } @else if (plan()) {
            <span class="db-bill__badge" [class]="'db-bill__badge--' + plan()!.status">
              {{ translateStatus(plan()!.status) }}
            </span>
          }
        </div>

        @if (planLoading()) {
          <div class="db-bill__plan-sk">
            <span class="db-bill__sk db-bill__sk--name"></span>
            <span class="db-bill__sk db-bill__sk--detail"></span>
            <span class="db-bill__sk db-bill__sk--detail"></span>
          </div>
        } @else if (planError()) {
          <div class="db-bill__inline-error">
            {{ 'billing.plan_error' | translate }}
            <button class="db-bill__retry-sm" type="button" (click)="loadPlan()">
              {{ 'common.retry' | translate }}
            </button>
          </div>
        } @else if (!plan()) {
          <div class="db-bill__empty-plan">{{ 'billing.no_plan' | translate }}</div>
        } @else {
          <div class="db-bill__plan-body">
            <div class="db-bill__plan-name">{{ plan()!.planName }}</div>
            <div class="db-bill__plan-meta">
              <span class="db-bill__meta-item">
                <span class="db-bill__meta-label">{{ 'billing.billing_cycle' | translate }}</span>
                {{ plan()!.billingCycle }}
              </span>
              <span class="db-bill__meta-item">
                <span class="db-bill__meta-label">{{ 'billing.price_per_month' | translate }}</span>
                {{ plan()!.monthlyPrice.toFixed(3) }} KD
              </span>
              @if (plan()!.currentPeriodEnd) {
                <span class="db-bill__meta-item">
                  <span class="db-bill__meta-label">{{ 'billing.next_billing' | translate }}</span>
                  {{ formatDate(plan()!.currentPeriodEnd) }}
                </span>
              }
              @if (plan()!.trialEndsAt) {
                <span class="db-bill__meta-item">
                  <span class="db-bill__meta-label">{{ 'billing.trial_ends' | translate }}</span>
                  {{ formatDate(plan()!.trialEndsAt) }}
                </span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Invoices -->
      <div class="db-bill__invoices-card">
        <h2 class="db-bill__section-title db-bill__section-title--spaced">
          {{ 'billing.invoices_title' | translate }}
        </h2>

        @if (invoicesLoading()) {
          <div class="db-bill__inv-sk">
            @for (_ of [1,2,3]; track $index) {
              <div class="db-bill__inv-sk-row">
                <span class="db-bill__sk db-bill__sk--invnum"></span>
                <span class="db-bill__sk db-bill__sk--invperiod"></span>
                <span class="db-bill__sk db-bill__sk--invamt"></span>
                <span class="db-bill__sk db-bill__sk--invstat"></span>
              </div>
            }
          </div>
        } @else if (invoicesError()) {
          <div class="db-bill__inline-error">
            {{ 'billing.invoices_error' | translate }}
            <button class="db-bill__retry-sm" type="button" (click)="loadInvoices()">
              {{ 'common.retry' | translate }}
            </button>
          </div>
        } @else if (invoices().length === 0) {
          <div class="db-bill__empty-invoices" role="status">
            {{ 'billing.no_invoices' | translate }}
          </div>
        } @else {
          <div class="db-bill__table-wrap">
            <table class="db-bill__table" role="table">
              <thead class="db-bill__thead">
                <tr>
                  <th class="db-bill__th" scope="col">{{ 'billing.col_invoice' | translate }}</th>
                  <th class="db-bill__th" scope="col">{{ 'billing.col_period' | translate }}</th>
                  <th class="db-bill__th db-bill__th--num" scope="col">{{ 'billing.col_amount' | translate }}</th>
                  <th class="db-bill__th" scope="col">{{ 'billing.col_status' | translate }}</th>
                  <th class="db-bill__th" scope="col">{{ 'billing.col_date' | translate }}</th>
                  <th class="db-bill__th db-bill__th--actions" scope="col">
                    <span class="db-bill__sr">{{ 'billing.col_actions' | translate }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (inv of invoices(); track inv.id) {
                  <tr class="db-bill__row">
                    <td class="db-bill__td db-bill__td--code">{{ inv.invoiceNumber }}</td>
                    <td class="db-bill__td">{{ formatPeriod(inv.periodStart, inv.periodEnd) }}</td>
                    <td class="db-bill__td db-bill__td--num">{{ inv.total.toFixed(3) }} {{ inv.currency }}</td>
                    <td class="db-bill__td">
                      <span class="db-bill__status-badge" [class]="'db-bill__status-badge--' + inv.status">
                        {{ translateInvoiceStatus(inv.status) }}
                      </span>
                    </td>
                    <td class="db-bill__td db-bill__td--date">{{ formatDate(inv.paidAt ?? inv.dueDate) }}</td>
                    <td class="db-bill__td db-bill__td--actions">
                      @if (inv.pdfUrl) {
                        <a
                          class="db-bill__download"
                          [href]="inv.pdfUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                        >{{ 'billing.download_pdf' | translate }}</a>
                      } @else {
                        <span class="db-bill__no-pdf">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .db-bill {
      padding-block: var(--space-xl, 2rem);
      padding-inline: var(--space-xl, 2rem);
      max-inline-size: 860px;
    }

    .db-bill__header { margin-block-end: 1.5rem; }

    .db-bill__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-bill__plan-card, .db-bill__invoices-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 1.375rem;
      margin-block-end: 1.25rem;
    }

    .db-bill__plan-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-block-end: 1rem;
    }

    .db-bill__section-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text);
      margin: 0;
    }

    .db-bill__section-title--spaced { margin-block-end: 1rem; }

    .db-bill__badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.1875rem;
      padding-inline: 0.625rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
    }

    .db-bill__badge--active {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
    }

    .db-bill__badge--trialing {
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      color: var(--accent);
    }

    .db-bill__badge--past_due, .db-bill__badge--past-due {
      background: color-mix(in srgb, var(--warning) 12%, transparent);
      color: var(--warning);
    }

    .db-bill__badge--cancelled, .db-bill__badge--suspended {
      background: color-mix(in srgb, var(--error) 10%, transparent);
      color: var(--error);
    }

    .db-bill__badge--sk {
      inline-size: 60px;
      block-size: 22px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-bill-shimmer 1.4s infinite;
    }

    .db-bill__plan-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin-block-end: 0.75rem;
    }

    .db-bill__plan-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem 2rem;
    }

    .db-bill__meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.1875rem;
    }

    .db-bill__meta-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .db-bill__plan-sk {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .db-bill__sk {
      display: block;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-bill-shimmer 1.4s infinite;
    }

    .db-bill__sk--name   { block-size: 32px; inline-size: 160px; }
    .db-bill__sk--detail { block-size: 16px; inline-size: 120px; }
    .db-bill__sk--invnum    { block-size: 14px; inline-size: 100px; }
    .db-bill__sk--invperiod { block-size: 14px; inline-size: 140px; }
    .db-bill__sk--invamt    { block-size: 14px; inline-size: 80px; }
    .db-bill__sk--invstat   { block-size: 20px; inline-size: 60px; border-radius: 999px; }

    @keyframes db-bill-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .db-bill__inline-error {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border-radius: var(--radius-control);
      color: var(--error);
      font-size: 0.875rem;
    }

    .db-bill__retry-sm {
      padding-block: 0.25rem;
      padding-inline: 0.5rem;
      font-size: 0.75rem;
      font-family: inherit;
      font-weight: 600;
      background: var(--accent);
      color: var(--on-accent);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-bill__empty-plan, .db-bill__empty-invoices {
      padding-block: 2.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    .db-bill__inv-sk { display: flex; flex-direction: column; gap: 0.75rem; }
    .db-bill__inv-sk-row { display: flex; align-items: center; gap: 1.5rem; padding-block: 0.375rem; }

    .db-bill__table-wrap {
      overflow-x: auto;
      border-radius: var(--radius-card);
      border: 1px solid var(--border);
    }

    .db-bill__table {
      inline-size: 100%;
      min-inline-size: 560px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-bill__thead { background: var(--surface-alt); border-block-end: 1px solid var(--border); }

    .db-bill__th {
      padding-block: 0.625rem;
      padding-inline: 0.875rem;
      text-align: start;
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .db-bill__th--num { text-align: end; }
    .db-bill__th--actions { inline-size: 80px; }

    .db-bill__row { border-block-end: 1px solid var(--border); }
    .db-bill__row:last-child { border-block-end: none; }
    .db-bill__row:hover { background: var(--surface-alt); }

    .db-bill__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem;
      color: var(--text);
      vertical-align: middle;
    }

    .db-bill__td--code {
      font-family: monospace;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .db-bill__td--num { text-align: end; font-variant-numeric: tabular-nums; }
    .db-bill__td--date { color: var(--text-muted); font-size: 0.8125rem; font-variant-numeric: tabular-nums; }
    .db-bill__td--actions { text-align: end; }

    .db-bill__status-badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.1875rem;
      padding-inline: 0.5rem;
      border-radius: 999px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: capitalize;
      white-space: nowrap;
    }

    .db-bill__status-badge--paid {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
    }

    .db-bill__status-badge--pending {
      background: color-mix(in srgb, var(--warning) 12%, transparent);
      color: var(--warning);
    }

    .db-bill__status-badge--overdue {
      background: color-mix(in srgb, var(--error) 10%, transparent);
      color: var(--error);
    }

    .db-bill__status-badge--void, .db-bill__status-badge--written_off {
      background: color-mix(in srgb, var(--text-subtle) 12%, transparent);
      color: var(--text-subtle);
    }

    .db-bill__download {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--accent);
      text-decoration: none;
    }

    .db-bill__download:hover { text-decoration: underline; }

    .db-bill__no-pdf { color: var(--text-muted); font-size: 0.875rem; }

    .db-bill__sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
    }
  `],
})
export class BillingComponent implements OnInit {
  private readonly billingService = inject(BillingService);
  private readonly translate = inject(TranslateService);

  readonly plan = signal<BillingCurrentPlan | null>(null);
  readonly invoices = signal<BillingInvoice[]>([]);
  readonly planLoading = signal(true);
  readonly invoicesLoading = signal(true);
  readonly planError = signal(false);
  readonly invoicesError = signal(false);

  ngOnInit(): void {
    this.loadPlan();
    this.loadInvoices();
  }

  loadPlan(): void {
    this.planLoading.set(true);
    this.planError.set(false);
    this.billingService.getCurrentPlan().subscribe({
      next: (data) => { this.plan.set(data); this.planLoading.set(false); },
      error: (err: any) => {
        if (err?.status === 404) {
          this.plan.set(null);
          this.planLoading.set(false);
        } else {
          this.planError.set(true);
          this.planLoading.set(false);
        }
      },
    });
  }

  loadInvoices(): void {
    this.invoicesLoading.set(true);
    this.invoicesError.set(false);
    this.billingService.getInvoices().subscribe({
      next: (data) => { this.invoices.set(data); this.invoicesLoading.set(false); },
      error: () => { this.invoicesError.set(true); this.invoicesLoading.set(false); },
    });
  }

  translateStatus(status: string): string {
    const key = `billing.status_${status.toLowerCase().replace(/-/g, '_')}`;
    const translated = this.translate.instant(key);
    return translated === key ? status : translated;
  }

  translateInvoiceStatus(status: string): string {
    const key = `billing.inv_status_${status.toLowerCase().replace(/-/g, '_')}`;
    const translated = this.translate.instant(key);
    return translated === key ? status : translated;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    try { return new Date(value).toLocaleDateString(); } catch { return '—'; }
  }

  formatPeriod(start: string | null, end: string | null): string {
    if (!start) return '—';
    try {
      const s = new Date(start);
      const label = s.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      return label;
    } catch { return '—'; }
  }
}
