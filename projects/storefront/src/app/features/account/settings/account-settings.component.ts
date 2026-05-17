import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { HttpClient } from '@angular/common/http';
import { LanguageToggleService } from '@shared/i18n';
import { API_BASE_URL } from '@shared/api';
import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';

@Component({
  selector: 'sf-account-settings',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, TranslateModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="settings">
      <h1 class="settings__title">{{ 'account.settings_title' | translate }}</h1>

      <!-- Password change section -->
      <section class="settings__section">
        <h2 class="settings__section-title">{{ 'account.change_password_title' | translate }}</h2>
        <p class="settings__section-note">{{ 'account.change_password_note' | translate }}</p>

        @if (resetLinkSent()) {
          <div class="settings__success" role="status">
            {{ 'account.reset_link_sent' | translate }}
          </div>
        } @else {
          <button
            class="settings__btn"
            type="button"
            [disabled]="resetLoading()"
            (click)="sendResetLink()"
          >
            @if (resetLoading()) { {{ 'common.loading' | translate }} }
            @else { {{ 'account.send_reset_link' | translate }} }
          </button>
        }

        @if (resetError()) {
          <div class="settings__error" role="alert">{{ resetError() | translate }}</div>
        }
      </section>

      <!-- Sign out all devices -->
      @if (showLogoutAll()) {
        <section class="settings__section">
          <h2 class="settings__section-title">{{ 'account.logout_all_btn' | translate }}</h2>
          <button
            class="settings__btn settings__btn--outline"
            type="button"
            [disabled]="logoutAllLoading()"
            (click)="logoutAll()"
          >
            @if (logoutAllLoading()) { {{ 'common.loading' | translate }} }
            @else { {{ 'account.logout_all_btn' | translate }} }
          </button>
        </section>
      }

      <!-- Account deletion section -->
      <section class="settings__section settings__section--danger">
        <h2 class="settings__section-title settings__section-title--danger">
          {{ 'account.delete_account_title' | translate }}
        </h2>
        <p class="settings__section-note">{{ 'account.delete_account_warning' | translate }}</p>

        @if (deletionScheduledAt()) {
          <div class="settings__deletion-info" role="status">
            {{ 'account.deletion_scheduled' | translate: { date: (deletionScheduledAt() | date: 'mediumDate') } }}
          </div>
        } @else {
          <button
            class="settings__btn settings__btn--danger"
            type="button"
            (click)="openDeleteModal()"
          >
            {{ 'account.delete_account_btn' | translate }}
          </button>
        }

        @if (deleteError()) {
          <div class="settings__error" role="alert">{{ deleteError() | translate }}</div>
        }
      </section>

      <!-- Delete confirmation modal -->
      @if (showDeleteModal()) {
        <div class="settings__modal-overlay" role="dialog" aria-modal="true">
          <div class="settings__modal">
            <h3 class="settings__modal-title">{{ 'account.delete_account_title' | translate }}</h3>
            <p class="settings__modal-body">{{ 'account.delete_account_warning' | translate }}</p>

            <label class="settings__modal-check-label">
              <input
                type="checkbox"
                [(ngModel)]="deleteConfirmed"
                [ngModelOptions]="{ standalone: true }"
              />
              <span>{{ 'account.delete_confirm_check' | translate }}</span>
            </label>

            @if (deleteError()) {
              <div class="settings__error" role="alert">{{ deleteError() | translate }}</div>
            }

            <div class="settings__modal-actions">
              <button
                class="settings__btn settings__btn--outline"
                type="button"
                (click)="closeDeleteModal()"
              >
                {{ 'common.cancel' | translate }}
              </button>
              <button
                class="settings__btn settings__btn--danger"
                type="button"
                [disabled]="!deleteConfirmed || deleteLoading()"
                (click)="confirmDeletion()"
              >
                @if (deleteLoading()) { {{ 'common.loading' | translate }} }
                @else { {{ 'account.delete_account_confirm_btn' | translate }} }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .settings {
        padding-block-end: 2rem;
      }

      .settings__title {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        margin-block-end: 1.5rem;
        letter-spacing: -0.02em;
      }

      .settings__section {
        background: #fff;
        border: 1px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        padding: 1.5rem;
        margin-block-end: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .settings__section--danger {
        border-color: #fecaca;
        background: #fff;
      }

      .settings__section-title {
        font-size: 1.0625rem;
        font-weight: 700;
        color: var(--color-on-surface, #1e1b17);
        margin: 0;
      }

      .settings__section-title--danger {
        color: var(--color-error, #dc2626);
      }

      .settings__section-note {
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.7;
        margin: 0;
        line-height: 1.6;
      }

      .settings__success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
        border-radius: var(--border-radius-md, 8px);
        padding-block: 0.625rem;
        padding-inline: 0.875rem;
        font-size: 0.875rem;
      }

      .settings__error {
        background: #fef2f2;
        color: var(--color-error, #dc2626);
        border: 1px solid #fecaca;
        border-radius: var(--border-radius-md, 8px);
        padding-block: 0.625rem;
        padding-inline: 0.875rem;
        font-size: 0.875rem;
      }

      .settings__deletion-info {
        background: #fef9c3;
        color: #854d0e;
        border: 1px solid #fde047;
        border-radius: var(--border-radius-md, 8px);
        padding-block: 0.625rem;
        padding-inline: 0.875rem;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .settings__btn {
        display: inline-flex;
        align-items: center;
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        border: none;
        border-radius: var(--border-radius-md, 8px);
        font-size: 0.875rem;
        font-weight: 700;
        padding-block: 0.625rem;
        padding-inline: 1.5rem;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.2s;
        align-self: flex-start;
      }
      .settings__btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .settings__btn:not(:disabled):hover { opacity: 0.9; }

      .settings__btn--outline {
        background: transparent;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        color: var(--color-on-surface, #1e1b17);
      }
      .settings__btn--outline:not(:disabled):hover {
        background: var(--color-surface-container, #f4ede5);
        opacity: 1;
      }

      .settings__btn--danger {
        background: var(--color-error, #dc2626);
        color: #fff;
      }

      /* Modal */
      .settings__modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 1rem;
      }

      .settings__modal {
        background: #fff;
        border-radius: var(--border-radius-md, 8px);
        padding: 2rem;
        max-inline-size: 24rem;
        inline-size: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .settings__modal-title {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--color-error, #dc2626);
        margin: 0;
      }

      .settings__modal-body {
        font-size: 0.9375rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.75;
        line-height: 1.6;
        margin: 0;
      }

      .settings__modal-check-label {
        display: flex;
        align-items: flex-start;
        gap: 0.625rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-on-surface, #1e1b17);
        cursor: pointer;
        line-height: 1.5;
      }

      .settings__modal-check-label input {
        margin-block-start: 0.125rem;
        flex-shrink: 0;
        cursor: pointer;
      }

      .settings__modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class AccountSettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly accountService = inject(AccountService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly lang = inject(LanguageToggleService);
  private readonly router = inject(Router);

  readonly resetLoading = signal(false);
  readonly resetLinkSent = signal(false);
  readonly resetError = signal<string>('');

  readonly logoutAllLoading = signal(false);
  readonly showLogoutAll = signal(true);

  readonly showDeleteModal = signal(false);
  readonly deleteLoading = signal(false);
  readonly deleteError = signal<string>('');
  readonly deletionScheduledAt = signal<string | null>(null);
  deleteConfirmed = false;

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.deletionRequestedAt) {
      this.deletionScheduledAt.set(user.deletionRequestedAt);
    }
  }

  sendResetLink(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    this.resetLoading.set(true);
    this.resetError.set('');

    const resetBaseUrl = `${window.location.origin}/${this.lang.current()}/reset-password`;
    this.http
      .post<{ message?: string; debugLink?: string }>(
        `${this.baseUrl}/storefront/auth/forgot-password`,
        { email: user.email, resetBaseUrl },
        { withCredentials: true },
      )
      .subscribe({
        next: () => {
          this.resetLoading.set(false);
          this.resetLinkSent.set(true);
        },
        error: () => {
          this.resetLoading.set(false);
          this.resetError.set('errors.generic');
        },
      });
  }

  logoutAll(): void {
    this.logoutAllLoading.set(true);
    this.http
      .post<void>(`${this.baseUrl}/storefront/auth/logout-all`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.authService.currentUser.set(null);
          this.router.navigate(['/', this.lang.current(), 'login']);
        },
        error: (err) => {
          this.logoutAllLoading.set(false);
          if (err?.status === 404) {
            this.showLogoutAll.set(false);
          }
        },
      });
  }

  openDeleteModal(): void {
    this.deleteConfirmed = false;
    this.deleteError.set('');
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  confirmDeletion(): void {
    if (!this.deleteConfirmed) return;
    this.deleteLoading.set(true);
    this.deleteError.set('');

    this.accountService.requestDeletion().subscribe({
      next: (res) => {
        this.deleteLoading.set(false);
        this.showDeleteModal.set(false);
        this.deletionScheduledAt.set(res.scheduledAt);
        // Update user profile signal
        const user = this.authService.currentUser();
        if (user) {
          this.authService.currentUser.set({
            ...user,
            deletionRequestedAt: res.scheduledAt,
          });
        }
      },
      error: () => {
        this.deleteLoading.set(false);
        this.deleteError.set('errors.generic');
      },
    });
  }
}
