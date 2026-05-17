import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'sf-login',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-page">
      <!-- Brand panel (desktop left) -->
      <div class="login-page__brand" aria-hidden="true">
        <div class="login-page__brand-inner">
          <div class="login-page__brand-badge">
            {{ 'auth.sign_in_title' | translate }}
          </div>
          <h1 class="login-page__brand-title">
            {{ 'home.hero_title' | translate }}
          </h1>
          <p class="login-page__brand-sub">
            {{ 'home.hero_subtitle' | translate }}
          </p>
        </div>
      </div>

      <!-- Form panel -->
      <div class="login-page__form-panel">
        <div class="login-page__form-card">
          <h2 class="login-page__form-title">
            {{ 'auth.sign_in_title' | translate }}
          </h2>

          @if (errorMsg()) {
            <div class="login-page__error" role="alert">
              {{ errorMsg() | translate }}
            </div>
          }

          <!-- Step 1: email -->
          @if (step() === 1) {
            <form
              [formGroup]="emailForm"
              (ngSubmit)="onEmailSubmit()"
              novalidate
            >
              <div class="login-page__field">
                <label class="login-page__label" for="login-email">
                  {{ 'auth.email' | translate }}
                </label>
                <input
                  id="login-email"
                  class="login-page__input"
                  [class.login-page__input--error]="emailTouched() && emailForm.controls.email.invalid"
                  type="email"
                  autocomplete="email"
                  formControlName="email"
                  [placeholder]="'auth.email_placeholder' | translate"
                />
                @if (emailTouched() && emailForm.controls.email.hasError('required')) {
                  <span class="login-page__field-error">{{ 'errors.required' | translate }}</span>
                }
                @if (emailTouched() && emailForm.controls.email.hasError('email')) {
                  <span class="login-page__field-error">{{ 'errors.invalid_email' | translate }}</span>
                }
              </div>

              <button
                class="login-page__submit"
                type="submit"
                [disabled]="emailForm.invalid"
              >
                {{ 'common.next' | translate }}
              </button>
            </form>
          }

          <!-- Step 2: password -->
          @if (step() === 2) {
            <p class="login-page__step-hint">{{ emailForm.controls.email.value }}</p>
            <form
              [formGroup]="passwordForm"
              (ngSubmit)="onPasswordSubmit()"
              novalidate
            >
              <div class="login-page__field">
                <label class="login-page__label" for="login-password">
                  {{ 'auth.password' | translate }}
                </label>
                <input
                  id="login-password"
                  class="login-page__input"
                  [class.login-page__input--error]="pwTouched() && passwordForm.controls.password.invalid"
                  type="password"
                  autocomplete="current-password"
                  formControlName="password"
                  [placeholder]="'auth.password_placeholder' | translate"
                />
                @if (pwTouched() && passwordForm.controls.password.hasError('required')) {
                  <span class="login-page__field-error">{{ 'errors.required' | translate }}</span>
                }
              </div>

              <a
                class="login-page__forgot"
                [routerLink]="['/', activeLang(), 'forgot-password']"
              >
                {{ 'auth.forgot_password' | translate }}
              </a>

              <div class="login-page__actions">
                <button
                  type="button"
                  class="login-page__back"
                  (click)="step.set(1)"
                >
                  {{ 'common.back' | translate }}
                </button>
                <button
                  class="login-page__submit"
                  type="submit"
                  [disabled]="passwordForm.invalid || isLoading()"
                >
                  @if (isLoading()) {
                    {{ 'common.loading' | translate }}
                  } @else {
                    {{ 'auth.sign_in_action' | translate }}
                  }
                </button>
              </div>
            </form>
          }

          <!-- Register link -->
          <p class="login-page__alt">
            {{ 'auth.no_account' | translate }}
            <a
              class="login-page__alt-link"
              [routerLink]="['/', activeLang(), 'register']"
            >
              {{ 'auth.sign_up_action' | translate }}
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        display: flex;
        min-block-size: calc(100vh - 4rem);
      }

      /* Brand panel */
      .login-page__brand {
        display: none;
        flex: 1;
        background: var(--color-header-footer, #1e1b17);
        align-items: center;
        justify-content: center;
        padding: 3rem;
      }
      @media (min-width: 768px) {
        .login-page__brand {
          display: flex;
        }
      }
      .login-page__brand-inner {
        max-inline-size: 28rem;
      }
      .login-page__brand-badge {
        display: inline-block;
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding-block: 0.25rem;
        padding-inline: 0.75rem;
        border-radius: var(--border-radius-full, 9999px);
        margin-block-end: 1.5rem;
      }
      .login-page__brand-title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #fff;
        line-height: 1.15;
        margin-block-end: 1rem;
        letter-spacing: -0.03em;
      }
      .login-page__brand-sub {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.65);
        line-height: 1.7;
      }

      /* Form panel */
      .login-page__form-panel {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1.5rem;
        background: var(--color-background, #fff8f1);
      }

      .login-page__form-card {
        inline-size: 100%;
        max-inline-size: 24rem;
      }

      .login-page__form-title {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        margin-block-end: 1.5rem;
        letter-spacing: -0.03em;
      }

      .login-page__error {
        background: #fef2f2;
        color: var(--color-error, #dc2626);
        border: 1px solid #fecaca;
        border-radius: var(--border-radius-md, 8px);
        padding-block: 0.75rem;
        padding-inline: 1rem;
        font-size: 0.875rem;
        margin-block-end: 1.25rem;
      }

      .login-page__step-hint {
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.65;
        margin-block-end: 1rem;
      }

      .login-page__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        margin-block-end: 1.25rem;
      }

      .login-page__label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
      }

      .login-page__input {
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
      .login-page__input:focus {
        outline: none;
        border-color: var(--color-primary);
      }
      .login-page__input--error {
        border-color: var(--color-error, #dc2626);
      }

      .login-page__field-error {
        font-size: 0.75rem;
        color: var(--color-error, #dc2626);
      }

      .login-page__forgot {
        display: block;
        font-size: 0.8125rem;
        color: var(--color-primary);
        text-decoration: none;
        margin-block-start: -0.5rem;
        margin-block-end: 1.25rem;
        text-align: end;
      }
      .login-page__forgot:hover {
        text-decoration: underline;
      }

      .login-page__submit {
        inline-size: 100%;
        block-size: 2.75rem;
        background: var(--color-primary);
        color: var(--color-on-primary, #fff);
        border: none;
        border-radius: var(--border-radius-md, 8px);
        font-size: 0.9375rem;
        font-weight: 700;
        cursor: pointer;
        transition: opacity 0.2s;
        font-family: inherit;
      }
      .login-page__submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .login-page__submit:not(:disabled):hover {
        opacity: 0.9;
      }

      .login-page__actions {
        display: flex;
        gap: 0.75rem;
      }

      .login-page__back {
        flex: 0 0 auto;
        block-size: 2.75rem;
        padding-inline: 1.25rem;
        background: transparent;
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
        cursor: pointer;
        font-family: inherit;
        transition: background-color 0.2s;
      }
      .login-page__back:hover {
        background: var(--color-surface-container, #f4ede5);
      }

      .login-page__alt {
        margin-block-start: 1.5rem;
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.7;
        text-align: center;
      }
      .login-page__alt-link {
        color: var(--color-primary);
        font-weight: 600;
        text-decoration: none;
        margin-inline-start: 0.25rem;
      }
      .login-page__alt-link:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly lang = inject(LanguageToggleService);

  readonly activeLang = this.lang.current;
  readonly step = signal<1 | 2>(1);
  readonly isLoading = this.authService.isLoading;
  readonly errorMsg = signal<string>('');
  readonly emailTouched = signal(false);
  readonly pwTouched = signal(false);

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    password: ['', Validators.required],
  });

  onEmailSubmit(): void {
    this.emailTouched.set(true);
    if (this.emailForm.invalid) return;
    this.step.set(2);
  }

  onPasswordSubmit(): void {
    this.pwTouched.set(true);
    if (this.passwordForm.invalid) return;

    const email = this.emailForm.controls.email.value;
    const password = this.passwordForm.controls.password.value;
    const guestCartId = this.cartService.cartId();

    this.errorMsg.set('');
    this.authService.login(email, password, guestCartId).subscribe({
      next: () => {
        const returnUrl =
          (this.route.snapshot.queryParamMap.get('returnUrl') as string | null) ??
          `/${this.activeLang()}/account`;
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        const status = err?.status ?? 0;
        if (status === 401) {
          this.errorMsg.set('auth.invalid_credentials');
        } else if (status === 423) {
          this.errorMsg.set('auth.account_locked');
        } else {
          this.errorMsg.set('errors.generic');
        }
      },
    });
  }
}
