import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { CustomersService } from '../../../core/services/customers.service';
import { CustomerDetail, CustomerNote } from '../../../core/models/customer.model';

type ProfileTab = 'orders' | 'addresses' | 'loyalty' | 'notes';

@Component({
  selector: 'db-customer-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-cp">
      <a class="db-cp__back" [routerLink]="['/customers']">
        ← {{ 'customers.back_to_customers' | translate }}
      </a>

      @if (loading()) {
        <div class="db-cp__loading" role="status">
          <div class="db-cp__sk db-cp__sk--header"></div>
          <div class="db-cp__sk db-cp__sk--cards"></div>
        </div>
      }

      @if (error() && !loading()) {
        <div class="db-cp__error" role="alert">
          <span>{{ 'customers.error' | translate }}</span>
          <button class="db-cp__retry-btn" type="button" (click)="load()">
            {{ 'customers.retry' | translate }}
          </button>
        </div>
      }

      @if (customer() && !loading()) {
        <!-- Header -->
        <div class="db-cp__profile-header">
          <div class="db-cp__avatar-lg" aria-hidden="true">{{ initials(customer()!.name) }}</div>
          <div class="db-cp__profile-info">
            <h1 class="db-cp__profile-name">{{ customer()!.name }}</h1>
            <p class="db-cp__profile-email">{{ customer()!.email }}</p>
            @if (customer()!.phone) {
              <p class="db-cp__profile-phone">{{ customer()!.phone }}</p>
            }
            <div class="db-cp__profile-badges">
              @if (customer()!.blacklisted) {
                <span class="db-cp__badge db-cp__badge--blacklisted">
                  🚫 {{ 'customers.status_blacklisted' | translate }}
                </span>
              } @else {
                <span class="db-cp__badge db-cp__badge--active">
                  {{ 'customers.status_active' | translate }}
                </span>
              }
              <span class="db-cp__joined">
                {{ 'customers.joined' | translate }}: {{ formatDate(customer()!.createdAt) }}
              </span>
            </div>
          </div>
          <div class="db-cp__profile-actions">
            @if (!customer()!.blacklisted && !showBlacklistForm()) {
              <button
                class="db-cp__btn-danger"
                type="button"
                (click)="showBlacklistForm.set(true)"
              >{{ 'customers.blacklist_btn' | translate }}</button>
            }
            @if (customer()!.blacklisted) {
              <button
                class="db-cp__btn-ghost"
                type="button"
                (click)="removeFromBlacklist()"
                [disabled]="actionLoading()"
              >{{ 'customers.remove_blacklist_btn' | translate }}</button>
            }
          </div>
        </div>

        <!-- Blacklist form -->
        @if (showBlacklistForm()) {
          <div class="db-cp__blacklist-form">
            <label class="db-cp__label" for="bl-reason">
              {{ 'customers.blacklist_reason_label' | translate }}
            </label>
            <input
              id="bl-reason"
              class="db-cp__input"
              type="text"
              [(ngModel)]="blacklistReason"
              [placeholder]="'customers.blacklist_reason_placeholder' | translate"
            />
            <div class="db-cp__blacklist-actions">
              <button
                class="db-cp__btn-danger"
                type="button"
                [disabled]="actionLoading() || !blacklistReason"
                (click)="addToBlacklist()"
              >{{ 'customers.confirm_blacklist' | translate }}</button>
              <button
                class="db-cp__btn-ghost"
                type="button"
                (click)="showBlacklistForm.set(false); blacklistReason = ''"
              >{{ 'common.cancel' | translate }}</button>
            </div>
          </div>
        }

        @if (actionError()) {
          <div class="db-cp__action-error" role="alert">{{ actionError() }}</div>
        }

        <!-- Summary cards -->
        <div class="db-cp__cards">
          <div class="db-cp__card">
            <p class="db-cp__card-label">{{ 'customers.card_total_orders' | translate }}</p>
            <p class="db-cp__card-value">{{ customer()!.orderCount }}</p>
          </div>
          <div class="db-cp__card">
            <p class="db-cp__card-label">{{ 'customers.card_total_spent' | translate }}</p>
            <p class="db-cp__card-value">{{ formatAmount(customer()!.totalSpent) }}</p>
          </div>
          <div class="db-cp__card">
            <p class="db-cp__card-label">{{ 'customers.card_avg_order' | translate }}</p>
            <p class="db-cp__card-value">{{ avgOrder() }}</p>
          </div>
          <div class="db-cp__card">
            <p class="db-cp__card-label">{{ 'customers.card_loyalty_points' | translate }}</p>
            <p class="db-cp__card-value">{{ customer()!.loyaltyBalance }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="db-cp__tabs" role="tablist">
          <button
            class="db-cp__tab"
            role="tab"
            [class.db-cp__tab--active]="activeTab() === 'orders'"
            (click)="activeTab.set('orders')"
          >{{ 'customers.tab_orders' | translate }}</button>
          <button
            class="db-cp__tab"
            role="tab"
            [class.db-cp__tab--active]="activeTab() === 'addresses'"
            (click)="activeTab.set('addresses')"
          >{{ 'customers.tab_addresses' | translate }}</button>
          <button
            class="db-cp__tab"
            role="tab"
            [class.db-cp__tab--active]="activeTab() === 'loyalty'"
            (click)="activeTab.set('loyalty')"
          >{{ 'customers.tab_loyalty' | translate }}</button>
          <button
            class="db-cp__tab"
            role="tab"
            [class.db-cp__tab--active]="activeTab() === 'notes'"
            (click)="selectNotesTab()"
          >{{ 'customers.tab_notes' | translate }}</button>
        </div>

        <!-- Tab panels -->
        <div class="db-cp__tab-panel" role="tabpanel">
          @if (activeTab() === 'orders') {
            @if (customer()!.orderHistory.length === 0) {
              <p class="db-cp__empty-tab">{{ 'customers.no_orders' | translate }}</p>
            } @else {
              <div class="db-cp__table-wrap">
                <table class="db-cp__table">
                  <thead class="db-cp__thead">
                    <tr>
                      <th class="db-cp__th" scope="col">{{ 'customers.col_order_number' | translate }}</th>
                      <th class="db-cp__th" scope="col">{{ 'customers.col_order_status' | translate }}</th>
                      <th class="db-cp__th" scope="col">{{ 'customers.col_order_total' | translate }}</th>
                      <th class="db-cp__th" scope="col">{{ 'customers.col_order_date' | translate }}</th>
                      <th class="db-cp__th" scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of customer()!.orderHistory; track order.orderId) {
                      <tr class="db-cp__row">
                        <td class="db-cp__td"><span class="db-cp__order-num">#{{ order.orderNumber }}</span></td>
                        <td class="db-cp__td">
                          <span class="db-cp__status-badge" [attr.data-status]="order.status">{{ order.status }}</span>
                        </td>
                        <td class="db-cp__td">{{ formatAmount(order.totalAmount) }}</td>
                        <td class="db-cp__td">{{ formatDate(order.createdAt) }}</td>
                        <td class="db-cp__td">
                          <a class="db-cp__link" [routerLink]="['/orders', order.orderId]">
                            {{ 'common.view' | translate }}
                          </a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }

          @if (activeTab() === 'addresses') {
            @if (customer()!.addresses.length === 0) {
              <p class="db-cp__empty-tab">{{ 'customers.no_addresses' | translate }}</p>
            } @else {
              <div class="db-cp__address-list">
                @for (addr of customer()!.addresses; track addr.addressId) {
                  <div class="db-cp__address-card">
                    @if (addr.label) {
                      <p class="db-cp__address-label">{{ addr.label }}</p>
                    }
                    <p class="db-cp__address-text">
                      {{ formatAddress(addr) }}
                    </p>
                    @if (addr.isDefault) {
                      <span class="db-cp__default-badge">Default</span>
                    }
                  </div>
                }
              </div>
            }
          }

          @if (activeTab() === 'loyalty') {
            <div class="db-cp__loyalty">
              <div class="db-cp__loyalty-points">
                <p class="db-cp__loyalty-label">{{ 'customers.card_loyalty_points' | translate }}</p>
                <p class="db-cp__loyalty-value">{{ customer()!.loyaltyBalance }}</p>
              </div>
              <p class="db-cp__empty-tab">{{ 'customers.no_loyalty' | translate }}</p>
            </div>
          }

          @if (activeTab() === 'notes') {
            <div class="db-cp__notes">
              <div class="db-cp__notes-form">
                <textarea
                  class="db-cp__notes-input"
                  #noteTextarea
                  [value]="notesText"
                  (input)="notesText = noteTextarea.value"
                  [placeholder]="'customers.notes_placeholder' | translate"
                  rows="4"
                ></textarea>
                <div class="db-cp__notes-form-actions">
                  <button
                    class="db-cp__btn-primary"
                    type="button"
                    [disabled]="noteSaving() || !notesText.trim()"
                    (click)="saveNote()"
                  >
                    @if (noteSaving()) { <span class="db-cp__note-spinner" aria-hidden="true"></span> }
                    {{ 'customers.notes_save' | translate }}
                  </button>
                  @if (noteError()) {
                    <span class="db-cp__note-error" role="alert">{{ noteError() }}</span>
                  }
                </div>
              </div>

              @if (notesLoading()) {
                <div class="db-cp__notes-loading">{{ 'common.loading' | translate }}</div>
              }

              @if (!notesLoading() && notes().length === 0) {
                <p class="db-cp__empty-tab">{{ 'customers.no_notes' | translate }}</p>
              }

              @if (!notesLoading() && notes().length > 0) {
                <div class="db-cp__notes-list">
                  @for (note of notes(); track note.id) {
                    <div class="db-cp__note-item">
                      <div class="db-cp__note-meta">
                        <span class="db-cp__note-staff">{{ note.staffName }}</span>
                        <span class="db-cp__note-date">{{ formatDate(note.createdAt) }}</span>
                      </div>
                      <p class="db-cp__note-text">{{ note.text }}</p>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .db-cp {
      padding-block: var(--space-xl, 2rem);
      padding-inline: var(--space-xl, 2rem);
      max-inline-size: 960px;
    }

    .db-cp__back {
      display: inline-flex;
      align-items: center;
      color: var(--accent);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      margin-block-end: 1.5rem;
      gap: 0.25rem;
    }

    .db-cp__back:hover { text-decoration: underline; }

    .db-cp__loading { padding-block: 2rem; }

    .db-cp__sk {
      border-radius: 8px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-cp-shimmer 1.4s infinite;
      margin-block-end: 1rem;
    }

    .db-cp__sk--header { block-size: 100px; }
    .db-cp__sk--cards { block-size: 80px; }

    @keyframes db-cp-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .db-cp__error {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-card);
      color: var(--error);
      font-size: 0.875rem;
    }

    .db-cp__retry-btn {
      padding-block: 0.3125rem;
      padding-inline: 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      background: var(--error);
      color: var(--on-accent);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-cp__profile-header {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      margin-block-end: 1.25rem;
    }

    .db-cp__avatar-lg {
      inline-size: 56px;
      block-size: 56px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--accent) 14%, transparent);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .db-cp__profile-info { flex: 1; }

    .db-cp__profile-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.25rem;
    }

    .db-cp__profile-email, .db-cp__profile-phone {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0 0 0.25rem;
    }

    .db-cp__profile-badges {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-start: 0.5rem;
    }

    .db-cp__profile-actions {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .db-cp__badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .db-cp__badge--active {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
    }

    .db-cp__badge--blacklisted {
      background: color-mix(in srgb, var(--error) 10%, transparent);
      color: var(--error);
    }

    .db-cp__joined { font-size: 0.8125rem; color: var(--text-subtle); }

    .db-cp__btn-danger {
      padding-block: 0.4375rem;
      padding-inline: 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      background: var(--error);
      color: var(--on-accent);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: opacity var(--motion-fast) ease;
    }

    .db-cp__btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

    .db-cp__btn-ghost {
      padding-block: 0.4375rem;
      padding-inline: 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text-muted);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-control);
      cursor: pointer;
    }

    .db-cp__btn-ghost:disabled { opacity: 0.6; cursor: not-allowed; }

    .db-cp__blacklist-form {
      padding: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      margin-block-end: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .db-cp__label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }

    .db-cp__input {
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.5rem;
      padding-inline: 0.75rem;
      outline: none;
      transition: border-color var(--motion-base) ease;
    }

    .db-cp__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-cp__blacklist-actions { display: flex; gap: 0.5rem; }

    .db-cp__action-error {
      padding: 0.75rem 1rem;
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-control);
      color: var(--error);
      font-size: 0.875rem;
      margin-block-end: 1rem;
    }

    .db-cp__cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.75rem;
      margin-block-end: 1.5rem;
    }

    .db-cp__card {
      padding: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
    }

    .db-cp__card-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 0.375rem;
    }

    .db-cp__card-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      font-variant-numeric: tabular-nums;
    }

    .db-cp__tabs {
      display: flex;
      gap: 0;
      border-block-end: 1px solid var(--border);
      margin-block-end: 1.25rem;
      overflow-x: auto;
    }

    .db-cp__tab {
      padding-block: 0.75rem;
      padding-inline: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-block-end: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: color var(--motion-fast), border-color var(--motion-fast);
    }

    .db-cp__tab:hover { color: var(--text); }

    .db-cp__tab--active {
      color: var(--accent);
      border-block-end-color: var(--accent);
      font-weight: 600;
    }

    .db-cp__tab-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 1.25rem;
    }

    .db-cp__empty-tab {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
      padding-block: 1.5rem;
      margin: 0;
    }

    .db-cp__table-wrap { overflow-x: auto; }

    .db-cp__table {
      inline-size: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-cp__thead { background: var(--surface-alt); }

    .db-cp__th {
      padding-block: 0.5rem;
      padding-inline: 0.75rem;
      text-align: start;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .db-cp__row { border-block-end: 1px solid var(--border); }
    .db-cp__row:last-child { border-block-end: none; }
    .db-cp__row:hover { background: var(--surface-alt); }

    .db-cp__td {
      padding-block: 0.625rem;
      padding-inline: 0.75rem;
      vertical-align: middle;
      color: var(--text);
    }

    .db-cp__order-num { font-weight: 600; color: var(--accent); font-size: 0.8125rem; }

    .db-cp__status-badge {
      display: inline-flex;
      padding-block: 0.1875rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      color: var(--accent);
    }

    .db-cp__link { color: var(--accent); text-decoration: none; font-size: 0.8125rem; font-weight: 600; }
    .db-cp__link:hover { text-decoration: underline; }

    .db-cp__address-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .db-cp__address-card {
      padding: 0.875rem;
      background: var(--surface-alt);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
    }

    .db-cp__address-label { font-weight: 600; font-size: 0.875rem; color: var(--text); margin: 0 0 0.25rem; }
    .db-cp__address-text { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

    .db-cp__default-badge {
      display: inline-flex;
      margin-block-start: 0.375rem;
      padding-block: 0.1875rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.6875rem;
      font-weight: 700;
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .db-cp__loyalty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-block: 1.5rem;
      gap: 1rem;
      text-align: center;
    }

    .db-cp__loyalty-points {
      padding: 1.25rem 2rem;
      background: color-mix(in srgb, var(--accent) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
      border-radius: var(--radius-card);
    }

    .db-cp__loyalty-label { font-size: 0.75rem; font-weight: 600; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.25rem; }
    .db-cp__loyalty-value { font-size: 2rem; font-weight: 800; color: var(--accent); margin: 0; font-variant-numeric: tabular-nums; }

    .db-cp__notes { display: flex; flex-direction: column; gap: 1rem; }

    .db-cp__notes-form { display: flex; flex-direction: column; gap: 0.5rem; }

    .db-cp__notes-form-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .db-cp__notes-input {
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding: 0.75rem;
      outline: none;
      resize: vertical;
      min-block-size: 100px;
      transition: border-color var(--motion-base) ease;
    }

    .db-cp__notes-input:focus { border-color: var(--accent); }

    .db-cp__notes-loading { color: var(--text-muted); font-size: 0.875rem; padding-block: 0.5rem; }

    .db-cp__note-error { font-size: 0.8125rem; color: var(--error); }

    .db-cp__note-spinner {
      display: inline-block;
      inline-size: 12px;
      block-size: 12px;
      border: 2px solid rgba(255,255,255,0.3);
      border-block-start-color: var(--on-accent);
      border-radius: 50%;
      animation: db-cp-note-spin 0.7s linear infinite;
      margin-inline-end: 0.25rem;
    }

    @keyframes db-cp-note-spin { to { transform: rotate(360deg); } }

    .db-cp__notes-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .db-cp__note-item {
      padding: 0.875rem;
      background: var(--surface-alt);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
    }

    .db-cp__note-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-block-end: 0.375rem;
    }

    .db-cp__note-staff { font-size: 0.8125rem; font-weight: 600; color: var(--accent); }
    .db-cp__note-date { font-size: 0.75rem; color: var(--text-subtle); }
    .db-cp__note-text { font-size: 0.875rem; color: var(--text); margin: 0; white-space: pre-wrap; }

    .db-cp__btn-primary {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
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

    .db-cp__btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .db-cp__btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
  `],
})
export class CustomerProfileComponent implements OnInit {
  private readonly customersService = inject(CustomersService);
  private readonly route = inject(ActivatedRoute);

  readonly customer = signal<CustomerDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly activeTab = signal<ProfileTab>('orders');
  readonly showBlacklistForm = signal(false);
  readonly actionLoading = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly notes = signal<CustomerNote[]>([]);
  readonly notesLoading = signal(false);
  readonly noteSaving = signal(false);
  readonly noteError = signal<string | null>(null);

  blacklistReason = '';
  notesText = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loading.set(true);
    this.error.set(false);

    this.customersService.getCustomerDetail(id).subscribe({
      next: (data) => {
        this.customer.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  addToBlacklist(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.blacklistReason) return;

    this.actionLoading.set(true);
    this.actionError.set(null);

    this.customersService.addToBlacklist(id, this.blacklistReason).subscribe({
      next: () => {
        this.showBlacklistForm.set(false);
        this.blacklistReason = '';
        this.actionLoading.set(false);
        this.load();
      },
      error: () => {
        this.actionError.set('Action failed. Please try again.');
        this.actionLoading.set(false);
      },
    });
  }

  removeFromBlacklist(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.actionLoading.set(true);
    this.actionError.set(null);

    this.customersService.removeFromBlacklist(id).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.load();
      },
      error: () => {
        this.actionError.set('Action failed. Please try again.');
        this.actionLoading.set(false);
      },
    });
  }

  selectNotesTab(): void {
    this.activeTab.set('notes');
    if (this.notes().length === 0 && !this.notesLoading()) {
      this.loadNotes();
    }
  }

  loadNotes(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.notesLoading.set(true);
    this.customersService.getNotes(id).subscribe({
      next: (data) => {
        this.notes.set(data);
        this.notesLoading.set(false);
      },
      error: () => this.notesLoading.set(false),
    });
  }

  saveNote(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.notesText.trim()) return;

    this.noteSaving.set(true);
    this.noteError.set(null);

    this.customersService.addNote(id, this.notesText.trim()).subscribe({
      next: (note) => {
        this.notes.update((list) => [note, ...list]);
        this.notesText = '';
        this.noteSaving.set(false);
      },
      error: (err: any) => {
        this.noteError.set(err?.message || 'Failed to save note.');
        this.noteSaving.set(false);
      },
    });
  }

  avgOrder(): string {
    const c = this.customer();
    if (!c || c.orderCount === 0) return '—';
    return (c.totalSpent / c.orderCount).toFixed(3) + ' KD';
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
  }

  formatAmount(amount: number): string {
    return amount.toFixed(3) + ' KD';
  }

  formatDate(isoString: string): string {
    try {
      return new Date(isoString).toLocaleDateString();
    } catch {
      return '—';
    }
  }

  formatAddress(addr: import('../../../core/models/customer.model').CustomerAddress): string {
    return [addr.building, addr.street, addr.block, addr.area, addr.city]
      .filter((v) => !!v)
      .join(', ');
  }
}
