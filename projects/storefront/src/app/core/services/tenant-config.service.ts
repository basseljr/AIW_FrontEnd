import { Injectable, PLATFORM_ID, Optional, Inject, inject, signal, computed } from '@angular/core';
import { isPlatformServer, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { makeStateKey, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { TenantConfig, DEFAULT_DEV_TENANT, ApiTenantConfigResponse, mapApiTenantConfig, buildTenantThemeCSS } from '../models/tenant-config.model';
import { TENANT_CONFIG_TOKEN, ROUTE_NOT_FOUND_TOKEN } from '../tokens/tenant-config.token';
import { API_BASE_URL } from '@shared/api';

export const TENANT_CONFIG_STATE_KEY = makeStateKey<TenantConfig>('tenant-config');
export const NOT_FOUND_STATE_KEY = makeStateKey<boolean>('not-found');

/**
 * Provides the resolved tenant configuration to the entire Angular app.
 *
 * Data flow:
 *   SSR:    Express resolves tenant → injects via TENANT_CONFIG_TOKEN → this
 *           service stores in TransferState.
 *   Browser: reads TransferState (no API round-trip), clears it, exposes signal.
 *   Fallback (unreachable API in dev): DEFAULT_DEV_TENANT.
 *
 * Components should inject this service and bind to `config()` or `isReady()`.
 */
@Injectable({ providedIn: 'root' })
export class TenantConfigService {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly doc = inject(DOCUMENT);

  private readonly _config = signal<TenantConfig | null>(null);
  private readonly _isNotFound = signal(false);

  readonly config = this._config.asReadonly();
  readonly isNotFound = this._isNotFound.asReadonly();
  readonly isReady = computed(() => this._config() !== null || this._isNotFound());

  constructor(
    @Optional() @Inject(TENANT_CONFIG_TOKEN) serverConfig: TenantConfig | null,
    @Optional() @Inject(ROUTE_NOT_FOUND_TOKEN) notFound: boolean | null,
  ) {
    // Not-found path: set flag so shell can render 404 component
    if (notFound) {
      this._isNotFound.set(true);
      return;
    }

    // SSR path: server-injected config (set by Express server via providers[]).
    // Also used in tests that provide the token directly (browser context with DI override).
    if (serverConfig) {
      if (isPlatformServer(this.platformId)) {
        // Store for the browser hydration pass
        this.transferState.set(TENANT_CONFIG_STATE_KEY, serverConfig);
      }
      this._config.set(serverConfig);
      this.injectThemeBrowser(serverConfig);
      return;
    }

    // Browser: read from TransferState (populated by the SSR pass)
    if (this.transferState.hasKey(NOT_FOUND_STATE_KEY)) {
      this.transferState.remove(NOT_FOUND_STATE_KEY);
      this._isNotFound.set(true);
      return;
    }

    if (this.transferState.hasKey(TENANT_CONFIG_STATE_KEY)) {
      const stored = this.transferState.get(TENANT_CONFIG_STATE_KEY, null);
      this.transferState.remove(TENANT_CONFIG_STATE_KEY);
      if (stored) {
        this._config.set(stored);
        this.injectThemeBrowser(stored);
        return;
      }
    }

    // Fallback: fetch from API (should not happen in normal SSR flow; handles
    // pure client-side development without a running SSR server)
    this.fetchCurrentTenant().subscribe();
  }

  private fetchCurrentTenant(): Observable<TenantConfig> {
    return this.http
      .get<ApiTenantConfigResponse>(`${this.apiBase}/storefront/config`)
      .pipe(
        map(mapApiTenantConfig),
        catchError(() => of(DEFAULT_DEV_TENANT)),
        tap((config) => {
          this._config.set(config);
          this.injectThemeBrowser(config);
        }),
      );
  }

  private injectThemeBrowser(config: TenantConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const css = buildTenantThemeCSS(config.theme);
    let el = this.doc.getElementById('tenant-theme') as HTMLStyleElement | null;
    if (!el) {
      el = this.doc.createElement('style');
      el.id = 'tenant-theme';
      this.doc.head.insertBefore(el, this.doc.head.firstChild);
    }
    el.textContent = css;
  }
}
