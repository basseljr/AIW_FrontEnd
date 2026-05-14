import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';

import { appConfig } from './app.config';
import { provideApiBaseUrl } from '@shared/api';
import { environmentServer } from '../environments/environment.server';

/**
 * SSR-only interceptor: injects the dev tenant Host header so that
 * TenantResolutionMiddleware can resolve the correct tenant when Angular
 * SSR calls the API directly (absolute URL, no dev-server proxy).
 * In production SSR, Express resolves the tenant before rendering so
 * this interceptor is never exercised.
 */
const ssrTenantHostInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { Host: environmentServer.ssrTenantHost } }));

/**
 * Server-only Angular config.
 *
 * SSR DOM mutations (dir/lang on <html>, tenant theme CSS vars, TransferState)
 * are performed by the Express server in `server.ts` via post-processing of
 * the rendered HTML string. This avoids NG0200 / NG0210 errors that occur when
 * `DOCUMENT` or `TransferState` are accessed during `APP_INITIALIZER` phase
 * before Angular's server-side document context is fully wired up.
 *
 * Tenant config and TransferState are managed entirely by TenantConfigService
 * using the TENANT_CONFIG_TOKEN injection (provided per-request by the Express
 * server via `engine.render({ providers: [...] })`).
 */
const serverConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideServerRendering(),
    // Override browser relative URL with absolute URL for direct Node.js HTTP calls
    provideApiBaseUrl(environmentServer.apiBaseUrl),
    // Add SSR interceptors on top of the browser ones (withInterceptors is multi:true)
    provideHttpClient(withFetch(), withInterceptors([ssrTenantHostInterceptor])),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
