import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { LanguageToggleService } from '@shared/i18n';
import { CartService } from './cart.service';
import { AuthResponse, CustomerProfile } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly cartService = inject(CartService);
  private readonly lang = inject(LanguageToggleService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentUser = signal<CustomerProfile | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isLoading = signal(false);
  readonly isInitialized = signal(!isPlatformBrowser(inject(PLATFORM_ID)));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile().subscribe({
        next: () => this.isInitialized.set(true),
        error: () => this.isInitialized.set(true),
      });
    }
  }

  login(
    email: string,
    password: string,
    guestCartId: string | null,
  ): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<AuthResponse>(
        `${this.baseUrl}/storefront/auth/login`,
        { email, password, guestCartId },
        { withCredentials: true },
      )
      .pipe(
        switchMap((authResp) =>
          this.loadProfile().pipe(
            tap(() => {
              this.cartService.reload();
              this.isLoading.set(false);
            }),
            map(() => authResp),
          ),
        ),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        }),
      );
  }

  register(
    fullName: string,
    email: string,
    password: string,
    phone: string | null,
    guestCartId: string | null,
  ): Observable<AuthResponse> {
    this.isLoading.set(true);
    const verificationBaseUrl = isPlatformBrowser(this.platformId)
      ? `${window.location.origin}/${this.lang.current()}/verify-email`
      : '';
    return this.http
      .post<AuthResponse>(
        `${this.baseUrl}/storefront/auth/register`,
        { fullName, email, password, phone, phoneCountryCode: '+965', guestCartId, verificationBaseUrl },
        { withCredentials: true },
      )
      .pipe(
        switchMap((authResp) =>
          this.loadProfile().pipe(
            tap(() => {
              this.cartService.reload();
              this.isLoading.set(false);
            }),
            map(() => authResp),
          ),
        ),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        }),
      );
  }

  forgotPassword(email: string): Observable<void> {
    const resetBaseUrl = isPlatformBrowser(this.platformId)
      ? `${window.location.origin}/${this.lang.current()}/reset-password`
      : '';
    return this.http.post<void>(
      `${this.baseUrl}/storefront/auth/forgot-password`,
      { email, resetBaseUrl },
      { withCredentials: true },
    );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/storefront/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap({
          next: () => {
            this.currentUser.set(null);
            this.cartService.clear();
          },
          error: () => {
            this.currentUser.set(null);
          },
        }),
      );
  }

  loadProfile(): Observable<CustomerProfile> {
    return this.http
      .get<CustomerProfile>(`${this.baseUrl}/storefront/account/profile`, { withCredentials: true })
      .pipe(tap((profile) => this.currentUser.set(profile)));
  }
}
