import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

function passwordStrength(pw: string): 'weak' | 'fair' | 'strong' {
  if (pw.length < 8) return 'weak';
  let score = 0;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 2) return 'fair';
  return 'strong';
}

function confirmPasswordValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const pw = parent.get('password')?.value as string | undefined;
  return pw === control.value ? null : { mismatch: true };
}

@Component({
  selector: 'sf-register',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reg-page">
      <!-- Brand panel (desktop left) -->
      <div class="reg-page__brand" aria-hidden="true">
        <div class="reg-page__brand-inner">
          <div class="reg-page__brand-badge">
            {{ 'auth.sign_up_title' | translate }}
          </div>
          <h1 class="reg-page__brand-title">
            {{ 'home.hero_title' | translate }}
          </h1>
          <p class="reg-page__brand-sub">
            {{ 'home.hero_subtitle' | translate }}
          </p>
        </div>
      </div>

      <!-- Form panel -->
      <div class="reg-page__form-panel">
        <div class="reg-page__form-card">
          <h2 class="reg-page__form-title">
            {{ 'auth.sign_up_title' | translate }}
          </h2>

          @if (errorMsg()) {
            <div class="reg-page__error" role="alert">
              {{ errorMsg() | translate }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <!-- Full name -->
            <div class="reg-page__field">
              <label class="reg-page__label" for="reg-fullname">
                {{ 'auth.full_name' | translate }}
              </label>
              <input
                id="reg-fullname"
                class="reg-page__input"
                [class.reg-page__input--error]="touched() && form.controls.fullName.invalid"
                type="text"
                autocomplete="name"
                formControlName="fullName"
              />
              @if (touched() && form.controls.fullName.hasError('required')) {
                <span class="reg-page__field-error">{{ 'errors.required' | translate }}</span>
              }
            </div>

            <!-- Email -->
            <div class="reg-page__field">
              <label class="reg-page__label" for="reg-email">
                {{ 'auth.email' | translate }}
              </label>
              <input
                id="reg-email"
                class="reg-page__input"
                [class.reg-page__input--error]="touched() && form.controls.email.invalid"
                type="email"
                autocomplete="email"
                formControlName="email"
                [placeholder]="'auth.email_placeholder' | translate"
              />
              @if (touched() && form.controls.email.hasError('required')) {
                <span class="reg-page__field-error">{{ 'errors.required' | translate }}</span>
              }
              @if (touched() && form.controls.email.hasError('email')) {
                <span class="reg-page__field-error">{{ 'errors.invalid_email' | translate }}</span>
              }
            </div>

            <!-- Phone -->
            <div class="reg-page__field">
              <label class="reg-page__label" for="reg-phone">
                {{ 'auth.phone' | translate }}
              </label>
              <div class="reg-page__phone-row">
                <span class="reg-page__phone-prefix">+965</span>
                <input
                  id="reg-phone"
                  class="reg-page__input reg-page__input--phone"
                  type="tel"
                  autocomplete="tel"
                  formControlName="phone"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="reg-page__field">
              <label class="reg-page__label" for="reg-password">
                {{ 'auth.password' | translate }}
              </label>
              <input
                id="reg-password"
                class="reg-page__input"
                [class.reg-page__input--error]="touched() && form.controls.password.invalid"
                type="password"
                autocomplete="new-password"
                formControlName="password"
                [placeholder]="'auth.password_placeholder' | translate"
              />
              @if (touched() && form.controls.password.hasError('required')) {
                <span class="reg-page__field-error">{{ 'errors.required' | translate }}</span>
              }
              @if (form.controls.password.value) {
                <!-- Strength meter -->
                <div class="reg-page__strength">
                  <div class="reg-page__strength-bars">
                    <span
                      class="reg-page__strength-bar"
                      [class.reg-page__strength-bar--weak]="strength() === 'weak'"
                      [class.reg-page__strength-bar--fair]="strength() === 'fair' || strength() === 'strong'"
                      [class.reg-page__strength-bar--strong]="strength() === 'strong'"
                    ></span>
                    <span
                      class="reg-page__strength-bar"
                      [class.reg-page__strength-bar--fair]="strength() === 'fair' || strength() === 'strong'"
                      [class.reg-page__strength-bar--strong]="strength() === 'strong'"
                    ></span>
                    <span
                      class="reg-page__strength-bar"
                      [class.reg-page__strength-bar--strong]="strength() === 'strong'"
                    ></span>
                  </div>
                  <span class="reg-page__strength-label">
                    {{ 'auth.password_strength' | translate }}:
                    @if (strength() === 'weak') { {{ 'auth.password_strength_weak' | translate }} }
                    @if (strength() === 'fair') { {{ 'auth.password_strength_fair' | translate }} }
                    @if (strength() === 'strong') { {{ 'auth.password_strength_strong' | translate }} }
                  </span>
                </div>
              }
            </div>

            <!-- Confirm password -->
            <div class="reg-page__field">
              <label class="reg-page__label" for="reg-confirm">
                {{ 'auth.confirm_password' | translate }}
              </label>
              <input
                id="reg-confirm"
                class="reg-page__input"
                [class.reg-page__input--error]="touched() && form.controls.confirmPassword.invalid"
                type="password"
                autocomplete="new-password"
                formControlName="confirmPassword"
              />
              @if (touched() && form.controls.confirmPassword.hasError('required')) {
                <span class="reg-page__field-error">{{ 'errors.required' | translate }}</span>
              }
              @if (touched() && form.controls.confirmPassword.hasError('mismatch')) {
                <span class="reg-page__field-error">{{ 'errors.passwords_dont_match' | translate }}</span>
              }
            </div>

            <button
              class="reg-page__submit"
              type="submit"
              [disabled]="isLoading()"
            >
              @if (isLoading()) {
                {{ 'common.loading' | translate }}
              } @else {
                {{ 'auth.sign_up_action' | translate }}
              }
            </button>
          </form>

          <p class="reg-page__alt">
            {{ 'auth.have_account' | translate }}
            <a
              class="reg-page__alt-link"
              [routerLink]="['/', activeLang(), 'login']"
            >
              {{ 'auth.sign_in_action' | translate }}
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .reg-page {
        display: flex;
        min-block-size: calc(100vh - 4rem);
      }

      .reg-page__brand {
        display: none;
        flex: 1;
        background: var(--color-header-footer, #1e1b17);
        align-items: center;
        justify-content: center;
        padding: 3rem;
      }
      @media (min-width: 768px) {
        .reg-page__brand {
          display: flex;
        }
      }
      .reg-page__brand-inner {
        max-inline-size: 28rem;
      }
      .reg-page__brand-badge {
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
      .reg-page__brand-title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #fff;
        line-height: 1.15;
        margin-block-end: 1rem;
        letter-spacing: -0.03em;
      }
      .reg-page__brand-sub {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.65);
        line-height: 1.7;
      }

      .reg-page__form-panel {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1.5rem;
        background: var(--color-background, #fff8f1);
      }

      .reg-page__form-card {
        inline-size: 100%;
        max-inline-size: 24rem;
      }

      .reg-page__form-title {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--color-on-surface, #1e1b17);
        margin-block-end: 1.5rem;
        letter-spacing: -0.03em;
      }

      .reg-page__error {
        background: #fef2f2;
        color: var(--color-error, #dc2626);
        border: 1px solid #fecaca;
        border-radius: var(--border-radius-md, 8px);
        padding-block: 0.75rem;
        padding-inline: 1rem;
        font-size: 0.875rem;
        margin-block-end: 1.25rem;
      }

      .reg-page__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        margin-block-end: 1rem;
      }

      .reg-page__label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
      }

      .reg-page__input {
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
      .reg-page__input:focus {
        outline: none;
        border-color: var(--color-primary);
      }
      .reg-page__input--error {
        border-color: var(--color-error, #dc2626);
      }

      .reg-page__phone-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .reg-page__phone-prefix {
        block-size: 2.75rem;
        padding-inline: 0.75rem;
        display: flex;
        align-items: center;
        background: var(--color-surface-container, #f4ede5);
        border: 1.5px solid var(--color-outline-variant, #d6c4ad);
        border-radius: var(--border-radius-md, 8px);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-on-surface, #1e1b17);
        white-space: nowrap;
        flex-shrink: 0;
      }
      .reg-page__input--phone {
        flex: 1;
      }

      .reg-page__field-error {
        font-size: 0.75rem;
        color: var(--color-error, #dc2626);
      }

      /* Password strength meter */
      .reg-page__strength {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-block-start: 0.375rem;
      }
      .reg-page__strength-bars {
        display: flex;
        gap: 0.25rem;
      }
      .reg-page__strength-bar {
        display: block;
        inline-size: 2rem;
        block-size: 0.25rem;
        border-radius: 9999px;
        background: var(--color-outline-variant, #d6c4ad);
        transition: background-color 0.2s;
      }
      .reg-page__strength-bar--weak {
        background: var(--color-error, #dc2626);
      }
      .reg-page__strength-bar--fair {
        background: var(--color-warning, #b45309);
      }
      .reg-page__strength-bar--strong {
        background: var(--color-success, #16a34a);
      }
      .reg-page__strength-label {
        font-size: 0.75rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.7;
      }

      .reg-page__submit {
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
        margin-block-start: 0.5rem;
      }
      .reg-page__submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .reg-page__submit:not(:disabled):hover {
        opacity: 0.9;
      }

      .reg-page__alt {
        margin-block-start: 1.5rem;
        font-size: 0.875rem;
        color: var(--color-on-surface, #1e1b17);
        opacity: 0.7;
        text-align: center;
      }
      .reg-page__alt-link {
        color: var(--color-primary);
        font-weight: 600;
        text-decoration: none;
        margin-inline-start: 0.25rem;
      }
      .reg-page__alt-link:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly lang = inject(LanguageToggleService);

  readonly activeLang = this.lang.current;
  readonly isLoading = this.authService.isLoading;
  readonly errorMsg = signal<string>('');
  readonly touched = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, confirmPasswordValidator]],
  });

  readonly strength = computed(() =>
    passwordStrength(this.form.controls.password.value),
  );

  onSubmit(): void {
    this.touched.set(true);
    // Re-validate confirmPassword in case password changed after first touch
    this.form.controls.confirmPassword.updateValueAndValidity();
    if (this.form.invalid) return;

    const { fullName, email, phone, password } = this.form.getRawValue();
    const guestCartId = this.cartService.cartId();
    const phoneVal = phone.trim() ? phone.trim() : null;

    this.errorMsg.set('');
    this.authService.register(fullName, email, password, phoneVal, guestCartId).subscribe({
      next: () => {
        this.router.navigate(['/', this.activeLang(), 'account']);
      },
      error: (err) => {
        const status = err?.status ?? 0;
        if (status === 409) {
          this.errorMsg.set('auth.email_already_exists');
        } else {
          this.errorMsg.set('errors.generic');
        }
      },
    });
  }
}
