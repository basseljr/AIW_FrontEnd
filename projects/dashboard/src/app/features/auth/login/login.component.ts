import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ApiError } from '@shared/api';
import { DashboardAuthService } from '../../../core/services/dashboard-auth.service';
import { LoginRequest } from '../../../core/models/dashboard-user.model';

const TENANT_ID_KEY = 'db_last_tenant_id';

@Component({
  selector: 'db-login',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-login">
      <div class="db-login__card">
        <div class="db-login__brand">
          <div class="db-login__logo-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="var(--accent)" />
              <path d="M8 22L12 10L16 18L20 14L24 22H8Z" fill="var(--on-accent)" opacity="0.9" />
            </svg>
          </div>
          <span class="db-login__logo-wordmark">Aiw</span>
        </div>

        <h1 class="db-login__title">{{ 'auth.login.title' | translate }}</h1>
        <p class="db-login__subtitle">{{ 'auth.login.subtitle' | translate }}</p>

        <form class="db-login__form" (ngSubmit)="submit()" #loginForm="ngForm" novalidate>
          <div class="db-login__field">
            <label class="db-login__label" for="tenantId">
              {{ 'auth.login.tenant_id_label' | translate }}
            </label>
            <input
              id="tenantId"
              name="tenantId"
              class="db-login__input"
              [class.db-login__input--error]="submitted() && !form().tenantId"
              type="text"
              autocomplete="organization"
              [placeholder]="'auth.login.tenant_id_placeholder' | translate"
              [(ngModel)]="form().tenantId"
              required
            />
          </div>

          <div class="db-login__field">
            <label class="db-login__label" for="email">
              {{ 'auth.login.email_label' | translate }}
            </label>
            <input
              id="email"
              name="email"
              class="db-login__input"
              [class.db-login__input--error]="submitted() && !form().email"
              type="email"
              autocomplete="email"
              [placeholder]="'auth.login.email_placeholder' | translate"
              [(ngModel)]="form().email"
              required
            />
          </div>

          <div class="db-login__field">
            <label class="db-login__label" for="password">
              {{ 'auth.login.password_label' | translate }}
            </label>
            <input
              id="password"
              name="password"
              class="db-login__input"
              [class.db-login__input--error]="submitted() && !form().password"
              type="password"
              autocomplete="current-password"
              [placeholder]="'auth.login.password_placeholder' | translate"
              [(ngModel)]="form().password"
              required
            />
          </div>

          @if (errorKey()) {
            <p class="db-login__error" role="alert">
              {{ errorKey()! | translate }}
            </p>
          }

          <button
            class="db-login__submit"
            type="submit"
            [disabled]="loading()"
          >
            @if (loading()) {
              {{ 'auth.login.signing_in' | translate }}
            } @else {
              {{ 'auth.login.submit' | translate }}
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .db-login {
        min-block-size: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-alt);
        padding: 1.5rem;
      }

      .db-login__card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-card);
        padding: 2.5rem;
        inline-size: 100%;
        max-inline-size: 26rem;
        box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
      }

      .db-login__brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-block-end: 2rem;
      }

      .db-login__logo-wordmark {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--text);
        letter-spacing: -0.03em;
      }

      .db-login__title {
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text);
        margin: 0 0 0.375rem;
        letter-spacing: -0.02em;
      }

      .db-login__subtitle {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin: 0 0 2rem;
      }

      .db-login__form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .db-login__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .db-login__label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text);
      }

      .db-login__input {
        inline-size: 100%;
        padding-block: 0.625rem;
        padding-inline: 0.875rem;
        border: 1.5px solid var(--border);
        border-radius: var(--radius-control);
        background: var(--surface-elevated);
        color: var(--text);
        font-size: 0.9375rem;
        font-family: inherit;
        transition: border-color var(--motion-base) ease, box-shadow var(--motion-base) ease;
        outline: none;
        box-sizing: border-box;
      }

      .db-login__input::placeholder {
        color: var(--text-subtle);
      }

      .db-login__input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
      }

      .db-login__input--error {
        border-color: var(--danger);
      }

      .db-login__input--error:focus {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 18%, transparent);
      }

      .db-login__error {
        font-size: 0.875rem;
        color: var(--danger);
        margin: 0;
        padding: 0.625rem 0.75rem;
        background: color-mix(in srgb, var(--danger) 8%, transparent);
        border-radius: var(--radius-control);
        border-inline-start: 3px solid var(--danger);
      }

      .db-login__submit {
        inline-size: 100%;
        padding-block: 0.75rem;
        background: var(--accent);
        color: var(--on-accent);
        border: none;
        border-radius: var(--radius-control);
        font-size: 0.9375rem;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: background-color var(--motion-base) ease;
        margin-block-start: 0.5rem;
      }

      .db-login__submit:hover:not(:disabled) {
        background: var(--accent-hover);
      }

      .db-login__submit:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(DashboardAuthService);
  private readonly router = inject(Router);

  readonly form = signal<LoginRequest>({ tenantId: '', email: '', password: '' });
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly errorKey = signal<string | null>(null);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }
    const savedTenantId = localStorage.getItem(TENANT_ID_KEY);
    if (savedTenantId) {
      this.form.update((f) => ({ ...f, tenantId: savedTenantId }));
    }
  }

  submit(): void {
    this.submitted.set(true);
    this.errorKey.set(null);

    const { tenantId, email, password } = this.form();
    if (!tenantId || !email || !password) return;

    this.loading.set(true);
    this.auth.login({ tenantId, email, password }).subscribe({
      next: () => {
        localStorage.setItem(TENANT_ID_KEY, tenantId);
        this.router.navigate(['/']);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        if (err instanceof ApiError) {
          if (err.status === 401) {
            this.errorKey.set('auth.login.invalid_credentials');
          } else if (err.status === 423) {
            this.errorKey.set('auth.login.account_locked');
          } else {
            this.errorKey.set('auth.login.generic_error');
          }
        } else {
          this.errorKey.set('auth.login.generic_error');
        }
      },
    });
  }
}
