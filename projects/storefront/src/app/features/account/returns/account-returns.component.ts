import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent } from '@shared/ui';
import { TenantConfigService } from '../../../core/services/tenant-config.service';
import { AccountService } from '../../../core/services/account.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '@shared/api';
import { Observable } from 'rxjs';

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderItemId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  refundAmount?: number;
  createdAt: string;
}

export interface ReturnOrderSummary {
  id: string;
  orderNumber: string;
  placedAt: string;
}

type ReturnStatus = ReturnRequest['status'];

@Component({
  selector: 'sf-account-returns',
  standalone: true,
  imports: [RouterLink, TranslateModule, FormsModule, SkeletonComponent, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="returns">
      <h1 class="returns__title">{{ 'account.returns_title' | translate }}</h1>

      @if (!isRetail()) {
        <div class="returns__unavailable">
          <svg class="returns__unavailable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p class="returns__unavailable-text">{{ 'account.returns_not_available' | translate }}</p>
        </div>
      } @else {
        <!-- New return request form -->
        <div class="returns__new-section">
          <button
            class="returns__toggle-form"
            type="button"
            (click)="showForm.set(!showForm())"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              @if (showForm()) {
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              } @else {
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              }
            </svg>
            {{ 'account.new_return' | translate }}
          </button>

          @if (showForm()) {
            <form class="returns__form" (ngSubmit)="onSubmit()" #returnForm="ngForm">
              <div class="returns__form-field">
                <label class="returns__form-label" for="return-order">
                  {{ 'account.return_order' | translate }}
                </label>
                <select
                  id="return-order"
                  class="returns__form-select"
                  name="orderId"
                  [(ngModel)]="formOrderId"
                  required
                >
                  <option value="">{{ 'account.return_order' | translate }}...</option>
                  @for (order of recentOrders(); track order.id) {
                    <option [value]="order.id">{{ order.orderNumber }}</option>
                  }
                </select>
              </div>

              <div class="returns__form-field">
                <label class="returns__form-label" for="return-item">
                  {{ 'account.return_item' | translate }}
                </label>
                <input
                  id="return-item"
                  class="returns__form-input"
                  type="text"
                  name="orderItemId"
                  [(ngModel)]="formOrderItemId"
                  [placeholder]="'account.return_item' | translate"
                  required
                />
              </div>

              <div class="returns__form-field">
                <label class="returns__form-label" for="return-reason">
                  {{ 'account.return_reason' | translate }}
                </label>
                <textarea
                  id="return-reason"
                  class="returns__form-textarea"
                  name="reason"
                  [(ngModel)]="formReason"
                  [placeholder]="'account.return_reason' | translate"
                  rows="4"
                  required
                  maxlength="1000"
                ></textarea>
                <span class="returns__form-char-count">{{ formReason.length }}/1000</span>
              </div>

              @if (submitError()) {
                <p class="returns__form-error" role="alert">{{ submitError()! | translate }}</p>
              }

              <div class="returns__form-actions">
                <button
                  class="returns__form-submit"
                  type="submit"
                  [disabled]="submitting() || !returnForm.valid"
                >
                  {{ submitting() ? ('common.loading' | translate) : ('account.submit_return' | translate) }}
                </button>
                <button
                  class="returns__form-cancel"
                  type="button"
                  (click)="resetForm()"
                >
                  {{ 'common.cancel' | translate }}
                </button>
              </div>
            </form>
          }
        </div>

        <!-- Returns list -->
        @if (loading()) {
          <div class="returns__list">
            @for (_ of skeletons; track $index) {
              <div class="returns__skeleton">
                <div class="returns__skeleton-body">
                  <ui-skeleton variant="text" width="60%" />
                  <ui-skeleton variant="text" width="40%" />
                  <ui-skeleton variant="text" width="30%" />
                </div>
              </div>
            }
          </div>
        } @else if (listError()) {
          <div class="returns__error" role="alert">
            <p class="returns__error-text">{{ 'common.load_error' | translate }}</p>
            <button class="returns__retry-btn" type="button" (click)="loadReturns()">
              {{ 'common.retry' | translate }}
            </button>
          </div>
        } @else if (returns().length === 0) {
          <div class="returns__empty">
            <svg class="returns__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <polyline points="9 14 4 9 9 4"/>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
            </svg>
            <p class="returns__empty-title">{{ 'account.no_returns' | translate }}</p>
            <p class="returns__empty-sub">{{ 'account.no_returns_sub' | translate }}</p>
          </div>
        } @else {
          <ul class="returns__list" role="list">
            @for (request of returns(); track request.id) {
              <li class="returns__item">
                <div class="returns__item-header">
                  <div class="returns__item-meta">
                    <span class="returns__item-order">{{ 'account.order_number' | translate: { number: request.orderId.slice(0, 8).toUpperCase() } }}</span>
                    <span class="returns__item-date">{{ request.createdAt | date:'mediumDate' }}</span>
                  </div>
                  <span class="returns__status-chip" [class]="'returns__status-chip--' + request.status">
                    {{ statusLabel(request.status) | translate }}
                  </span>
                </div>
                <p class="returns__item-reason">{{ request.reason }}</p>
                @if (request.refundAmount) {
                  <p class="returns__item-refund">
                    {{ 'account.order_total' | translate: { amount: request.refundAmount | number:'1.3-3' } }}
                  </p>
                }
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
  styles: [
    `
      .returns {
        padding-block-end: 2rem;
      }

      .returns__title {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        margin-block-end: 1.5rem;
        letter-spacing: -0.02em;
      }

      /* Unavailable */
      .returns__unavailable {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-block: 4rem;
        text-align: center;
        gap: 1rem;
      }
      .returns__unavailable-icon {
        inline-size: 4rem;
        block-size: 4rem;
        color: var(--color-outline-variant, #d6c4ad);
      }
      .returns__unavailable-text {
        font-size: 1rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.65;
        margin: 0;
        max-inline-size: 22rem;
      }

      /* New return section */
      .returns__new-section {
        margin-block-end: 2rem;
      }

      .returns__toggle-form {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding-block: 0.625rem;
        padding-inline: 1.25rem;
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        border: none;
        border-radius: 8px;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .returns__toggle-form:hover { opacity: 0.88; }
      .returns__toggle-form svg {
        inline-size: 1rem;
        block-size: 1rem;
        flex-shrink: 0;
      }

      /* Form */
      .returns__form {
        margin-block-start: 1.25rem;
        background: var(--color-surface, #ffffff);
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.125rem;
        max-inline-size: 36rem;
      }

      .returns__form-field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .returns__form-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
      }

      .returns__form-select,
      .returns__form-input,
      .returns__form-textarea {
        padding-block: 0.625rem;
        padding-inline: 0.875rem;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 8px;
        background: var(--color-background, #fff8f1);
        color: var(--color-on-surface, #1e1b17);
        font-size: 0.9375rem;
        font-family: inherit;
        transition: border-color 0.15s;
        outline: none;
      }
      .returns__form-select:focus,
      .returns__form-input:focus,
      .returns__form-textarea:focus {
        border-color: var(--color-primary, #805600);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #805600) 12%, transparent);
      }

      .returns__form-textarea { resize: vertical; min-block-size: 6rem; }

      .returns__form-char-count {
        font-size: 0.75rem;
        color: var(--color-on-surface-variant, #514534);
        opacity: 0.6;
        text-align: end;
      }

      .returns__form-error {
        font-size: 0.875rem;
        color: var(--color-error, #dc2626);
        margin: 0;
      }

      .returns__form-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .returns__form-submit {
        padding-block: 0.625rem;
        padding-inline: 1.5rem;
        background: var(--color-primary, #805600);
        color: var(--color-on-primary, #ffffff);
        border: none;
        border-radius: 8px;
        font-size: 0.9375rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .returns__form-submit:hover:not(:disabled) { opacity: 0.88; }
      .returns__form-submit:disabled { opacity: 0.6; cursor: not-allowed; }

      .returns__form-cancel {
        padding-block: 0.625rem;
        padding-inline: 1.25rem;
        background: transparent;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 8px;
        color: var(--color-on-surface-variant, #514534);
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.15s;
      }
      .returns__form-cancel:hover {
        background: var(--color-surface-container, #f4ede5);
      }

      /* Skeleton */
      .returns__skeleton {
        background: var(--color-surface, #ffffff);
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 12px;
        padding: 1rem;
      }
      .returns__skeleton-body {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      /* Error state */
      .returns__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-block: 3rem;
        gap: 1rem;
        text-align: center;
      }
      .returns__error-text {
        font-size: 0.9375rem;
        color: var(--color-error, #b3261e);
        margin: 0;
      }
      .returns__retry-btn {
        padding-block: 0.5rem;
        padding-inline: 1.25rem;
        border: 1px solid var(--color-error, #b3261e);
        border-radius: 6px;
        background: transparent;
        color: var(--color-error, #b3261e);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.15s, color 0.15s;
      }
      .returns__retry-btn:hover { background: var(--color-error, #b3261e); color: #fff; }

      /* Empty state */
      .returns__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-block: 3rem;
        text-align: center;
        gap: 0.75rem;
      }
      .returns__empty-icon {
        inline-size: 3.5rem;
        block-size: 3.5rem;
        color: var(--color-outline-variant, #d6c4ad);
        margin-block-end: 0.25rem;
      }
      .returns__empty-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
      }
      .returns__empty-sub {
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.6;
        margin: 0;
      }

      /* Returns list */
      .returns__list {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .returns__item {
        background: var(--color-surface, #ffffff);
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: 12px;
        padding: 1.125rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .returns__item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .returns__item-meta {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .returns__item-order {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
      }

      .returns__item-date {
        font-size: 0.75rem;
        color: var(--color-on-surface-variant, #514534);
        opacity: 0.7;
      }

      .returns__item-reason {
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.8;
        margin: 0;
        line-height: 1.5;
      }

      .returns__item-refund {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-primary, #805600);
        margin: 0;
      }

      /* Status chips */
      .returns__status-chip {
        display: inline-flex;
        align-items: center;
        padding-block: 0.25rem;
        padding-inline: 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
      }

      .returns__status-chip--pending {
        background: color-mix(in srgb, #f59e0b 15%, transparent);
        color: #92400e;
      }
      .returns__status-chip--approved {
        background: color-mix(in srgb, #10b981 15%, transparent);
        color: #065f46;
      }
      .returns__status-chip--rejected {
        background: color-mix(in srgb, #ef4444 15%, transparent);
        color: #991b1b;
      }
      .returns__status-chip--processing {
        background: color-mix(in srgb, #3b82f6 15%, transparent);
        color: #1e40af;
      }
    `,
  ],
})
export class AccountReturnsComponent implements OnInit {
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly lang = inject(LanguageToggleService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly accountService = inject(AccountService);

  readonly activeLang = this.lang.current;
  readonly isRetail = computed(
    () => this.tenantConfig.config()?.businessType === 'retail',
  );

  readonly loading = signal(false);
  readonly listError = signal(false);
  readonly submitting = signal(false);
  readonly returns = signal<ReturnRequest[]>([]);
  readonly recentOrders = signal<ReturnOrderSummary[]>([]);
  readonly showForm = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly skeletons = new Array(3);

  // Form fields
  formOrderId = '';
  formOrderItemId = '';
  formReason = '';

  ngOnInit(): void {
    if (!this.isRetail()) return;
    this.loadReturns();
    this.loadRecentOrders();
  }

  loadReturns(): void {
    this.loading.set(true);
    this.listError.set(false);
    this.getReturns().subscribe({
      next: (data) => {
        this.returns.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.listError.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadRecentOrders(): void {
    this.accountService.getOrders(1, 10).subscribe({
      next: (resp) => {
        const summaries: ReturnOrderSummary[] = resp.items.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          placedAt: o.placedAt,
        }));
        this.recentOrders.set(summaries);
      },
      error: () => { /* silently fail — form still usable with manual entry */ },
    });
  }

  onSubmit(): void {
    if (!this.formOrderId || !this.formOrderItemId || !this.formReason.trim()) return;
    this.submitting.set(true);
    this.submitError.set(null);

    this.createReturn({
      orderId: this.formOrderId,
      orderItemId: this.formOrderItemId,
      reason: this.formReason.trim(),
    }).subscribe({
      next: (newReturn) => {
        this.returns.update((prev) => [newReturn, ...prev]);
        this.submitting.set(false);
        this.resetForm();
      },
      error: () => {
        this.submitError.set('errors.generic');
        this.submitting.set(false);
      },
    });
  }

  resetForm(): void {
    this.formOrderId = '';
    this.formOrderItemId = '';
    this.formReason = '';
    this.submitError.set(null);
    this.showForm.set(false);
  }

  statusLabel(status: ReturnStatus): string {
    const labels: Record<ReturnStatus, string> = {
      pending: 'account.return_status_pending',
      approved: 'account.return_status_approved',
      rejected: 'account.return_status_rejected',
      processing: 'account.return_status_processing',
    };
    return labels[status] ?? 'account.return_status_pending';
  }

  private getReturns(): Observable<ReturnRequest[]> {
    return this.http.get<ReturnRequest[]>(
      `${this.baseUrl}/storefront/returns`,
      { withCredentials: true },
    );
  }

  private createReturn(body: { orderId: string; orderItemId: string; reason: string }): Observable<ReturnRequest> {
    return this.http.post<ReturnRequest>(
      `${this.baseUrl}/storefront/returns`,
      body,
      { withCredentials: true },
    );
  }
}
