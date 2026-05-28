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

import { StaffService } from '../../core/services/staff.service';
import { StaffMember, InviteStaffRequest, StaffRole } from '../../core/models/staff.model';

const SHIMMER_ROWS = [1, 2, 3, 4, 5];

const INVITABLE_ROLES: StaffRole[] = ['manager', 'staff', 'driver', 'kitchen', 'accountant'];

@Component({
  selector: 'db-staff',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-staff">
      <header class="db-staff__header">
        <h1 class="db-staff__title">{{ 'staff_page.title' | translate }}</h1>
        <button
          class="db-staff__btn-primary"
          type="button"
          (click)="toggleInviteForm()"
        >
          {{ 'staff_page.invite_staff' | translate }}
        </button>
      </header>

      <!-- Success banner -->
      @if (successMsg()) {
        <div class="db-staff__success" role="status">
          {{ successMsg() }}
        </div>
      }

      <!-- Error banner -->
      @if (errorMsg()) {
        <div class="db-staff__error-banner" role="alert">
          {{ errorMsg() }}
        </div>
      }

      <!-- ── Invite form ─────────────────────────────────────────────────────── -->
      @if (showInviteForm()) {
        <div class="db-staff__invite-panel">
          <h2 class="db-staff__invite-title">{{ 'staff_page.invite_staff' | translate }}</h2>
          <form class="db-staff__form" (ngSubmit)="submitInvite()">
            <div class="db-staff__field-group">
              <div class="db-staff__field">
                <label class="db-staff__label" for="invite-name">
                  {{ 'staff_page.full_name' | translate }} <span class="db-staff__req" aria-hidden="true">*</span>
                </label>
                <input
                  id="invite-name"
                  class="db-staff__input"
                  type="text"
                  [placeholder]="'staff_page.full_name' | translate"
                  [(ngModel)]="inviteForm.fullName"
                  name="fullName"
                  required
                />
              </div>

              <div class="db-staff__field">
                <label class="db-staff__label" for="invite-email">
                  {{ 'staff_page.email' | translate }} <span class="db-staff__req" aria-hidden="true">*</span>
                </label>
                <input
                  id="invite-email"
                  class="db-staff__input"
                  type="email"
                  [placeholder]="'staff_page.email_placeholder' | translate"
                  [(ngModel)]="inviteForm.email"
                  name="email"
                  required
                />
              </div>
            </div>

            <div class="db-staff__field-group">
              <div class="db-staff__field">
                <label class="db-staff__label" for="invite-password">
                  {{ 'staff_page.password' | translate }} <span class="db-staff__req" aria-hidden="true">*</span>
                </label>
                <input
                  id="invite-password"
                  class="db-staff__input"
                  type="password"
                  [placeholder]="'staff_page.password_placeholder' | translate"
                  [(ngModel)]="inviteForm.password"
                  name="password"
                  required
                  minlength="8"
                />
              </div>

              <div class="db-staff__field">
                <label class="db-staff__label" for="invite-role">
                  {{ 'staff_page.role' | translate }} <span class="db-staff__req" aria-hidden="true">*</span>
                </label>
                <select
                  id="invite-role"
                  class="db-staff__input db-staff__select"
                  [(ngModel)]="inviteForm.roleKey"
                  name="roleKey"
                  required
                >
                  @for (role of invitableRoles; track role) {
                    <option [value]="role">
                      {{ ('staff_page.role_' + role) | translate }}
                    </option>
                  }
                </select>
              </div>
            </div>

            <div class="db-staff__form-actions">
              <button
                class="db-staff__btn-ghost"
                type="button"
                (click)="cancelInvite()"
              >{{ 'common.cancel' | translate }}</button>
              <button
                class="db-staff__btn-primary"
                type="submit"
                [disabled]="inviting()"
              >
                {{ inviting() ? ('common.saving' | translate) : ('staff_page.send_invite' | translate) }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- ── Staff table ──────────────────────────────────────────────────────── -->
      <div class="db-staff__table-wrap">
        <table class="db-staff__table" role="table">
          <thead class="db-staff__thead">
            <tr>
              <th class="db-staff__th" scope="col">{{ 'staff_page.col_name' | translate }}</th>
              <th class="db-staff__th" scope="col">{{ 'staff_page.col_email' | translate }}</th>
              <th class="db-staff__th" scope="col">{{ 'staff_page.col_role' | translate }}</th>
              <th class="db-staff__th" scope="col">{{ 'staff_page.col_status' | translate }}</th>
              <th class="db-staff__th" scope="col">{{ 'staff_page.col_last_login' | translate }}</th>
              <th class="db-staff__th db-staff__th--actions" scope="col">
                <span class="db-staff__sr">{{ 'staff_page.col_actions' | translate }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="db-staff__tbody">
            @if (loading()) {
              @for (_ of shimmerRows; track $index) {
                <tr class="db-staff__row" aria-hidden="true">
                  <td class="db-staff__td"><span class="db-staff__sk db-staff__sk--name"></span></td>
                  <td class="db-staff__td"><span class="db-staff__sk db-staff__sk--email"></span></td>
                  <td class="db-staff__td"><span class="db-staff__sk db-staff__sk--badge"></span></td>
                  <td class="db-staff__td"><span class="db-staff__sk db-staff__sk--badge"></span></td>
                  <td class="db-staff__td"><span class="db-staff__sk db-staff__sk--date"></span></td>
                  <td class="db-staff__td db-staff__td--actions"></td>
                </tr>
              }
            }
            @if (!loading()) {
              @for (member of filteredStaff(); track member.userId) {
                <tr class="db-staff__row">
                  <td class="db-staff__td">
                    <div class="db-staff__name-cell">
                      <div
                        class="db-staff__avatar"
                        [attr.data-role]="member.roleKey"
                        aria-hidden="true"
                      >{{ initials(member.fullName) }}</div>
                      <span class="db-staff__name">{{ member.fullName }}</span>
                    </div>
                  </td>
                  <td class="db-staff__td">
                    <span class="db-staff__email">{{ member.email }}</span>
                  </td>
                  <td class="db-staff__td">
                    <span class="db-staff__role-badge" [attr.data-role]="member.roleKey">
                      {{ ('staff_page.role_' + member.roleKey) | translate }}
                    </span>
                  </td>
                  <td class="db-staff__td">
                    <span class="db-staff__status-badge" [attr.data-active]="member.isActive ? 'true' : 'false'">
                      {{ (member.isActive ? 'staff_page.status_active' : 'staff_page.status_inactive') | translate }}
                    </span>
                  </td>
                  <td class="db-staff__td">
                    <span class="db-staff__date">{{ formatLogin(member.lastLoginAt) }}</span>
                  </td>
                  <td class="db-staff__td db-staff__td--actions">
                    <div class="db-staff__actions">
                      @if (member.roleKey !== 'owner') {
                        <button
                          class="db-staff__action-btn"
                          type="button"
                          [title]="(member.isActive ? 'staff_page.deactivate' : 'staff_page.reactivate') | translate"
                          (click)="toggleStatus(member)"
                        >
                          <span aria-hidden="true">{{ member.isActive ? '⏸' : '▶' }}</span>
                          <span class="db-staff__sr">{{ (member.isActive ? 'staff_page.deactivate' : 'staff_page.reactivate') | translate }}</span>
                        </button>
                        <button
                          class="db-staff__action-btn"
                          type="button"
                          [title]="'staff_page.reset_password' | translate"
                          (click)="sendPasswordReset(member)"
                        >
                          <span aria-hidden="true">🔑</span>
                          <span class="db-staff__sr">{{ 'staff_page.reset_password' | translate }}</span>
                        </button>
                      }
                      @if (member.roleKey === 'owner') {
                        <span class="db-staff__owner-badge">{{ 'staff_page.owner_locked' | translate }}</span>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>

        @if (!loading() && !error() && filteredStaff().length === 0) {
          <div class="db-staff__empty" role="status">
            <p>{{ 'staff_page.no_staff' | translate }}</p>
          </div>
        }

        @if (error() && !loading()) {
          <div class="db-staff__error" role="alert">
            <span>{{ 'staff_page.error' | translate }}</span>
            <button class="db-staff__retry" type="button" (click)="load()">
              {{ 'common.retry' | translate }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .db-staff {
      padding-block: var(--space-xl, 2rem);
      padding-inline: var(--space-xl, 2rem);
      container-type: inline-size;
    }

    .db-staff__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-block-end: 1.5rem;
    }

    .db-staff__title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    /* ── Buttons ── */

    .db-staff__btn-primary {
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
      transition: opacity var(--motion-fast) ease;
    }

    .db-staff__btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .db-staff__btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

    .db-staff__btn-ghost {
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

    .db-staff__btn-ghost:hover { background: var(--surface-alt); }

    /* ── Banners ── */

    .db-staff__success {
      padding-block: 0.75rem;
      padding-inline: 1rem;
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
      border: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
      border-radius: var(--radius-control);
      font-size: 0.875rem;
      font-weight: 500;
      margin-block-end: 1.25rem;
    }

    .db-staff__error-banner {
      padding-block: 0.75rem;
      padding-inline: 1rem;
      background: color-mix(in srgb, var(--danger) 10%, transparent);
      color: var(--danger);
      border: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
      border-radius: var(--radius-control);
      font-size: 0.875rem;
      font-weight: 500;
      margin-block-end: 1.25rem;
    }

    /* ── Invite panel ── */

    .db-staff__invite-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      padding: 1.5rem;
      margin-block-end: 1.5rem;
    }

    .db-staff__invite-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 1.25rem;
    }

    .db-staff__form { display: flex; flex-direction: column; gap: 1rem; }

    .db-staff__field-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @container (max-width: 560px) {
      .db-staff__field-group {
        grid-template-columns: 1fr;
      }
    }

    .db-staff__field { display: flex; flex-direction: column; gap: 0.375rem; }

    .db-staff__label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .db-staff__req { color: var(--danger); margin-inline-start: 0.125rem; }

    .db-staff__input {
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-control);
      padding-block: 0.5625rem;
      padding-inline: 0.75rem;
      outline: none;
      block-size: 38px;
      box-sizing: border-box;
      transition: border-color var(--motion-base) ease;
    }

    .db-staff__input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .db-staff__select {
      padding-inline-end: 2rem;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 0.625rem) 50%;
      cursor: pointer;
    }

    [dir='rtl'] .db-staff__select {
      background-position: 0.625rem 50%;
      padding-inline-end: 0.75rem;
      padding-inline-start: 2rem;
    }

    .db-staff__form-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-block-start: 0.5rem;
    }

    /* ── Table ── */

    .db-staff__table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      overflow-x: auto;
    }

    .db-staff__table {
      inline-size: 100%;
      min-inline-size: 680px;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .db-staff__thead {
      background: var(--surface-alt);
      border-block-end: 1px solid var(--border);
    }

    .db-staff__th {
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

    .db-staff__th--actions { inline-size: 120px; }

    .db-staff__row {
      border-block-end: 1px solid var(--border);
      transition: background-color var(--motion-fast) ease;
    }

    .db-staff__row:last-child { border-block-end: none; }
    .db-staff__row:hover { background: var(--surface-alt); }

    .db-staff__td {
      padding-block: 0.75rem;
      padding-inline: 0.875rem 0.5rem;
      vertical-align: middle;
      color: var(--text);
      white-space: nowrap;
    }

    .db-staff__td--actions { padding-inline-end: 0.875rem; }

    /* ── Name cell ── */

    .db-staff__name-cell {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .db-staff__avatar {
      inline-size: 34px;
      block-size: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      color: var(--accent);
    }

    /* Role-tinted avatars */
    .db-staff__avatar[data-role='owner']     { background: color-mix(in srgb, var(--warning) 14%, transparent); color: var(--warning); }
    .db-staff__avatar[data-role='manager']   { background: color-mix(in srgb, var(--accent) 14%, transparent);  color: var(--accent); }
    .db-staff__avatar[data-role='staff']     { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
    .db-staff__avatar[data-role='driver']    { background: color-mix(in srgb, var(--warning) 14%, transparent); color: var(--warning); }
    .db-staff__avatar[data-role='kitchen']   { background: color-mix(in srgb, var(--danger) 14%, transparent);  color: var(--danger); }
    .db-staff__avatar[data-role='accountant']{ background: color-mix(in srgb, var(--text-subtle) 20%, transparent); color: var(--text-muted); }

    .db-staff__name  { font-weight: 500; color: var(--text); }
    .db-staff__email { color: var(--text-muted); font-size: 0.8125rem; }
    .db-staff__date  { color: var(--text-muted); font-size: 0.8125rem; }

    /* ── Role badge ── */

    .db-staff__role-badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .db-staff__role-badge[data-role='owner']     { background: color-mix(in srgb, var(--warning) 12%, transparent); color: var(--warning);     outline: 1px solid color-mix(in srgb, var(--warning) 25%, transparent); }
    .db-staff__role-badge[data-role='manager']   { background: color-mix(in srgb, var(--accent) 10%, transparent);  color: var(--accent);      outline: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); }
    .db-staff__role-badge[data-role='staff']     { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success);     outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent); }
    .db-staff__role-badge[data-role='driver']    { background: color-mix(in srgb, var(--warning) 12%, transparent); color: var(--warning);     outline: 1px solid color-mix(in srgb, var(--warning) 25%, transparent); }
    .db-staff__role-badge[data-role='kitchen']   { background: color-mix(in srgb, var(--danger) 10%, transparent);  color: var(--danger);      outline: 1px solid color-mix(in srgb, var(--danger) 25%, transparent); }
    .db-staff__role-badge[data-role='accountant']{ background: color-mix(in srgb, var(--border) 60%, transparent); color: var(--text-muted);  outline: 1px solid color-mix(in srgb, var(--border) 80%, transparent); }

    /* ── Status badge ── */

    .db-staff__status-badge {
      display: inline-flex;
      align-items: center;
      padding-block: 0.2rem;
      padding-inline: 0.5rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .db-staff__status-badge[data-active='true'] {
      background: color-mix(in srgb, var(--success) 12%, transparent);
      color: var(--success);
      outline: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
    }

    .db-staff__status-badge[data-active='false'] {
      background: color-mix(in srgb, var(--danger) 10%, transparent);
      color: var(--danger);
      outline: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
    }

    /* ── Action buttons ── */

    .db-staff__actions {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      justify-content: flex-end;
    }

    .db-staff__action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2rem;
      block-size: 2rem;
      border: 1px solid var(--border);
      background: var(--surface);
      border-radius: var(--radius-control);
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-muted);
      transition: background-color var(--motion-fast) ease, color var(--motion-fast) ease;
    }

    .db-staff__action-btn:hover {
      background: var(--surface-alt);
      color: var(--text);
      border-color: var(--border-strong);
    }

    .db-staff__owner-badge {
      font-size: 0.75rem;
      color: var(--text-subtle);
      font-style: italic;
    }

    /* ── Skeleton ── */

    .db-staff__sk {
      display: inline-block;
      block-size: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: db-staff-shimmer 1.4s infinite;
    }

    .db-staff__sk--name  { inline-size: 130px; }
    .db-staff__sk--email { inline-size: 160px; }
    .db-staff__sk--badge { inline-size: 72px; block-size: 20px; border-radius: 999px; }
    .db-staff__sk--date  { inline-size: 90px; }

    @keyframes db-staff-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── Empty / error ── */

    .db-staff__empty {
      padding-block: 3rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    .db-staff__error {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding-block: 2.5rem;
      color: var(--danger);
      font-size: 0.875rem;
    }

    .db-staff__retry {
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

    .db-staff__sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
    }
  `],
})
export class StaffComponent implements OnInit {
  private readonly staffService = inject(StaffService);

  readonly staff = signal<StaffMember[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly showInviteForm = signal(false);
  readonly inviting = signal(false);
  readonly successMsg = signal('');
  readonly errorMsg = signal('');

  readonly shimmerRows = SHIMMER_ROWS;
  readonly invitableRoles = INVITABLE_ROLES;

  inviteForm: InviteStaffRequest = this.blankInviteForm();

  readonly filteredStaff = computed(() => this.staff());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.staffService.getStaff().subscribe({
      next: (result) => {
        this.staff.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  toggleInviteForm(): void {
    this.showInviteForm.update((v) => !v);
    if (!this.showInviteForm()) {
      this.inviteForm = this.blankInviteForm();
    }
  }

  cancelInvite(): void {
    this.showInviteForm.set(false);
    this.inviteForm = this.blankInviteForm();
  }

  submitInvite(): void {
    if (!this.inviteForm.fullName.trim() || !this.inviteForm.email.trim() || !this.inviteForm.password) {
      return;
    }

    this.inviting.set(true);
    this.errorMsg.set('');

    this.staffService.inviteStaff(this.inviteForm).subscribe({
      next: (newMember) => {
        this.staff.update((list) => [newMember, ...list]);
        this.inviting.set(false);
        this.showInviteForm.set(false);
        this.inviteForm = this.blankInviteForm();
        this.showSuccess('staff_page.invite_success');
      },
      error: (err) => {
        this.inviting.set(false);
        this.errorMsg.set(err?.error?.message ?? 'staff_page.error');
      },
    });
  }

  toggleStatus(member: StaffMember): void {
    if (member.roleKey === 'owner') {
      this.errorMsg.set('staff_page.cannot_deactivate_owner');
      return;
    }

    const nextActive = !member.isActive;

    this.staffService.updateStatus(member.userId, nextActive).subscribe({
      next: () => {
        this.staff.update((list) =>
          list.map((m) => m.userId === member.userId ? { ...m, isActive: nextActive } : m),
        );
        this.showSuccess(nextActive ? 'staff_page.reactivated' : 'staff_page.deactivated');
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'staff_page.error');
      },
    });
  }

  sendPasswordReset(member: StaffMember): void {
    this.staffService.resetPassword(member.userId).subscribe({
      next: () => {
        this.showSuccess('staff_page.reset_password_sent');
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'staff_page.error');
      },
    });
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();
  }

  formatLogin(date: string | null): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return date;
    }
  }

  private showSuccess(msgKey: string): void {
    this.successMsg.set(msgKey);
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  private blankInviteForm(): InviteStaffRequest {
    return { fullName: '', email: '', password: '', roleKey: 'staff' };
  }
}
