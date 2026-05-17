import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';

@Component({
  selector: 'sf-account-overview',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overview">
      <h1 class="overview__title">{{ 'account.overview' | translate }}</h1>

      @if (currentUser()) {
        <!-- Deletion warning -->
        @if (currentUser()!.deletionRequestedAt) {
          <div class="overview__deletion-banner" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {{ 'account.deletion_requested_warning' | translate: { date: (currentUser()!.deletionRequestedAt! | date: 'mediumDate') } }}
          </div>
        }

        <!-- Profile card -->
        <div class="overview__card">
          <!-- Avatar + basic info -->
          <div class="overview__profile-row">
            <div class="overview__avatar">{{ initials() }}</div>
            <div class="overview__info">
              <div class="overview__name">{{ currentUser()!.fullName }}</div>
              <div class="overview__email">{{ currentUser()!.email }}</div>
              <div class="overview__badges">
                @if (currentUser()!.isEmailVerified) {
                  <span class="overview__badge overview__badge--verified">
                    {{ 'account.email_verified' | translate }}
                  </span>
                } @else {
                  <span class="overview__badge overview__badge--unverified">
                    {{ 'account.email_not_verified' | translate }}
                  </span>
                }
              </div>
            </div>
            @if (!editing()) {
              <button
                class="overview__edit-btn"
                type="button"
                (click)="startEdit()"
              >
                {{ 'account.edit_profile' | translate }}
              </button>
            }
          </div>

          <!-- Stats row -->
          <div class="overview__stats">
            <div class="overview__stat">
              <span class="overview__stat-label">{{ 'account.loyalty_points' | translate }}</span>
              <span class="overview__stat-value">{{ 'account.loyalty_pts' | translate: { count: 0 } }}</span>
            </div>
            <div class="overview__stat">
              <span class="overview__stat-label">{{ 'auth.phone' | translate }}</span>
              <span class="overview__stat-value">{{ currentUser()!.phone ?? '—' }}</span>
            </div>
            <div class="overview__stat">
              <span class="overview__stat-label">{{ 'account.member_since' | translate: { date: (currentUser()!.createdAt | date: 'mediumDate') } }}</span>
              <span class="overview__stat-value">{{ currentUser()!.createdAt | date: 'yyyy' }}</span>
            </div>
          </div>

          <!-- Edit form -->
          @if (editing()) {
            <form
              class="overview__edit-form"
              [formGroup]="editForm"
              (ngSubmit)="saveProfile()"
              novalidate
            >
              @if (saveError()) {
                <div class="overview__form-error" role="alert">{{ saveError() | translate }}</div>
              }
              @if (saveSuccess()) {
                <div class="overview__form-success" role="status">{{ 'account.profile_updated' | translate }}</div>
              }

              <div class="overview__field">
                <label class="overview__label" for="ov-fullname">{{ 'auth.full_name' | translate }}</label>
                <input
                  id="ov-fullname"
                  class="overview__input"
                  type="text"
                  formControlName="fullName"
                />
                @if (editTouched() && editForm.controls.fullName.hasError('required')) {
                  <span class="overview__field-error">{{ 'errors.required' | translate }}</span>
                }
              </div>

              <div class="overview__field">
                <label class="overview__label" for="ov-phone">{{ 'auth.phone' | translate }}</label>
                <input
                  id="ov-phone"
                  class="overview__input"
                  type="tel"
                  formControlName="phone"
                />
              </div>

              <div class="overview__form-actions">
                <button
                  type="button"
                  class="overview__cancel-btn"
                  (click)="cancelEdit()"
                >
                  {{ 'account.cancel_edit' | translate }}
                </button>
                <button
                  class="overview__save-btn"
                  type="submit"
                  [disabled]="saving()"
                >
                  @if (saving()) {
                    {{ 'common.loading' | translate }}
                  } @else {
                    {{ 'account.save_profile' | translate }}
                  }
                </button>
              </div>
            </form>
          }
        </div>
      } @else {
        <div class="overview__loading">{{ 'common.loading' | translate }}</div>
      }
    </div>
  `,
  styles: [
    `
      .overview {
        padding-block-end: 2rem;
      }

      .overview__title {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        margin-block-end: 1.5rem;
        letter-spacing: -0.02em;
      }

      .overview__deletion-banner {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        background: #fef9c3;
        color: #854d0e;
        border: 1px solid #fde047;
        border-radius: var(--border-radius-md, 8px);
        padding-block: 0.875rem;
        padding-inline: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        margin-block-end: 1.25rem;
      }
      .overview__deletion-banner svg {
        inline-size: 1.125rem;
        block-size: 1.125rem;
        flex-shrink: 0;
      }

      .overview__card {
        background: #fff;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        padding: 1.5rem;
      }

      .overview__profile-row {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-block-end: 1.5rem;
      }

      .overview__avatar {
        inline-size: 4rem;
        block-size: 4rem;
        border-radius: 50%;
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.375rem;
        font-weight: 700;
        flex-shrink: 0;
        text-transform: uppercase;
      }

      .overview__info {
        flex: 1;
        min-inline-size: 0;
      }

      .overview__name {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin-block-end: 0.25rem;
      }

      .overview__email {
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.7;
        margin-block-end: 0.5rem;
      }

      .overview__badges {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .overview__badge {
        display: inline-block;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding-block: 0.15rem;
        padding-inline: 0.5rem;
        border-radius: var(--border-radius-full, 9999px);
      }
      .overview__badge--verified {
        background: #dcfce7;
        color: #166534;
      }
      .overview__badge--unverified {
        background: #fef9c3;
        color: #854d0e;
      }

      .overview__edit-btn {
        background: transparent;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        color: var(--color-primary);
        font-size: 0.8125rem;
        font-weight: 600;
        padding-block: 0.375rem;
        padding-inline: 0.875rem;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
        flex-shrink: 0;
      }
      .overview__edit-btn:hover {
        background: var(--color-surface-container, #f4ede5);
      }

      .overview__stats {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
        gap: 1rem;
        padding-block-start: 1rem;
        border-block-start: 1px solid var(--color-outline-variant, #d6c4ad);
      }

      .overview__stat {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .overview__stat-label {
        font-size: 0.75rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.6;
        font-weight: 500;
      }

      .overview__stat-value {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
      }

      /* Edit form */
      .overview__edit-form {
        margin-block-start: 1.5rem;
        padding-block-start: 1.5rem;
        border-block-start: 1px solid var(--color-outline-variant, #d6c4ad);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .overview__form-error {
        background: #fef2f2;
        color: var(--color-error, #dc2626);
        border: 1px solid #fecaca;
        border-radius: var(--border-radius-md, 8px);
        padding-block: 0.625rem;
        padding-inline: 0.875rem;
        font-size: 0.875rem;
      }

      .overview__form-success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
        border-radius: var(--border-radius-md, 8px);
        padding-block: 0.625rem;
        padding-inline: 0.875rem;
        font-size: 0.875rem;
      }

      .overview__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .overview__label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
      }

      .overview__input {
        block-size: 2.75rem;
        padding-inline: 0.875rem;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        background: #fff;
        font-size: 1rem;
        color: var(--color-on-surface, #1e1b17);
        transition: border-color 0.2s;
        font-family: inherit;
      }
      .overview__input:focus {
        outline: none;
        border-color: var(--color-primary);
      }

      .overview__field-error {
        font-size: 0.75rem;
        color: var(--color-error, #dc2626);
      }

      .overview__form-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      .overview__cancel-btn {
        background: transparent;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
        padding-block: 0.5rem;
        padding-inline: 1.25rem;
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
      }
      .overview__cancel-btn:hover {
        background: var(--color-surface-container, #f4ede5);
      }

      .overview__save-btn {
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        border: none;
        border-radius: var(--border-radius-md, 8px);
        font-size: 0.875rem;
        font-weight: 700;
        padding-block: 0.5rem;
        padding-inline: 1.5rem;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .overview__save-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .overview__save-btn:not(:disabled):hover {
        opacity: 0.9;
      }

      .overview__loading {
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.6;
        font-size: 0.9375rem;
      }
    `,
  ],
})
export class AccountOverviewComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly accountService = inject(AccountService);
  private readonly fb = inject(FormBuilder);

  readonly currentUser = this.authService.currentUser;
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly editTouched = signal(false);
  readonly saveError = signal<string>('');
  readonly saveSuccess = signal(false);

  readonly initials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    const parts = user.fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  });

  readonly editForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phone: [''],
  });

  ngOnInit(): void {
    this.authService.loadProfile().subscribe({ error: () => {} });
  }

  startEdit(): void {
    const user = this.currentUser();
    if (!user) return;
    this.editForm.setValue({ fullName: user.fullName, phone: user.phone ?? '' });
    this.editing.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);
    this.editTouched.set(false);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  saveProfile(): void {
    this.editTouched.set(true);
    if (this.editForm.invalid) return;

    const { fullName, phone } = this.editForm.getRawValue();
    this.saving.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);

    this.accountService
      .updateProfile({
        fullName,
        phone: phone.trim() ? phone.trim() : null,
        phoneCountryCode: '+965',
      })
      .subscribe({
        next: (profile) => {
          this.authService.currentUser.set(profile);
          this.saving.set(false);
          this.saveSuccess.set(true);
          this.editing.set(false);
        },
        error: () => {
          this.saving.set(false);
          this.saveError.set('errors.generic');
        },
      });
  }
}
