import { InjectionToken } from '@angular/core';
import { TenantConfig } from '../models/tenant-config.model';

/**
 * Carries the resolved tenant configuration from the Express server into the
 * Angular render. The server resolves the tenant (via Host header → API call)
 * BEFORE `engine.render()` fires, then passes the result as a provider here.
 * Angular injects it via `@Optional() @Inject(TENANT_CONFIG_TOKEN)`.
 *
 * On the client, this token is never set — the TenantConfigService reads
 * from TransferState instead, which was populated during SSR.
 */
export const TENANT_CONFIG_TOKEN = new InjectionToken<TenantConfig>('TENANT_CONFIG');

/** Language extracted from the URL path (/en/ or /ar/) by the Express server. */
export const REQUEST_LANG_TOKEN = new InjectionToken<'en' | 'ar'>('REQUEST_LANG');

/** Set to true when the domain was not resolved (rendering the 404 page). */
export const ROUTE_NOT_FOUND_TOKEN = new InjectionToken<boolean>('ROUTE_NOT_FOUND');
