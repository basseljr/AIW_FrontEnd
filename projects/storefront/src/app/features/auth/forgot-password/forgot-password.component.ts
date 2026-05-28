import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'sf-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="fp-page">
      <div class="fp-page__brand">
        <div class="fp-page__brand-inner">
          <div class="fp-page__logo">
            <span class="fp-page__logo-icon">✦</span>
          </div>
          <h2 class="fp-page__brand-title">
            {{ 'auth.forgot_password_page.title' | translate }}
          </h2>
          <p class="fp-page__brand-subtitle">
            {{ 'auth.forgot_password_page.subtitle' | translate }}
          </p>
        </div>
      </div>

      <div class="fp-page__panel">
        <div class="fp-page__form-wrapper">

          @if (sent()) {
            <div class="fp-page__success">
              <div class="fp-page__success-icon">✓</div>
              <h1 class="fp-page__success-title">
                {{ 'auth.forgot_password_page.success_title' | translate }}
              </h1>
              <p class="fp-page__success-message">
                {{ 'auth.forgot_password_page.success_message' | translate }}
              </p>
              <a
                class="fp-page__back-link"
                [routerLink]="['/', lang(), 'login']"
              >
                {{ 'auth.forgot_password_page.back_to_login' | translate }}
              </a>
            </div>
          } @else {
            <h1 class="fp-page__title">
              {{ 'auth.forgot_password_page.title' | translate }}
            </h1>
            <p class="fp-page__subtitle">
              {{ 'auth.forgot_password_page.subtitle' | translate }}
            </p>

            <form
              class="fp-page__form"
              [formGroup]="form"
              (ngSubmit)="submit()"
              novalidate
            >
              <div class="fp-page__field">
                <label class="fp-page__label" for="fp-email">
                  {{ 'auth.forgot_password_page.email_label' | translate }}
                </label>
                <input
                  id="fp-email"
                  class="fp-page__input"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  [class.fp-page__input--error]="emailInvalid"
                />
                @if (emailInvalid) {
                  <span class="fp-page__field-error">
                    {{ 'auth.forgot_password_page.invalid_email' | translate }}
                  </span>
                }
              </div>

              <button
                type="submit"
                class="fp-page__submit"
                [disabled]="submitting()"
              >
                @if (submitting()) {
                  {{ 'auth.forgot_password_page.submitting' | translate }}
                } @else {
                  {{ 'auth.forgot_password_page.submit' | translate }}
                }
              </button>
            </form>

            <a
              class="fp-page__back-link"
              [routerLink]="['/', lang(), 'login']"
            >
              {{ 'auth.forgot_password_page.back_to_login' | translate }}
            </a>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .fp-page {
      display: flex;
      min-block-size: 100vh;
      background: var(--color-bg, #0f0f0f);
    }

    .fp-page__brand {
      display: none;
      flex: 0 0 420px;
      background: var(--color-primary, #7c3aed);
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }

    @media (min-width: 1024px) {
      .fp-page__brand {
        display: flex;
      }
    }

    .fp-page__brand-inner {
      text-align: center;
      color: #fff;
    }

    .fp-page__logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 72px;
      block-size: 72px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      margin-block-end: 1.5rem;
    }

    .fp-page__logo-icon {
      font-size: 2rem;
      color: #fff;
    }

    .fp-page__brand-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin-block-end: 0.75rem;
      letter-spacing: -0.02em;
    }

    .fp-page__brand-subtitle {
      font-size: 1rem;
      opacity: 0.8;
      line-height: 1.6;
    }

    .fp-page__panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .fp-page__form-wrapper {
      inline-size: 100%;
      max-inline-size: 420px;
    }

    .fp-page__title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text, #fff);
      margin-block-end: 0.5rem;
      letter-spacing: -0.02em;
    }

    .fp-page__subtitle {
      font-size: 0.9375rem;
      color: var(--color-text-muted, rgba(255,255,255,0.6));
      margin-block-end: 2rem;
      line-height: 1.6;
    }

    .fp-page__form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-block-end: 1.5rem;
    }

    .fp-page__field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .fp-page__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text, #fff);
    }

    .fp-page__input {
      block-size: 48px;
      padding-inline: 1rem;
      border-radius: 8px;
      border: 1.5px solid var(--color-border, rgba(255,255,255,0.12));
      background: var(--color-surface, rgba(255,255,255,0.05));
      color: var(--color-text, #fff);
      font-size: 0.9375rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .fp-page__input:focus {
      border-color: var(--color-primary, #7c3aed);
    }

    .fp-page__input--error {
      border-color: #ef4444 !important;
    }

    .fp-page__field-error {
      font-size: 0.8125rem;
      color: #ef4444;
    }

    .fp-page__submit {
      block-size: 48px;
      border-radius: 8px;
      background: var(--color-primary, #7c3aed);
      color: #fff;
      font-size: 0.9375rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .fp-page__submit:hover:not(:disabled) {
      opacity: 0.9;
    }

    .fp-page__submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .fp-page__back-link {
      display: block;
      text-align: center;
      font-size: 0.875rem;
      color: var(--color-primary, #7c3aed);
      text-decoration: none;
      margin-block-start: 0.75rem;
    }

    .fp-page__back-link:hover {
      text-decoration: underline;
    }

    .fp-page__success {
      text-align: center;
      padding: 2rem 0;
    }

    .fp-page__success-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 64px;
      block-size: 64px;
      border-radius: 50%;
      background: rgba(34, 197, 94, 0.15);
      border: 2px solid rgba(34, 197, 94, 0.4);
      color: #22c55e;
      font-size: 1.5rem;
      font-weight: 700;
      margin-block-end: 1.5rem;
    }

    .fp-page__success-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text, #fff);
      margin-block-end: 0.75rem;
    }

    .fp-page__success-message {
      font-size: 0.9375rem;
      color: var(--color-text-muted, rgba(255,255,255,0.6));
      line-height: 1.6;
      margin-block-end: 2rem;
    }
  `],
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly langService = inject(LanguageToggleService);

  readonly lang = this.langService.current;
  readonly submitting = signal(false);
  readonly sent = signal(false);

  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get emailInvalid(): boolean {
    const c = this.form.get('email');
    return !!(c && c.invalid && c.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
      },
      error: () => {
        // Never reveal whether email exists — always show success
        this.submitting.set(false);
        this.sent.set(true);
      },
    });
  }
}
