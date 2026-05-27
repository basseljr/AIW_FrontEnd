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
import { SuperAdminAuthService } from '../../../core/services/super-admin-auth.service';

type Step = 'credentials' | 'mfa';

const FAILED_ATTEMPT_KEY = 'sa_failed_attempts';

@Component({
  selector: 'sa-login',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './super-admin-login.component.html',
  styleUrls: ['./super-admin-login.component.css'],
})
export class SuperAdminLoginComponent implements OnInit {
  private readonly auth = inject(SuperAdminAuthService);
  private readonly router = inject(Router);

  readonly step = signal<Step>('credentials');
  readonly email = signal('');
  readonly password = signal('');
  readonly rememberDevice = signal(false);
  readonly mfaCode = signal('');
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly errorKey = signal<string | null>(null);
  readonly failedAttempts = signal(this.loadFailedAttempts());

  private mfaChallengeToken: string | null = null;

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  submitCredentials(): void {
    this.submitted.set(true);
    this.errorKey.set(null);
    const email = this.email().trim();
    const password = this.password();
    if (!email || !password) return;

    this.loading.set(true);
    this.auth
      .loginWithCredentials({ email, password, rememberDevice: this.rememberDevice() })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.clearFailedAttempts();
          if (res.session) {
            this.router.navigate(['/']);
            return;
          }
          this.mfaChallengeToken = res.mfaChallengeToken;
          this.step.set('mfa');
          this.submitted.set(false);
        },
        error: (err: unknown) => this.handleError(err),
      });
  }

  submitMfa(): void {
    this.submitted.set(true);
    this.errorKey.set(null);
    const code = this.mfaCode().trim();
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      this.errorKey.set('auth.login.mfa_invalid_format');
      return;
    }
    if (!this.mfaChallengeToken) {
      this.step.set('credentials');
      return;
    }

    this.loading.set(true);
    this.auth
      .verifyMfa({
        mfaChallengeToken: this.mfaChallengeToken,
        code,
        rememberDevice: this.rememberDevice(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.clearFailedAttempts();
          this.router.navigate(['/']);
        },
        error: (err: unknown) => this.handleError(err),
      });
  }

  backToCredentials(): void {
    this.step.set('credentials');
    this.mfaCode.set('');
    this.errorKey.set(null);
    this.submitted.set(false);
  }

  private handleError(err: unknown): void {
    this.loading.set(false);
    if (err instanceof ApiError) {
      if (err.status === 401) {
        this.recordFailedAttempt();
        this.errorKey.set(
          this.step() === 'mfa' ? 'auth.login.mfa_invalid' : 'auth.login.invalid_credentials',
        );
      } else if (err.status === 423) {
        this.errorKey.set('auth.login.account_locked');
      } else if (err.status === 403) {
        this.errorKey.set('auth.login.not_super_admin');
      } else {
        this.errorKey.set('auth.login.generic_error');
      }
    } else {
      this.errorKey.set('auth.login.generic_error');
    }
  }

  private loadFailedAttempts(): number {
    return parseInt(sessionStorage.getItem(FAILED_ATTEMPT_KEY) ?? '0', 10);
  }

  private recordFailedAttempt(): void {
    const next = this.failedAttempts() + 1;
    this.failedAttempts.set(next);
    sessionStorage.setItem(FAILED_ATTEMPT_KEY, next.toString());
  }

  private clearFailedAttempts(): void {
    this.failedAttempts.set(0);
    sessionStorage.removeItem(FAILED_ATTEMPT_KEY);
  }
}
