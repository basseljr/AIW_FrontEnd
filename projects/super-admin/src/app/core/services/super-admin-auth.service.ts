import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';

import { API_BASE_URL, AuthEventsService } from '@shared/api';
import {
  AuthSession,
  LoginCredentialsRequest,
  LoginCredentialsResponse,
  SuperAdminUser,
  VerifyMfaRequest,
} from '../models/super-admin-user.model';

const SESSION_KEY = 'sa_user';
const TOKEN_KEY = 'sa_access_token';
const DEVICE_KEY = 'sa_device_id';
const LAST_ACTIVITY_KEY = 'sa_last_activity';

/** 2 hours of inactivity per PRD §16. */
export const SESSION_INACTIVITY_MS = 2 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SuperAdminAuthService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = inject(API_BASE_URL);
  private readonly router = inject(Router);
  private readonly authEvents = inject(AuthEventsService);

  private readonly _currentUser = signal<SuperAdminUser | null>(this.hydrateSession());
  private readonly _accessToken = signal<string>(this.hydrateToken());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    this.authEvents.stream$
      .pipe(catchError(() => of(null)))
      .subscribe((event) => {
        if (event?.type === 'refresh-failed' || event?.type === 'session-expired') {
          this.clearSession();
          this.router.navigate(['/login']);
        }
      });

    if (this.isAuthenticated()) {
      this.enforceInactivityTimeout();
    }
  }

  /** Step 1: validate credentials. Returns either a session (trusted device) or an MFA challenge. */
  loginWithCredentials(req: LoginCredentialsRequest): Observable<LoginCredentialsResponse> {
    const body = {
      email: req.email,
      password: req.password,
      rememberDevice: !!req.rememberDevice,
      deviceId: this.getOrCreateDeviceId(),
    };
    return this.http
      .post<LoginCredentialsResponse>(`${this.baseUrl}/admin/auth/login`, body, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          if (res.session) {
            this.applySession(res.session);
          }
        }),
      );
  }

  /** Step 2: verify MFA code and complete login. */
  verifyMfa(req: VerifyMfaRequest): Observable<AuthSession> {
    const body = {
      mfaChallengeToken: req.mfaChallengeToken,
      code: req.code,
      rememberDevice: !!req.rememberDevice,
      deviceId: this.getOrCreateDeviceId(),
    };
    return this.http
      .post<AuthSession>(`${this.baseUrl}/admin/auth/login/mfa`, body, {
        withCredentials: true,
      })
      .pipe(tap((session) => this.applySession(session)));
  }

  logout(): void {
    this.http
      .post(`${this.baseUrl}/admin/auth/logout`, null, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      });
  }

  getToken(): string {
    return this._accessToken();
  }

  updateToken(token: string): void {
    this._accessToken.set(token);
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  /** Called on every user-initiated request via the interceptor. */
  recordActivity(): void {
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }

  /** Returns true if we exceeded the inactivity window and forced a logout. */
  enforceInactivityTimeout(): boolean {
    const lastActivity = parseInt(sessionStorage.getItem(LAST_ACTIVITY_KEY) ?? '0', 10);
    if (!lastActivity) return false;
    if (Date.now() - lastActivity > SESSION_INACTIVITY_MS) {
      this.clearSession();
      this.authEvents.emit({ type: 'session-expired' });
      return true;
    }
    return false;
  }

  private applySession(session: AuthSession): void {
    this._currentUser.set(session.user);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session.user));
    this.updateToken(session.accessToken);
    this.recordActivity();
  }

  private clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    this._currentUser.set(null);
    this._accessToken.set('');
  }

  private hydrateSession(): SuperAdminUser | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as SuperAdminUser) : null;
    } catch {
      return null;
    }
  }

  private hydrateToken(): string {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  }

  private getOrCreateDeviceId(): string {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }
}
