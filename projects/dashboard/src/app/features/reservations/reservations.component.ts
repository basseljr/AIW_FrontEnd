import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { ReservationsService } from '../../core/services/reservations.service';
import { BranchesService } from '../../core/services/branches.service';
import {
  Reservation,
  ReservationStatus,
  CreateReservationRequest,
} from '../../core/models/reservation.model';
import { BranchListItem } from '../../core/models/branch.model';

export type ReservationTab = 'today' | 'upcoming' | 'past' | 'cancelled';

interface AddForm {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  specialRequests: string;
  internalNotes: string;
}

function emptyForm(): AddForm {
  return {
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    reservationDate: '',
    reservationTime: '',
    partySize: 2,
    specialRequests: '',
    internalNotes: '',
  };
}

const SHIMMER_ROWS = [1, 2, 3, 4, 5];

@Component({
  selector: 'db-reservations',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-rv" [class.db-rv--rtl]="false">

      <!-- Page header -->
      <header class="db-rv__header">
        <h1 class="db-rv__title">{{ 'reservations_page.title' | translate }}</h1>
        <button class="db-rv__btn-primary" type="button" (click)="showAddForm.set(true)">
          + {{ 'reservations_page.add_reservation' | translate }}
        </button>
      </header>

      <!-- Tabs -->
      <div class="db-rv__tabs" role="tablist">
        @for (tab of tabs; track tab.value) {
          <button
            class="db-rv__tab"
            type="button"
            role="tab"
            [class.db-rv__tab--active]="activeTab() === tab.value"
            [attr.aria-selected]="activeTab() === tab.value"
            (click)="switchTab(tab.value)"
          >{{ tab.labelKey | translate }}</button>
        }
      </div>

      <!-- Filters -->
      <div class="db-rv__filters" role="search">

        <!-- Search by guest name -->
        <div class="db-rv__search-wrap">
          <svg class="db-rv__search-icon" width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            #searchEl
            class="db-rv__input db-rv__search"
            type="search"
            [placeholder]="'reservations_page.search_placeholder' | translate"
            [value]="searchInput()"
            (input)="searchInput.set(searchEl.value)"
            [attr.aria-label]="'reservations_page.search_placeholder' | translate"
          />
        </div>

        <!-- Status filter (hidden for cancelled tab) -->
        @if (activeTab() !== 'cancelled') {
          <select
            class="db-rv__input db-rv__select"
            [ngModel]="statusFilter()"
            (ngModelChange)="statusFilter.set($event)"
            [attr.aria-label]="'reservations_page.filter_status' | translate"
          >
            <option value="">{{ 'reservations_page.filter_status' | translate }}</option>
            <option value="pending">{{ 'reservations_page.status_pending' | translate }}</option>
            <option value="confirmed">{{ 'reservations_page.status_confirmed' | translate }}</option>
            <option value="seated">{{ 'reservations_page.status_seated' | translate }}</option>
            <option value="completed">{{ 'reservations_page.status_completed' | translate }}</option>
          </select>
        }

        <!-- Date filter -->
        <input
          class="db-rv__input db-rv__date"
          type="date"
          [ngModel]="dateFilter()"
          (ngModelChange)="dateFilter.set($event)"
          [attr.aria-label]="'reservations_page.filter_date' | translate"
        />
      </div>

      <!-- Add Reservation form -->
      @if (showAddForm()) {
        <div class="db-rv__form-backdrop" (click)="closeForm()">
          <div class="db-rv__form-panel" (click)="$event.stopPropagation()" role="dialog"
               [attr.aria-label]="'reservations_page.add_reservation' | translate">
            <div class="db-rv__form-header">
              <h2 class="db-rv__form-title">{{ 'reservations_page.add_reservation' | translate }}</h2>
              <button class="db-rv__form-close" type="button" (click)="closeForm()"
                      [attr.aria-label]="'reservations_page.close_form' | translate">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            @if (formError()) {
              <div class="db-rv__form-error" role="alert">{{ formError() }}</div>
            }

            <form class="db-rv__form-body" (ngSubmit)="submitAdd()">
              <!-- Branch selector (only when tenant has multiple branches) -->
              @if (branches().length > 1) {
                <div class="db-rv__field">
                  <label class="db-rv__label" for="rv-branch">
                    {{ 'reservations_page.branch' | translate }}
                    <span class="db-rv__required" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="rv-branch"
                    class="db-rv__input db-rv__field-input"
                    [class.db-rv__input--error]="formTouched() && !selectedBranchId()"
                    [ngModel]="selectedBranchId()"
                    (ngModelChange)="selectedBranchId.set($event)"
                    name="branchId"
                    required
                  >
                    <option value="">{{ 'reservations_page.select_branch' | translate }}</option>
                    @for (branch of branches(); track branch.id) {
                      <option [value]="branch.id">{{ branch.nameEn }}</option>
                    }
                  </select>
                </div>
              }

              <!-- Guest Name -->
              <div class="db-rv__field">
                <label class="db-rv__label" for="rv-guest-name">
                  {{ 'reservations_page.customer_name' | translate }}
                  <span class="db-rv__required" aria-hidden="true">*</span>
                </label>
                <input
                  id="rv-guest-name"
                  class="db-rv__input db-rv__field-input"
                  [class.db-rv__input--error]="formTouched() && !form().guestName"
                  type="text"
                  [(ngModel)]="form().guestName"
                  name="guestName"
                  [placeholder]="'reservations_page.customer_name_placeholder' | translate"
                  required
                />
              </div>

              <!-- Phone -->
              <div class="db-rv__field">
                <label class="db-rv__label" for="rv-phone">
                  {{ 'reservations_page.customer_phone' | translate }}
                  <span class="db-rv__required" aria-hidden="true">*</span>
                </label>
                <input
                  id="rv-phone"
                  class="db-rv__input db-rv__field-input"
                  [class.db-rv__input--error]="formTouched() && !form().guestPhone"
                  type="tel"
                  [(ngModel)]="form().guestPhone"
                  name="guestPhone"
                  [placeholder]="'reservations_page.customer_phone_placeholder' | translate"
                  required
                />
              </div>

              <!-- Date + Time -->
              <div class="db-rv__field-row">
                <div class="db-rv__field">
                  <label class="db-rv__label" for="rv-date">
                    {{ 'reservations_page.reservation_date' | translate }}
                    <span class="db-rv__required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="rv-date"
                    class="db-rv__input db-rv__field-input"
                    [class.db-rv__input--error]="formTouched() && !form().reservationDate"
                    type="date"
                    [(ngModel)]="form().reservationDate"
                    name="reservationDate"
                    required
                  />
                </div>

                <div class="db-rv__field">
                  <label class="db-rv__label" for="rv-time">
                    {{ 'reservations_page.reservation_time' | translate }}
                    <span class="db-rv__required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="rv-time"
                    class="db-rv__input db-rv__field-input"
                    [class.db-rv__input--error]="formTouched() && !form().reservationTime"
                    type="time"
                    [(ngModel)]="form().reservationTime"
                    name="reservationTime"
                    required
                  />
                </div>
              </div>

              <!-- Party Size -->
              <div class="db-rv__field">
                <label class="db-rv__label" for="rv-party">
                  {{ 'reservations_page.party_size' | translate }}
                  <span class="db-rv__required" aria-hidden="true">*</span>
                </label>
                <input
                  id="rv-party"
                  class="db-rv__input db-rv__field-input"
                  type="number"
                  min="1"
                  max="100"
                  [(ngModel)]="form().partySize"
                  name="partySize"
                  required
                />
              </div>

              <!-- Special Requests -->
              <div class="db-rv__field">
                <label class="db-rv__label" for="rv-requests">
                  {{ 'reservations_page.special_requests' | translate }}
                </label>
                <textarea
                  id="rv-requests"
                  class="db-rv__input db-rv__textarea"
                  [(ngModel)]="form().specialRequests"
                  name="specialRequests"
                  rows="3"
                  [placeholder]="'reservations_page.special_requests_placeholder' | translate"
                ></textarea>
              </div>

              <!-- Internal Notes -->
              <div class="db-rv__field">
                <label class="db-rv__label" for="rv-notes">
                  {{ 'reservations_page.internal_notes' | translate }}
                </label>
                <textarea
                  id="rv-notes"
                  class="db-rv__input db-rv__textarea"
                  [(ngModel)]="form().internalNotes"
                  name="internalNotes"
                  rows="2"
                  [placeholder]="'reservations_page.internal_notes_placeholder' | translate"
                ></textarea>
              </div>

              <div class="db-rv__form-actions">
                <button class="db-rv__btn-ghost" type="button" (click)="closeForm()">
                  {{ 'reservations_page.cancel' | translate }}
                </button>
                <button class="db-rv__btn-primary" type="submit" [disabled]="saving()">
                  @if (saving()) {
                    <span class="db-rv__spinner" aria-hidden="true"></span>
                  }
                  {{ 'reservations_page.save_reservation' | translate }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Table wrapper -->
      <div class="db-rv__table-wrap">
        <table class="db-rv__table" role="table">
          <thead class="db-rv__thead">
            <tr>
              <th class="db-rv__th" scope="col">{{ 'reservations_page.col_id' | translate }}</th>
              <th class="db-rv__th" scope="col">{{ 'reservations_page.col_customer' | translate }}</th>
              <th class="db-rv__th" scope="col">{{ 'reservations_page.col_phone' | translate }}</th>
              <th class="db-rv__th db-rv__th--num" scope="col">{{ 'reservations_page.col_party_size' | translate }}</th>
              <th class="db-rv__th" scope="col">{{ 'reservations_page.col_datetime' | translate }}</th>
              <th class="db-rv__th" scope="col">{{ 'reservations_page.col_status' | translate }}</th>
              <th class="db-rv__th db-rv__th--actions" scope="col">
                <span class="db-rv__sr">{{ 'reservations_page.col_actions' | translate }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="db-rv__tbody">

            <!-- Loading skeleton -->
            @if (loading()) {
              @for (_ of shimmerRows; track $index) {
                <tr class="db-rv__row db-rv__row--skeleton" aria-hidden="true">
                  <td class="db-rv__td"><span class="db-rv__sk db-rv__sk--id"></span></td>
                  <td class="db-rv__td"><span class="db-rv__sk db-rv__sk--name"></span></td>
                  <td class="db-rv__td"><span class="db-rv__sk db-rv__sk--phone"></span></td>
                  <td class="db-rv__td db-rv__td--num"><span class="db-rv__sk db-rv__sk--narrow"></span></td>
                  <td class="db-rv__td"><span class="db-rv__sk db-rv__sk--datetime"></span></td>
                  <td class="db-rv__td"><span class="db-rv__sk db-rv__sk--badge"></span></td>
                  <td class="db-rv__td db-rv__td--actions"></td>
                </tr>
              }
            }

            <!-- Populated rows -->
            @if (!loading()) {
              @for (reservation of filteredItems(); track reservation.id) {
                <tr class="db-rv__row">
                  <!-- Reservation identifier -->
                  <td class="db-rv__td">
                    <span class="db-rv__res-id numeric-identifier">
                      #{{ reservation.id.slice(-6).toUpperCase() }}
                    </span>
                  </td>

                  <!-- Customer name -->
                  <td class="db-rv__td">
                    <span class="db-rv__customer-name">{{ reservation.guestName || '—' }}</span>
                  </td>

                  <!-- Phone -->
                  <td class="db-rv__td">
                    <span class="db-rv__phone">{{ reservation.guestPhone || '—' }}</span>
                  </td>

                  <!-- Party size -->
                  <td class="db-rv__td db-rv__td--num">
                    <span class="db-rv__party numeric-identifier">{{ reservation.partySize }}</span>
                  </td>

                  <!-- Date & time -->
                  <td class="db-rv__td">
                    <span class="db-rv__datetime numeric-identifier">
                      {{ formatDateTime(reservation.reservationDate, reservation.reservationTime) }}
                    </span>
                  </td>

                  <!-- Status badge -->
                  <td class="db-rv__td">
                    <span
                      class="db-rv__badge"
                      [attr.data-status]="reservation.status"
                    >{{ getStatusKey(reservation.status) | translate }}</span>
                  </td>

                  <!-- Actions -->
                  <td class="db-rv__td db-rv__td--actions">
                    <div class="db-rv__action-group">
                      @if (canConfirm(reservation.status)) {
                        <button
                          class="db-rv__action-btn db-rv__action-btn--confirm"
                          type="button"
                          [disabled]="updatingId() === reservation.id"
                          (click)="updateStatus(reservation.id, 'confirmed')"
                        >{{ 'reservations_page.action_confirm' | translate }}</button>
                      }
                      @if (canSeat(reservation.status)) {
                        <button
                          class="db-rv__action-btn db-rv__action-btn--seat"
                          type="button"
                          [disabled]="updatingId() === reservation.id"
                          (click)="updateStatus(reservation.id, 'seated')"
                        >{{ 'reservations_page.action_seat' | translate }}</button>
                      }
                      @if (canComplete(reservation.status)) {
                        <button
                          class="db-rv__action-btn db-rv__action-btn--complete"
                          type="button"
                          [disabled]="updatingId() === reservation.id"
                          (click)="updateStatus(reservation.id, 'completed')"
                        >{{ 'reservations_page.action_complete' | translate }}</button>
                      }
                      @if (canCancel(reservation.status)) {
                        <button
                          class="db-rv__action-btn db-rv__action-btn--cancel"
                          type="button"
                          [disabled]="updatingId() === reservation.id"
                          (click)="updateStatus(reservation.id, 'cancelled')"
                        >{{ 'reservations_page.action_cancel' | translate }}</button>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>

        <!-- Empty state -->
        @if (!loading() && !error() && filteredItems().length === 0) {
          <div class="db-rv__empty" role="status">
            <svg class="db-rv__empty-icon" width="48" height="48" viewBox="0 0 48 48"
                 fill="none" aria-hidden="true">
              <rect x="6" y="8" width="36" height="32" rx="3"
                    stroke="var(--border-strong)" stroke-width="2"/>
              <path d="M6 16h36" stroke="var(--border-strong)" stroke-width="2"/>
              <path d="M16 6v6M32 6v6" stroke="var(--border-strong)" stroke-width="2"
                    stroke-linecap="round"/>
              <path d="M14 26h20M14 32h14" stroke="var(--border-strong)" stroke-width="2"
                    stroke-linecap="round"/>
            </svg>
            <p class="db-rv__empty-title">{{ 'reservations_page.empty_title' | translate }}</p>
            <p class="db-rv__empty-sub">{{ 'reservations_page.empty_sub' | translate }}</p>
          </div>
        }

        <!-- Error state -->
        @if (error() && !loading()) {
          <div class="db-rv__error" role="alert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ 'reservations_page.error' | translate }}</span>
            <button class="db-rv__retry" type="button" (click)="loadReservations()">
              {{ 'reservations_page.retry' | translate }}
            </button>
          </div>
        }
      </div>

    </div>
  `,
  styles: [
    `
      /* ─── Layout ──────────────────────────────────────────────────── */
      .db-rv {
        padding-block: var(--space-xl, 2rem);
        padding-inline: var(--space-xl, 2rem);
        container-type: inline-size;
        container-name: reservations-page;
      }

      /* ─── Header ──────────────────────────────────────────────────── */
      .db-rv__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-block-end: 1.5rem;
        flex-wrap: wrap;
      }

      .db-rv__title {
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
        letter-spacing: -0.025em;
        line-height: 1.3;
      }

      /* ─── Tabs ────────────────────────────────────────────────────── */
      .db-rv__tabs {
        display: flex;
        gap: 0;
        border-block-end: 2px solid var(--border);
        margin-block-end: 1.25rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }

      .db-rv__tabs::-webkit-scrollbar {
        display: none;
      }

      .db-rv__tab {
        padding-block: 0.625rem;
        padding-inline: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        font-family: inherit;
        color: var(--text-muted);
        background: transparent;
        border: none;
        border-block-end: 2px solid transparent;
        margin-block-end: -2px;
        cursor: pointer;
        white-space: nowrap;
        transition:
          color var(--motion-fast) ease,
          border-color var(--motion-fast) ease;
      }

      .db-rv__tab:hover {
        color: var(--text);
      }

      .db-rv__tab--active {
        color: var(--accent);
        font-weight: 600;
        border-block-end-color: var(--accent);
      }

      /* ─── Filters ─────────────────────────────────────────────────── */
      .db-rv__filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-block-end: 1.25rem;
        align-items: center;
      }

      .db-rv__input {
        font-family: inherit;
        font-size: 0.8125rem;
        color: var(--text);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-control);
        padding-block: 0.5rem;
        padding-inline: 0.75rem;
        outline: none;
        transition:
          border-color var(--motion-base) ease,
          box-shadow var(--motion-base) ease;
        block-size: 36px;
        box-sizing: border-box;
      }

      .db-rv__input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
      }

      .db-rv__input--error {
        border-color: var(--danger);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 12%, transparent);
      }

      .db-rv__input::placeholder {
        color: var(--text-subtle);
      }

      .db-rv__search-wrap {
        position: relative;
        flex: 1;
        min-inline-size: 180px;
        max-inline-size: 280px;
      }

      .db-rv__search-icon {
        position: absolute;
        inset-block-start: 50%;
        inset-inline-start: 0.625rem;
        transform: translateY(-50%);
        color: var(--text-subtle);
        pointer-events: none;
      }

      .db-rv__search {
        inline-size: 100%;
        padding-inline-start: 2rem;
      }

      .db-rv__select {
        padding-inline-end: 2rem;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: calc(100% - 0.625rem) 50%;
        cursor: pointer;
        min-inline-size: 130px;
      }

      [dir='rtl'] .db-rv__select {
        background-position: 0.625rem 50%;
        padding-inline-end: 0.75rem;
        padding-inline-start: 2rem;
      }

      .db-rv__date {
        min-inline-size: 140px;
        cursor: pointer;
      }

      /* ─── Add Form (slide-in panel) ───────────────────────────────── */
      .db-rv__form-backdrop {
        position: fixed;
        inset: 0;
        background: var(--overlay-scrim, rgba(0, 0, 0, 0.5));
        z-index: 200;
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        animation: db-rv-fade-in 0.15s ease;
      }

      @keyframes db-rv-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      .db-rv__form-panel {
        background: var(--surface);
        block-size: 100%;
        inline-size: min(460px, 100vw);
        overflow-y: auto;
        box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12);
        animation: db-rv-slide-in 0.2s ease;
      }

      @keyframes db-rv-slide-in {
        from { transform: translateX(100%); }
        to   { transform: translateX(0); }
      }

      [dir='rtl'] .db-rv__form-panel {
        inset-inline-start: 0;
        inset-inline-end: auto;
        box-shadow: 8px 0 32px rgba(0, 0, 0, 0.12);
        animation: db-rv-slide-in-rtl 0.2s ease;
      }

      @keyframes db-rv-slide-in-rtl {
        from { transform: translateX(-100%); }
        to   { transform: translateX(0); }
      }

      .db-rv__form-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-block-end: 1px solid var(--border);
        position: sticky;
        inset-block-start: 0;
        background: var(--surface);
        z-index: 1;
      }

      .db-rv__form-title {
        font-size: 1.0625rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
      }

      .db-rv__form-close {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 2rem;
        block-size: 2rem;
        border: none;
        background: transparent;
        color: var(--text-muted);
        border-radius: var(--radius-control);
        cursor: pointer;
        transition: background-color var(--motion-fast) ease;
      }

      .db-rv__form-close:hover {
        background: var(--surface-alt);
        color: var(--text);
      }

      .db-rv__form-error {
        margin: 0.75rem 1.5rem 0;
        padding: 0.75rem 1rem;
        background: color-mix(in srgb, var(--danger) 10%, transparent);
        color: var(--danger);
        border: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
        border-radius: var(--radius-control);
        font-size: 0.875rem;
      }

      .db-rv__form-body {
        padding: 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .db-rv__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .db-rv__field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .db-rv__label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text);
      }

      .db-rv__required {
        color: var(--danger);
        margin-inline-start: 0.125rem;
      }

      .db-rv__field-input {
        block-size: 38px;
        inline-size: 100%;
        box-sizing: border-box;
      }

      .db-rv__textarea {
        block-size: auto;
        inline-size: 100%;
        box-sizing: border-box;
        resize: vertical;
        padding-block: 0.5rem;
        line-height: 1.5;
      }

      .db-rv__form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding-block-start: 0.5rem;
        border-block-start: 1px solid var(--border);
        margin-block-start: 0.5rem;
        padding-block-end: 0.5rem;
      }

      /* ─── Buttons ─────────────────────────────────────────────────── */
      .db-rv__btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding-block: 0.5rem;
        padding-inline: 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        font-family: inherit;
        color: var(--on-accent);
        background: var(--accent);
        border: none;
        border-radius: var(--radius-control);
        cursor: pointer;
        white-space: nowrap;
        transition: background-color var(--motion-base) ease;
      }

      .db-rv__btn-primary:hover:not(:disabled) {
        background: var(--accent-hover);
      }

      .db-rv__btn-primary:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .db-rv__btn-ghost {
        display: inline-flex;
        align-items: center;
        padding-block: 0.5rem;
        padding-inline: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        font-family: inherit;
        color: var(--text-muted);
        background: transparent;
        border: 1px solid var(--border);
        border-radius: var(--radius-control);
        cursor: pointer;
        transition:
          background-color var(--motion-fast) ease,
          color var(--motion-fast) ease;
      }

      .db-rv__btn-ghost:hover {
        background: var(--surface-alt);
        color: var(--text);
      }

      /* Spinner */
      .db-rv__spinner {
        display: inline-block;
        inline-size: 14px;
        block-size: 14px;
        border: 2px solid rgba(255, 255, 255, 0.35);
        border-block-start-color: #fff;
        border-radius: 50%;
        animation: db-rv-spin 0.7s linear infinite;
        flex-shrink: 0;
      }

      @keyframes db-rv-spin {
        to { transform: rotate(360deg); }
      }

      /* ─── Table wrapper ───────────────────────────────────────────── */
      .db-rv__table-wrap {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .db-rv__table {
        inline-size: 100%;
        min-inline-size: 680px;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      .db-rv__thead {
        background: var(--surface-alt);
        border-block-end: 1px solid var(--border);
      }

      .db-rv__th {
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

      .db-rv__th--num {
        text-align: end;
      }

      .db-rv__th--actions {
        inline-size: 200px;
      }

      /* ─── Rows ────────────────────────────────────────────────────── */
      .db-rv__row {
        border-block-end: 1px solid var(--border);
        transition: background-color var(--motion-fast) ease;
      }

      .db-rv__row:last-child {
        border-block-end: none;
      }

      .db-rv__row:hover {
        background: var(--surface-alt);
      }

      /* ─── Cells ───────────────────────────────────────────────────── */
      .db-rv__td {
        padding-block: 0.75rem;
        padding-inline: 0.875rem 0.5rem;
        vertical-align: middle;
        color: var(--text);
        white-space: nowrap;
      }

      .db-rv__td--num {
        text-align: end;
      }

      .db-rv__td--actions {
        padding-inline-end: 0.875rem;
      }

      .db-rv__res-id {
        font-weight: 600;
        font-size: 0.8125rem;
        color: var(--accent);
        font-variant-numeric: tabular-nums;
      }

      .db-rv__customer-name {
        font-weight: 500;
        max-inline-size: 160px;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: middle;
      }

      .db-rv__phone {
        font-size: 0.8125rem;
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
      }

      .db-rv__party {
        font-variant-numeric: tabular-nums;
        font-size: 0.875rem;
        color: var(--text);
      }

      .db-rv__datetime {
        font-size: 0.8125rem;
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
      }

      /* ─── Status badges ───────────────────────────────────────────── */
      .db-rv__badge {
        display: inline-flex;
        align-items: center;
        padding-block: 0.2rem;
        padding-inline: 0.5rem;
        border-radius: var(--radius-pill);
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .db-rv__badge[data-status='pending'] {
        background: color-mix(in srgb, var(--warning) 14%, transparent);
        color: var(--warning);
        outline: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
      }

      .db-rv__badge[data-status='confirmed'] {
        background: color-mix(in srgb, var(--accent) 10%, transparent);
        color: var(--accent);
        outline: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
      }

      .db-rv__badge[data-status='seated'] {
        background: color-mix(in srgb, var(--info) 12%, transparent);
        color: var(--info);
        outline: 1px solid color-mix(in srgb, var(--info) 25%, transparent);
      }

      .db-rv__badge[data-status='completed'] {
        background: color-mix(in srgb, var(--success) 12%, transparent);
        color: var(--success);
        outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
      }

      .db-rv__badge[data-status='cancelled'],
      .db-rv__badge[data-status='no_show'] {
        background: color-mix(in srgb, var(--border-strong) 20%, transparent);
        color: var(--text-subtle);
        outline: 1px solid color-mix(in srgb, var(--border-strong) 35%, transparent);
      }

      /* ─── Action buttons ──────────────────────────────────────────── */
      .db-rv__action-group {
        display: flex;
        gap: 0.375rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .db-rv__action-btn {
        display: inline-flex;
        align-items: center;
        padding-block: 0.25rem;
        padding-inline: 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        font-family: inherit;
        border-radius: var(--radius-control);
        border: 1px solid transparent;
        cursor: pointer;
        white-space: nowrap;
        transition:
          background-color var(--motion-fast) ease,
          opacity var(--motion-fast) ease;
      }

      .db-rv__action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .db-rv__action-btn--confirm {
        background: color-mix(in srgb, var(--accent) 10%, transparent);
        color: var(--accent);
        border-color: color-mix(in srgb, var(--accent) 25%, transparent);
      }

      .db-rv__action-btn--confirm:hover:not(:disabled) {
        background: color-mix(in srgb, var(--accent) 18%, transparent);
      }

      .db-rv__action-btn--seat {
        background: color-mix(in srgb, var(--info) 10%, transparent);
        color: var(--info);
        border-color: color-mix(in srgb, var(--info) 25%, transparent);
      }

      .db-rv__action-btn--seat:hover:not(:disabled) {
        background: color-mix(in srgb, var(--info) 18%, transparent);
      }

      .db-rv__action-btn--complete {
        background: color-mix(in srgb, var(--success) 10%, transparent);
        color: var(--success);
        border-color: color-mix(in srgb, var(--success) 25%, transparent);
      }

      .db-rv__action-btn--complete:hover:not(:disabled) {
        background: color-mix(in srgb, var(--success) 18%, transparent);
      }

      .db-rv__action-btn--cancel {
        background: color-mix(in srgb, var(--danger) 8%, transparent);
        color: var(--danger);
        border-color: color-mix(in srgb, var(--danger) 22%, transparent);
      }

      .db-rv__action-btn--cancel:hover:not(:disabled) {
        background: color-mix(in srgb, var(--danger) 14%, transparent);
      }

      /* ─── Shimmer skeleton ────────────────────────────────────────── */
      .db-rv__row--skeleton {
        pointer-events: none;
      }

      .db-rv__sk {
        display: inline-block;
        block-size: 14px;
        border-radius: 4px;
        background: linear-gradient(
          90deg,
          var(--border) 25%,
          var(--surface-alt) 50%,
          var(--border) 75%
        );
        background-size: 200% 100%;
        animation: db-rv-shimmer 1.4s infinite;
      }

      .db-rv__sk--id       { inline-size: 64px; }
      .db-rv__sk--name     { inline-size: 120px; }
      .db-rv__sk--phone    { inline-size: 100px; }
      .db-rv__sk--narrow   { inline-size: 32px; }
      .db-rv__sk--datetime { inline-size: 140px; }
      .db-rv__sk--badge    { inline-size: 72px; block-size: 20px; border-radius: 999px; }

      @keyframes db-rv-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* ─── Empty state ─────────────────────────────────────────────── */
      .db-rv__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding-block: 4rem 3.5rem;
        gap: 0.75rem;
        text-align: center;
      }

      .db-rv__empty-icon {
        color: var(--border-strong);
        opacity: 0.7;
      }

      .db-rv__empty-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text);
        margin: 0;
      }

      .db-rv__empty-sub {
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin: 0;
        max-inline-size: 36ch;
        line-height: 1.55;
      }

      /* ─── Error state ─────────────────────────────────────────────── */
      .db-rv__error {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.625rem;
        padding-block: 2.5rem;
        color: var(--danger);
        font-size: 0.875rem;
        font-weight: 500;
      }

      .db-rv__retry {
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
        transition: background-color var(--motion-base) ease;
      }

      .db-rv__retry:hover {
        background: var(--accent-hover);
      }

      /* ─── Screen-reader only ──────────────────────────────────────── */
      .db-rv__sr {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      }

      /* ─── Responsive ──────────────────────────────────────────────── */
      @container reservations-page (max-width: 768px) {
        .db-rv {
          padding-inline: 1rem;
          padding-block: 1.25rem;
        }

        .db-rv__header {
          flex-direction: column;
          align-items: flex-start;
        }

        .db-rv__filters {
          row-gap: 0.5rem;
        }

        .db-rv__search-wrap {
          max-inline-size: 100%;
          flex-basis: 100%;
        }

        .db-rv__field-row {
          grid-template-columns: 1fr;
        }
      }

      @container reservations-page (max-width: 480px) {
        .db-rv {
          padding-inline: 0.75rem;
        }

        .db-rv__title {
          font-size: 1.125rem;
        }
      }
    `,
  ],
})
export class ReservationsComponent implements OnInit {
  private readonly service = inject(ReservationsService);
  private readonly branchesService = inject(BranchesService);

  // ── State signals ──────────────────────────────────────────────────────────
  readonly activeTab = signal<ReservationTab>('today');
  readonly reservations = signal<Reservation[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly showAddForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly formTouched = signal(false);
  readonly updatingId = signal<string | null>(null);
  readonly searchInput = signal('');
  readonly statusFilter = signal('');
  readonly dateFilter = signal('');
  readonly form = signal<AddForm>(emptyForm());
  readonly branches = signal<BranchListItem[]>([]);
  readonly selectedBranchId = signal<string>('');

  readonly shimmerRows = SHIMMER_ROWS;

  readonly tabs: Array<{ value: ReservationTab; labelKey: string }> = [
    { value: 'today',     labelKey: 'reservations_page.tab_today' },
    { value: 'upcoming',  labelKey: 'reservations_page.tab_upcoming' },
    { value: 'past',      labelKey: 'reservations_page.tab_past' },
    { value: 'cancelled', labelKey: 'reservations_page.tab_cancelled' },
  ];

  readonly filteredItems = computed(() => {
    const search = this.searchInput().toLowerCase();
    const status = this.statusFilter();
    const date   = this.dateFilter();
    const today  = new Date();
    today.setHours(0, 0, 0, 0);

    return this.reservations().filter((r) => {
      // Tab filter
      const resDate = new Date(r.reservationDate);
      resDate.setHours(0, 0, 0, 0);
      const tab = this.activeTab();

      if (tab === 'cancelled') {
        if (r.status !== 'cancelled' && r.status !== 'no_show') return false;
      } else if (tab === 'today') {
        if (resDate.getTime() !== today.getTime()) return false;
        if (r.status === 'cancelled' || r.status === 'no_show') return false;
      } else if (tab === 'upcoming') {
        if (resDate <= today) return false;
        if (r.status === 'cancelled' || r.status === 'no_show') return false;
      } else if (tab === 'past') {
        if (resDate >= today) return false;
        if (r.status === 'cancelled' || r.status === 'no_show') return false;
      }

      // Status filter (within non-cancelled tabs)
      if (status && r.status !== status) return false;

      // Date filter
      if (date && r.reservationDate.substring(0, 10) !== date) return false;

      // Search filter
      if (search) {
        const name  = (r.guestName ?? '').toLowerCase();
        const phone = (r.guestPhone ?? '').toLowerCase();
        if (!name.includes(search) && !phone.includes(search)) return false;
      }

      return true;
    });
  });

  ngOnInit(): void {
    this.loadBranches();
    this.loadReservations();
  }

  switchTab(tab: ReservationTab): void {
    this.activeTab.set(tab);
    this.statusFilter.set('');
  }

  loadBranches(): void {
    this.branchesService.getAll().subscribe({
      next: (list) => {
        const active = list.filter((b) => b.isActive);
        this.branches.set(active);
        if (active.length === 1) this.selectedBranchId.set(active[0].id);
      },
    });
  }

  loadReservations(): void {
    this.loading.set(true);
    this.error.set(false);

    this.service.getReservations({ pageSize: 100 }).subscribe({
      next: (result) => {
        this.reservations.set(result.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  updateStatus(id: string, status: string): void {
    if (this.updatingId()) return;
    this.updatingId.set(id);

    this.service.patchStatus(id, { status }).subscribe({
      next: (updated) => {
        this.reservations.update((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updated } : r)),
        );
        this.updatingId.set(null);
      },
      error: () => {
        this.updatingId.set(null);
      },
    });
  }

  closeForm(): void {
    this.showAddForm.set(false);
    this.form.set(emptyForm());
    this.formTouched.set(false);
    this.formError.set(null);
    if (this.branches().length !== 1) this.selectedBranchId.set('');
  }

  submitAdd(): void {
    this.formTouched.set(true);
    const f = this.form();
    const branchId = this.selectedBranchId();

    if (!f.guestName || !f.guestPhone || !f.reservationDate || !f.reservationTime || !branchId) {
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const body: CreateReservationRequest = {
      branchId,
      guestName:        f.guestName,
      guestPhone:       f.guestPhone,
      guestEmail:       f.guestEmail || undefined,
      reservationDate:  f.reservationDate,
      reservationTime:  f.reservationTime + ':00',
      partySize:        f.partySize,
      specialRequests:  f.specialRequests || undefined,
    };

    this.service.create(body).subscribe({
      next: (created) => {
        this.reservations.update((prev) => [created, ...prev]);
        this.saving.set(false);
        this.closeForm();
      },
      error: () => {
        this.formError.set('reservations_page.save_error');
        this.saving.set(false);
      },
    });
  }

  // ── Status transition guards ───────────────────────────────────────────────
  canConfirm(status: ReservationStatus): boolean {
    return status === 'pending';
  }

  canSeat(status: ReservationStatus): boolean {
    return status === 'confirmed';
  }

  canComplete(status: ReservationStatus): boolean {
    return status === 'seated';
  }

  canCancel(status: ReservationStatus): boolean {
    return status === 'pending' || status === 'confirmed';
  }

  // ── Formatting helpers ─────────────────────────────────────────────────────
  formatDateTime(date: string, time: string): string {
    try {
      const d = new Date(date);
      const dateStr = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const t = time.substring(0, 5); // HH:mm
      return `${dateStr} ${t}`;
    } catch {
      return `${date} ${time}`;
    }
  }

  getStatusKey(status: ReservationStatus | string): string {
    const map: Record<string, string> = {
      pending:   'reservations_page.status_pending',
      confirmed: 'reservations_page.status_confirmed',
      seated:    'reservations_page.status_seated',
      completed: 'reservations_page.status_completed',
      cancelled: 'reservations_page.status_cancelled',
      no_show:   'reservations_page.status_no_show',
    };
    return map[status] ?? status;
  }
}
