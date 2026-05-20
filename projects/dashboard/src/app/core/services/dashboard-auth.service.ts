import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { AuthEventsService } from '@shared/api';
import { DashboardUser, LoginRequest, LoginResponse } from '../models/dashboard-user.model';

const SESSION_KEY = 'db_user';
const TOKEN_KEY   = 'db_access_token';

@Injectable({ providedIn: 'root' })
export class DashboardAuthService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = inject(API_BASE_URL);          // readonly, used by interceptor
  private readonly router = inject(Router);
  private readonly authEvents = inject(AuthEventsService);

  private readonly _currentUser  = signal<DashboardUser | null>(this.hydrateSession());
  private readonly _accessToken  = signal<string>(this.hydrateToken());

  readonly currentUser      = this._currentUser.asReadonly();
  readonly isAuthenticated  = computed(() => this._currentUser() !== null);

  constructor() {
    this.authEvents.stream$.pipe(
      catchError(() => of(null)),
    ).subscribe((event) => {
      if (event?.type === 'refresh-failed' || event?.type === 'session-expired') {
        this.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, req, { withCredentials: true })
      .pipe(
        tap((res) => {
          const user: DashboardUser = {
            userId: res.userId,
            tenantId: res.tenantId,
            role: res.role,
            email: req.email,
          };
          this._currentUser.set(user);
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
          this.updateToken(res.accessToken);
        }),
      );
  }

  logout(): void {
    this.http
      .post(`${this.baseUrl}/auth/logout`, null, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      });
  }

  /** Returns the stored access token (empty string if not authenticated). */
  getToken(): string {
    return this._accessToken();
  }

  /** Called by the auth interceptor after a successful silent refresh. */
  updateToken(token: string): void {
    this._accessToken.set(token);
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  private clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    this._currentUser.set(null);
    this._accessToken.set('');
  }

  private hydrateSession(): DashboardUser | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as DashboardUser) : null;
    } catch {
      return null;
    }
  }

  private hydrateToken(): string {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  }
}
