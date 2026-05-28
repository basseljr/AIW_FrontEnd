import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { BranchesService } from '../../core/services/branches.service';
import { BranchListItem, UpsertBranchRequest, WorkingHourEntry } from '../../core/models/branch.model';

// Ordered Mon–Sun (dayOfWeek index)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const SHIMMER_ROWS = [1, 2, 3, 4, 5];

function defaultWorkingHours(): WorkingHourEntry[] {
  return DAY_ORDER.map((d) => ({
    dayOfWeek: d,
    openTime: '09:00',
    closeTime: '22:00',
    isClosed: false,
  }));
}

interface BranchFormState {
  id: string | null;
  nameEn: string;
  nameAr: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
  workingHours: WorkingHourEntry[];
}

function emptyForm(): BranchFormState {
  return {
    id: null,
    nameEn: '',
    nameAr: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
    isActive: true,
    workingHours: defaultWorkingHours(),
  };
}

@Component({
  selector: 'db-branches',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-br">
      <!-- Header -->
      <header class="db-br__header">
        <h1 class="db-br__title">{{ 'branches_page.title' | translate }}</h1>
        <button class="db-br__btn-primary" type="button" (click)="openAdd()">
          + {{ 'branches_page.add_branch' | translate }}
        </button>
      </header>

      <!-- Toast notification -->
      @if (toastMsg()) {
        <div
          class="db-br__toast"
          [attr.data-kind]="toastKind()"
          role="status"
          aria-live="polite"
        >{{ toastMsg() }}</div>
      }

      <!-- Error banner -->
      @if (error() && !loading()) {
        <div class="db-br__error-banner" role="alert">
          <span>{{ 'branches_page.error' | translate }}</span>
          <button class="db-br__retry" type="button" (click)="load()">
            {{ 'branches_page.retry' | translate }}
          </button>
        </div>
      }

      <!-- Main layout: table + side panel -->
      <div class="db-br__layout" [class.db-br__layout--with-panel]="panelOpen()">
        <!-- Table card -->
        <div class="db-br__table-wrap">
          <table class="db-br__table" role="table">
            <thead class="db-br__thead">
              <tr>
                <th class="db-br__th" scope="col">{{ 'branches_page.col_name_en' | translate }}</th>
                <th class="db-br__th" scope="col">{{ 'branches_page.col_name_ar' | translate }}</th>
                <th class="db-br__th" scope="col">{{ 'branches_page.col_address' | translate }}</th>
                <th class="db-br__th" scope="col">{{ 'branches_page.col_phone' | translate }}</th>
                <th class="db-br__th" scope="col">{{ 'branches_page.col_status' | translate }}</th>
                <th class="db-br__th db-br__th--actions" scope="col">
                  <span class="db-br__sr">{{ 'branches_page.col_actions' | translate }}</span>
                </th>
              </tr>
            </thead>
            <tbody class="db-br__tbody">
              @if (loading()) {
                @for (_ of shimmerRows; track $index) {
                  <tr class="db-br__row" aria-hidden="true">
                    <td class="db-br__td"><span class="db-br__sk db-br__sk--name"></span></td>
                    <td class="db-br__td"><span class="db-br__sk db-br__sk--name"></span></td>
                    <td class="db-br__td"><span class="db-br__sk db-br__sk--addr"></span></td>
                    <td class="db-br__td"><span class="db-br__sk db-br__sk--phone"></span></td>
                    <td class="db-br__td"><span class="db-br__sk db-br__sk--badge"></span></td>
                    <td class="db-br__td db-br__td--actions"></td>
                  </tr>
                }
              }
              @if (!loading()) {
                @for (branch of items(); track branch.id) {
                  <tr
                    class="db-br__row"
                    [class.db-br__row--selected]="selectedBranch()?.id === branch.id"
                    (click)="selectBranch(branch)"
                    style="cursor: pointer"
                  >
                    <td class="db-br__td">
                      <div class="db-br__name-cell">
                        <div class="db-br__avatar" aria-hidden="true">
                          {{ branch.nameEn.charAt(0).toUpperCase() }}
                        </div>
                        <span class="db-br__name-text">{{ branch.nameEn }}</span>
                      </div>
                    </td>
                    <td class="db-br__td">
                      <span class="db-br__ar-text">{{ branch.nameAr }}</span>
                    </td>
                    <td class="db-br__td">
                      <span class="db-br__muted">{{ branch.address || '—' }}</span>
                    </td>
                    <td class="db-br__td">
                      <span class="db-br__muted">{{ branch.phone || '—' }}</span>
                    </td>
                    <td class="db-br__td">
                      <span
                        class="db-br__badge"
                        [attr.data-status]="branch.isActive ? 'active' : 'inactive'"
                      >
                        {{ (branch.isActive ? 'branches_page.status_active' : 'branches_page.status_inactive') | translate }}
                      </span>
                    </td>
                    <td class="db-br__td db-br__td--actions" (click)="$event.stopPropagation()">
                      <div class="db-br__actions">
                        <button
                          class="db-br__action-btn db-br__action-btn--edit"
                          type="button"
                          [attr.aria-label]="'branches_page.edit_branch' | translate"
                          (click)="openEdit(branch)"
                        >{{ 'common.edit' | translate }}</button>
                        <button
                          class="db-br__action-btn db-br__action-btn--del"
                          type="button"
                          [attr.aria-label]="'branches_page.delete_branch' | translate"
                          (click)="confirmDelete(branch)"
                        >{{ 'common.delete' | translate }}</button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (!loading() && !error() && items().length === 0) {
            <div class="db-br__empty" role="status">
              <div class="db-br__empty-icon" aria-hidden="true">🏪</div>
              <p class="db-br__empty-text">{{ 'branches_page.no_branches' | translate }}</p>
              <button class="db-br__btn-primary" type="button" (click)="openAdd()">
                {{ 'branches_page.add_first_branch' | translate }}
              </button>
            </div>
          }
        </div>

        <!-- Side panel: branch detail / add / edit -->
        @if (panelOpen()) {
          <aside class="db-br__panel" [attr.aria-label]="(isEditing() ? 'branches_page.edit_branch' : 'branches_page.add_branch') | translate">
            <div class="db-br__panel-header">
              <h2 class="db-br__panel-title">
                {{ (isEditing() ? 'branches_page.edit_branch' : panelMode() === 'detail' ? 'branches_page.branch_detail' : 'branches_page.add_branch') | translate }}
              </h2>
              <button
                class="db-br__panel-close"
                type="button"
                [attr.aria-label]="'common.close' | translate"
                (click)="closePanel()"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Detail view -->
            @if (panelMode() === 'detail' && selectedBranch()) {
              <div class="db-br__detail">
                <dl class="db-br__detail-list">
                  <div class="db-br__detail-row">
                    <dt>{{ 'branches_page.col_name_en' | translate }}</dt>
                    <dd>{{ selectedBranch()!.nameEn }}</dd>
                  </div>
                  <div class="db-br__detail-row">
                    <dt>{{ 'branches_page.col_name_ar' | translate }}</dt>
                    <dd>{{ selectedBranch()!.nameAr }}</dd>
                  </div>
                  <div class="db-br__detail-row">
                    <dt>{{ 'branches_page.col_address' | translate }}</dt>
                    <dd>{{ selectedBranch()!.address || '—' }}</dd>
                  </div>
                  <div class="db-br__detail-row">
                    <dt>{{ 'branches_page.col_phone' | translate }}</dt>
                    <dd>{{ selectedBranch()!.phone || '—' }}</dd>
                  </div>
                  <div class="db-br__detail-row">
                    <dt>{{ 'branches_page.col_status' | translate }}</dt>
                    <dd>
                      <span class="db-br__badge" [attr.data-status]="selectedBranch()!.isActive ? 'active' : 'inactive'">
                        {{ (selectedBranch()!.isActive ? 'branches_page.status_active' : 'branches_page.status_inactive') | translate }}
                      </span>
                    </dd>
                  </div>
                  @if (selectedBranch()!.latitude && selectedBranch()!.longitude) {
                    <div class="db-br__detail-row">
                      <dt>{{ 'branches_page.col_coords' | translate }}</dt>
                      <dd>{{ selectedBranch()!.latitude }}, {{ selectedBranch()!.longitude }}</dd>
                    </div>
                  }
                </dl>

                <!-- Stats placeholders -->
                <div class="db-br__stats-grid">
                  <div class="db-br__stat-card">
                    <span class="db-br__stat-label">{{ 'branches_page.stat_orders' | translate }}</span>
                    <span class="db-br__stat-value">0</span>
                  </div>
                  <div class="db-br__stat-card">
                    <span class="db-br__stat-label">{{ 'branches_page.stat_revenue' | translate }}</span>
                    <span class="db-br__stat-value">0 {{ 'common.currency' | translate }}</span>
                  </div>
                  <div class="db-br__stat-card">
                    <span class="db-br__stat-label">{{ 'branches_page.stat_staff' | translate }}</span>
                    <span class="db-br__stat-value">0</span>
                  </div>
                </div>

                <div class="db-br__detail-actions">
                  <button class="db-br__btn-primary" type="button" (click)="openEdit(selectedBranch()!)">
                    {{ 'branches_page.edit_branch' | translate }}
                  </button>
                </div>
              </div>
            }

            <!-- Add / Edit form -->
            @if (panelMode() === 'form') {
              <form class="db-br__form" (ngSubmit)="saveForm()" #branchForm="ngForm" novalidate>
                <div class="db-br__form-body">
                  <!-- Name EN -->
                  <div class="db-br__field">
                    <label class="db-br__label" for="br-nameEn">
                      {{ 'branches_page.field_name_en' | translate }}
                      <span class="db-br__required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="br-nameEn"
                      class="db-br__input"
                      [class.db-br__input--error]="submitted() && !form().nameEn.trim()"
                      type="text"
                      [placeholder]="'branches_page.placeholder_name_en' | translate"
                      [ngModel]="form().nameEn"
                      (ngModelChange)="patchForm({ nameEn: $event })"
                      name="nameEn"
                    />
                    @if (submitted() && !form().nameEn.trim()) {
                      <span class="db-br__field-error" role="alert">{{ 'errors.required' | translate }}</span>
                    }
                  </div>

                  <!-- Name AR -->
                  <div class="db-br__field">
                    <label class="db-br__label" for="br-nameAr">
                      {{ 'branches_page.field_name_ar' | translate }}
                      <span class="db-br__required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="br-nameAr"
                      class="db-br__input"
                      [class.db-br__input--error]="submitted() && !form().nameAr.trim()"
                      type="text"
                      dir="rtl"
                      [placeholder]="'branches_page.placeholder_name_ar' | translate"
                      [ngModel]="form().nameAr"
                      (ngModelChange)="patchForm({ nameAr: $event })"
                      name="nameAr"
                    />
                    @if (submitted() && !form().nameAr.trim()) {
                      <span class="db-br__field-error" role="alert">{{ 'errors.required' | translate }}</span>
                    }
                  </div>

                  <!-- Address -->
                  <div class="db-br__field">
                    <label class="db-br__label" for="br-address">
                      {{ 'branches_page.field_address' | translate }}
                    </label>
                    <input
                      id="br-address"
                      class="db-br__input"
                      type="text"
                      [placeholder]="'branches_page.placeholder_address' | translate"
                      [ngModel]="form().address"
                      (ngModelChange)="patchForm({ address: $event })"
                      name="address"
                    />
                  </div>

                  <!-- Phone -->
                  <div class="db-br__field">
                    <label class="db-br__label" for="br-phone">
                      {{ 'branches_page.field_phone' | translate }}
                    </label>
                    <input
                      id="br-phone"
                      class="db-br__input"
                      type="tel"
                      [placeholder]="'branches_page.placeholder_phone' | translate"
                      [ngModel]="form().phone"
                      (ngModelChange)="patchForm({ phone: $event })"
                      name="phone"
                    />
                  </div>

                  <!-- Lat / Lng -->
                  <div class="db-br__field-row">
                    <div class="db-br__field">
                      <label class="db-br__label" for="br-lat">{{ 'branches_page.field_latitude' | translate }}</label>
                      <input
                        id="br-lat"
                        class="db-br__input"
                        type="number"
                        step="any"
                        [placeholder]="'branches_page.placeholder_latitude' | translate"
                        [ngModel]="form().latitude"
                        (ngModelChange)="patchForm({ latitude: $event })"
                        name="latitude"
                      />
                    </div>
                    <div class="db-br__field">
                      <label class="db-br__label" for="br-lng">{{ 'branches_page.field_longitude' | translate }}</label>
                      <input
                        id="br-lng"
                        class="db-br__input"
                        type="number"
                        step="any"
                        [placeholder]="'branches_page.placeholder_longitude' | translate"
                        [ngModel]="form().longitude"
                        (ngModelChange)="patchForm({ longitude: $event })"
                        name="longitude"
                      />
                    </div>
                  </div>

                  <!-- Active toggle -->
                  <div class="db-br__field db-br__field--toggle">
                    <label class="db-br__toggle-label" for="br-active">
                      {{ 'branches_page.field_active' | translate }}
                    </label>
                    <button
                      id="br-active"
                      class="db-br__toggle"
                      type="button"
                      role="switch"
                      [attr.aria-checked]="form().isActive"
                      [class.db-br__toggle--on]="form().isActive"
                      (click)="patchForm({ isActive: !form().isActive })"
                    >
                      <span class="db-br__toggle-thumb"></span>
                    </button>
                  </div>

                  <!-- Working hours -->
                  <div class="db-br__section-label">{{ 'branches_page.field_working_hours' | translate }}</div>
                  <div class="db-br__hours-grid">
                    @for (hour of form().workingHours; track hour.dayOfWeek; let i = $index) {
                      <div class="db-br__hours-row">
                        <span class="db-br__day-name">{{ 'branches_page.day_' + dayKey(hour.dayOfWeek) | translate }}</span>
                        <button
                          class="db-br__day-closed-toggle"
                          type="button"
                          role="switch"
                          [attr.aria-checked]="!hour.isClosed"
                          [class.db-br__day-closed-toggle--open]="!hour.isClosed"
                          (click)="toggleDayClosed(i)"
                        >
                          {{ (hour.isClosed ? 'branches_page.day_closed' : 'branches_page.day_open') | translate }}
                        </button>
                        @if (!hour.isClosed) {
                          <input
                            class="db-br__time-input"
                            type="time"
                            [ngModel]="hour.openTime"
                            (ngModelChange)="setHourField(i, 'openTime', $event)"
                            [name]="'openTime_' + i"
                          />
                          <span class="db-br__time-sep">–</span>
                          <input
                            class="db-br__time-input"
                            type="time"
                            [ngModel]="hour.closeTime"
                            (ngModelChange)="setHourField(i, 'closeTime', $event)"
                            [name]="'closeTime_' + i"
                          />
                        }
                        @if (hour.isClosed) {
                          <span class="db-br__closed-label">{{ 'branches_page.day_closed' | translate }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Form footer -->
                <div class="db-br__form-footer">
                  <button
                    class="db-br__btn-ghost"
                    type="button"
                    [disabled]="saving()"
                    (click)="closePanel()"
                  >{{ 'common.cancel' | translate }}</button>
                  <button
                    class="db-br__btn-primary"
                    type="submit"
                    [disabled]="saving()"
                  >
                    @if (saving()) {
                      {{ 'common.saving' | translate }}
                    } @else {
                      {{ (isEditing() ? 'common.save' : 'branches_page.create_branch') | translate }}
                    }
                  </button>
                </div>
              </form>
            }
          </aside>
        }
      </div>

      <!-- Delete confirmation dialog -->
      @if (deleteTarget()) {
        <div class="db-br__overlay" role="dialog" aria-modal="true" [attr.aria-label]="'branches_page.delete_branch' | translate">
          <div class="db-br__dialog">
            <h3 class="db-br__dialog-title">{{ 'branches_page.delete_branch' | translate }}</h3>
            <p class="db-br__dialog-body">
              {{ 'branches_page.confirm_delete' | translate }}
              <strong>{{ deleteTarget()!.nameEn }}</strong>?
            </p>
            @if (deleteError()) {
              <p class="db-br__dialog-error" role="alert">{{ deleteError() }}</p>
            }
            <div class="db-br__dialog-actions">
              <button
                class="db-br__btn-ghost"
                type="button"
                [disabled]="deleting()"
                (click)="cancelDelete()"
              >{{ 'common.cancel' | translate }}</button>
              <button
                class="db-br__btn-danger"
                type="button"
                [disabled]="deleting()"
                (click)="executeDelete()"
              >
                @if (deleting()) {
                  {{ 'common.loading' | translate }}
                } @else {
                  {{ 'common.delete' | translate }}
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .db-br {
      padding-block: var(--space-xl, 2rem);
      padding-inline: var(--space-xl, 2rem);
      container-type: inline-size;
      position: relative;
    }

    /* ---- Header ---- */
    .db-br__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-block-end: 1.5rem;
    }

    .db-br__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    /* ---- Buttons ---- */
    .db-br__btn-primary {
      display: inline-flex;
      align-items: center;
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
      transition: opacity var(--motion-fast) ease;
    }

    .db-br__btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .db-br__btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .db-br__btn-ghost {
      display: inline-flex;
      align-items: center;
      padding-block: 0.5rem;
      padding-inline: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--text-muted);
      background: transparent;
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-br__btn-ghost:hover:not(:disabled) { background: var(--surface-alt); }
    .db-br__btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

    .db-br__btn-danger {
      display: inline-flex;
      align-items: center;
      padding-block: 0.5rem;
      padding-inline: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--on-accent, #fff);
      background: var(--danger);
      border: none;
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: opacity var(--motion-fast) ease;
    }

    .db-br__btn-danger:hover:not(:disabled) { opacity: 0.88; }
    .db-br__btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

    .db-br__retry {
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

    /* ---- Toast ---- */
    .db-br__toast {
      position: fixed;
      inset-block-end: 1.5rem;
      inset-inline-end: 1.5rem;
      z-index: 500;
      padding-block: 0.75rem;
      padding-inline: 1.25rem;
      border-radius: var(--radius-card);
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .db-br__toast[data-kind='success'] {
      background: var(--success);
      color: #fff;
    }

    .db-br__toast[data-kind='error'] {
      background: var(--danger);
      color: #fff;
    }

    /* ---- Error banner ---- */
    .db-br__error-banner {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding-block: 0.875rem;
      padding-inline: 1rem;
      margin-block-end: 1.25rem;
      background: color-mix(in srgb, var(--danger) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
      border-radius: var(--radius-card);
      color: var(--danger);
      font-size: 0.875rem;
    }

    /* ---- Layout ---- */
    .db-br__layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
      align-items: start;
    }

    .db-br__layout--with-panel {
      grid-template-columns: 1fr 380px;
    }

    @container (max-width: 900px) {
      .db-br__layout--with-panel {
        grid-template-columns: 1fr;
      }
    }

    /* ---- Table ---- */
    .db-br__table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow-x: auto;
    }

    .db-br__table {
      inline-size: 100%;
      min-inline-size: 600px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-br__thead { background: var(--surface-alt); border-block-end: 1px solid var(--border); }

    .db-br__th {
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

    .db-br__th--actions { inline-size: 120px; }

    .db-br__row {
      border-block-end: 1px solid var(--border);
      transition: background-color var(--motion-fast) ease;
    }

    .db-br__row:last-child { border-block-end: none; }
    .db-br__row:hover { background: var(--surface-alt); }
    .db-br__row--selected { background: color-mix(in srgb, var(--accent) 6%, var(--surface)); }

    .db-br__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem 0.5rem;
      vertical-align: middle;
      color: var(--text);
      white-space: nowrap;
    }

    .db-br__td--actions { padding-inline-end: 0.875rem; }

    .db-br__name-cell {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .db-br__avatar {
      inline-size: 32px;
      block-size: 32px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .db-br__name-text { font-weight: 600; }
    .db-br__ar-text { font-size: 0.875rem; }
    .db-br__muted { color: var(--text-muted); font-size: 0.875rem; }

    .db-br__badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .db-br__badge[data-status='active'] {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
      outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
    }

    .db-br__badge[data-status='inactive'] {
      background: color-mix(in srgb, var(--text-muted) 12%, transparent);
      color: var(--text-muted);
      outline: 1px solid color-mix(in srgb, var(--text-muted) 20%, transparent);
    }

    .db-br__actions {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      justify-content: flex-end;
    }

    .db-br__action-btn {
      padding-block: 0.3rem;
      padding-inline: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-br__action-btn--edit {
      background: color-mix(in srgb, var(--accent) 8%, transparent);
      color: var(--accent);
      border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
    }

    .db-br__action-btn--edit:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); }

    .db-br__action-btn--del {
      background: color-mix(in srgb, var(--danger) 8%, transparent);
      color: var(--danger);
      border: 1px solid color-mix(in srgb, var(--danger) 20%, transparent);
    }

    .db-br__action-btn--del:hover { background: color-mix(in srgb, var(--danger) 14%, transparent); }

    /* ---- Skeleton ---- */
    .db-br__sk {
      display: inline-block;
      block-size: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-br-shimmer 1.4s infinite;
    }

    .db-br__sk--name   { inline-size: 110px; }
    .db-br__sk--addr   { inline-size: 150px; }
    .db-br__sk--phone  { inline-size: 80px; }
    .db-br__sk--badge  { inline-size: 60px; block-size: 20px; border-radius: 999px; }

    @keyframes db-br-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ---- Empty state ---- */
    .db-br__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding-block: 3rem;
      text-align: center;
    }

    .db-br__empty-icon { font-size: 2.5rem; }
    .db-br__empty-text { color: var(--text-muted); font-size: 0.9375rem; margin: 0; }

    /* ---- Side panel ---- */
    .db-br__panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: sticky;
      inset-block-start: 1rem;
      max-block-size: calc(100dvh - 6rem);
      overflow-y: auto;
    }

    .db-br__panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-block: 1rem;
      padding-inline: 1.25rem;
      border-block-end: 1px solid var(--border);
      flex-shrink: 0;
    }

    .db-br__panel-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .db-br__panel-close {
      display: flex;
      align-items: center;
      justify-content: center;
      inline-size: 1.75rem;
      block-size: 1.75rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      border-radius: var(--radius-control);
      cursor: pointer;
      transition: background-color var(--motion-fast) ease;
    }

    .db-br__panel-close:hover { background: var(--surface-alt); }

    /* ---- Detail view ---- */
    .db-br__detail {
      padding-block: 1rem;
      padding-inline: 1.25rem;
    }

    .db-br__detail-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 0 0 1.25rem;
      padding: 0;
    }

    .db-br__detail-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .db-br__detail-row dt {
      color: var(--text-subtle);
      font-weight: 600;
      font-size: 0.8125rem;
    }

    .db-br__detail-row dd {
      color: var(--text);
      margin: 0;
    }

    .db-br__stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.625rem;
      margin-block-end: 1.25rem;
    }

    .db-br__stat-card {
      background: var(--surface-alt);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.625rem;
      padding-inline: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .db-br__stat-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .db-br__stat-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text);
      font-variant-numeric: tabular-nums;
    }

    .db-br__detail-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* ---- Form ---- */
    .db-br__form {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .db-br__form-body {
      flex: 1;
      padding-block: 1rem;
      padding-inline: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
    }

    .db-br__field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .db-br__field--toggle {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .db-br__field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .db-br__label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text);
    }

    .db-br__toggle-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }

    .db-br__required { color: var(--danger); margin-inline-start: 0.2rem; }

    .db-br__input {
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
    }

    .db-br__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-br__input--error { border-color: var(--danger); }
    .db-br__field-error { font-size: 0.75rem; color: var(--danger); }

    /* ---- Toggle switch ---- */
    .db-br__toggle {
      position: relative;
      inline-size: 44px;
      block-size: 24px;
      background: var(--border-strong);
      border: none;
      border-radius: 999px;
      cursor: pointer;
      transition: background-color var(--motion-base) ease;
      flex-shrink: 0;
    }

    .db-br__toggle--on { background: var(--accent); }

    .db-br__toggle-thumb {
      position: absolute;
      inset-block-start: 3px;
      inset-inline-start: 3px;
      inline-size: 18px;
      block-size: 18px;
      background: #fff;
      border-radius: 50%;
      transition: inset-inline-start var(--motion-base) ease;
      pointer-events: none;
    }

    .db-br__toggle--on .db-br__toggle-thumb { inset-inline-start: 23px; }

    /* ---- Working hours grid ---- */
    .db-br__section-label {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text);
      margin-block-end: -0.25rem;
    }

    .db-br__hours-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .db-br__hours-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
    }

    .db-br__day-name {
      inline-size: 44px;
      flex-shrink: 0;
      font-weight: 600;
      color: var(--text);
      font-size: 0.8125rem;
    }

    .db-br__day-closed-toggle {
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: inherit;
      border-radius: var(--radius-pill);
      cursor: pointer;
      border: 1px solid var(--border-strong);
      background: var(--surface-alt);
      color: var(--text-muted);
      transition: all var(--motion-fast) ease;
      white-space: nowrap;
    }

    .db-br__day-closed-toggle--open {
      background: color-mix(in srgb, var(--success) 10%, transparent);
      color: var(--success);
      border-color: color-mix(in srgb, var(--success) 30%, transparent);
    }

    .db-br__time-input {
      font-family: inherit;
      font-size: 0.8125rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.25rem;
      padding-inline: 0.375rem;
      outline: none;
      block-size: 30px;
      box-sizing: border-box;
    }

    .db-br__time-sep {
      color: var(--text-subtle);
      flex-shrink: 0;
    }

    .db-br__closed-label {
      color: var(--text-subtle);
      font-size: 0.8125rem;
      font-style: italic;
    }

    /* ---- Form footer ---- */
    .db-br__form-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.625rem;
      padding-block: 0.875rem;
      padding-inline: 1.25rem;
      border-block-start: 1px solid var(--border);
      flex-shrink: 0;
    }

    /* ---- Delete dialog overlay ---- */
    .db-br__overlay {
      position: fixed;
      inset: 0;
      z-index: 400;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--overlay-scrim, rgba(0,0,0,0.5));
      padding-inline: 1rem;
    }

    .db-br__dialog {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 1.5rem;
      max-inline-size: 420px;
      inline-size: 100%;
      box-shadow: 0 16px 48px rgba(0,0,0,0.18);
    }

    .db-br__dialog-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.625rem;
    }

    .db-br__dialog-body {
      font-size: 0.9375rem;
      color: var(--text-muted);
      margin: 0 0 1rem;
    }

    .db-br__dialog-error {
      font-size: 0.875rem;
      color: var(--danger);
      margin-block-end: 0.75rem;
    }

    .db-br__dialog-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.625rem;
    }

    /* ---- Utility ---- */
    .db-br__sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
    }
  `],
})
export class BranchesComponent implements OnInit {
  private readonly branchesService = inject(BranchesService);

  readonly items = signal<BranchListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);

  readonly panelOpen = signal(false);
  readonly panelMode = signal<'detail' | 'form'>('detail');
  readonly isEditing = signal(false);
  readonly selectedBranch = signal<BranchListItem | null>(null);
  readonly form = signal<BranchFormState>(emptyForm());
  readonly submitted = signal(false);

  readonly deleteTarget = signal<BranchListItem | null>(null);
  readonly deleteError = signal('');

  readonly toastMsg = signal('');
  readonly toastKind = signal<'success' | 'error'>('success');

  readonly shimmerRows = SHIMMER_ROWS;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.branchesService.getAll().subscribe({
      next: (branches) => {
        this.items.set(branches);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  selectBranch(branch: BranchListItem): void {
    this.selectedBranch.set(branch);
    this.panelMode.set('detail');
    this.panelOpen.set(true);
    this.isEditing.set(false);
  }

  openAdd(): void {
    this.selectedBranch.set(null);
    this.form.set(emptyForm());
    this.submitted.set(false);
    this.panelMode.set('form');
    this.isEditing.set(false);
    this.panelOpen.set(true);
  }

  openEdit(branch: BranchListItem): void {
    this.selectedBranch.set(branch);
    const hours = this.parseHours(branch.workingHoursJson);
    this.form.set({
      id: branch.id,
      nameEn: branch.nameEn,
      nameAr: branch.nameAr,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      latitude: branch.latitude != null ? String(branch.latitude) : '',
      longitude: branch.longitude != null ? String(branch.longitude) : '',
      isActive: branch.isActive,
      workingHours: hours,
    });
    this.submitted.set(false);
    this.panelMode.set('form');
    this.isEditing.set(true);
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.isEditing.set(false);
    this.submitted.set(false);
  }

  patchForm(partial: Partial<BranchFormState>): void {
    this.form.update((f) => ({ ...f, ...partial }));
  }

  toggleDayClosed(index: number): void {
    this.form.update((f) => {
      const hours = [...f.workingHours];
      hours[index] = { ...hours[index], isClosed: !hours[index].isClosed };
      return { ...f, workingHours: hours };
    });
  }

  setHourField(index: number, field: 'openTime' | 'closeTime', value: string): void {
    this.form.update((f) => {
      const hours = [...f.workingHours];
      hours[index] = { ...hours[index], [field]: value };
      return { ...f, workingHours: hours };
    });
  }

  saveForm(): void {
    this.submitted.set(true);
    const f = this.form();
    if (!f.nameEn.trim() || !f.nameAr.trim()) return;

    const body: UpsertBranchRequest = {
      nameEn: f.nameEn.trim(),
      nameAr: f.nameAr.trim(),
      address: f.address.trim() || null,
      phone: f.phone.trim() || null,
      latitude: f.latitude !== '' ? Number(f.latitude) : null,
      longitude: f.longitude !== '' ? Number(f.longitude) : null,
      isActive: f.isActive,
      workingHoursJson: JSON.stringify(f.workingHours),
    };

    this.saving.set(true);

    if (this.isEditing() && f.id) {
      this.branchesService.update(f.id, body).subscribe({
        next: (updated) => {
          this.items.update((list) =>
            list.map((b) => (b.id === updated.id ? updated : b)),
          );
          this.saving.set(false);
          this.closePanel();
          this.showToast('success', 'branches_page.toast_updated');
        },
        error: () => {
          this.saving.set(false);
          this.showToast('error', 'branches_page.toast_error');
        },
      });
    } else {
      this.branchesService.create(body).subscribe({
        next: (created) => {
          this.items.update((list) => [...list, created]);
          this.saving.set(false);
          this.closePanel();
          this.showToast('success', 'branches_page.toast_created');
        },
        error: () => {
          this.saving.set(false);
          this.showToast('error', 'branches_page.toast_error');
        },
      });
    }
  }

  confirmDelete(branch: BranchListItem): void {
    this.deleteError.set('');
    this.deleteTarget.set(branch);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
    this.deleteError.set('');
  }

  executeDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.deleting.set(true);
    this.branchesService.delete(target.id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((b) => b.id !== target.id));
        if (this.selectedBranch()?.id === target.id) {
          this.closePanel();
          this.selectedBranch.set(null);
        }
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.showToast('success', 'branches_page.toast_deleted');
      },
      error: () => {
        this.deleting.set(false);
        this.deleteError.set('branches_page.toast_error');
      },
    });
  }

  dayKey(dayOfWeek: number): string {
    const map: Record<number, string> = {
      0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
    };
    return map[dayOfWeek] ?? 'mon';
  }

  private parseHours(json: string | null): WorkingHourEntry[] {
    if (!json) return defaultWorkingHours();
    try {
      const parsed = JSON.parse(json) as WorkingHourEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fall through
    }
    return defaultWorkingHours();
  }

  private showToast(kind: 'success' | 'error', msgKey: string): void {
    this.toastKind.set(kind);
    this.toastMsg.set(msgKey);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), 3500);
  }
}
