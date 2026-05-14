import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { LanguageToggleService } from '@shared/i18n';
import { TenantConfigService } from '../services/tenant-config.service';

/**
 * Validates the `:lang` segment of a URL is one of the supported values
 * ('en' | 'ar'). On an invalid or missing lang:
 *   - Tenant has a default language → redirects to /{defaultLang}/{rest}
 *   - No tenant config yet → redirects to /en/
 *
 * Also drives `LanguageToggleService.set()` so every navigation through a
 * language route updates the active language, `<html dir>`, and ngx-translate.
 */
export const languageGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
): boolean | UrlTree => {
  const router = inject(Router);
  const langToggle = inject(LanguageToggleService);
  const tenantConfig = inject(TenantConfigService);

  const lang = route.paramMap.get('lang');

  if (lang === 'en' || lang === 'ar') {
    langToggle.set(lang);
    return true;
  }

  // Invalid lang segment: redirect to tenant's default language
  const defaultLang = tenantConfig.config()?.defaultLanguage ?? 'en';
  const restOfPath = route.url.map((s) => s.path).join('/');
  const redirectPath = restOfPath
    ? `/${defaultLang}/${restOfPath}`
    : `/${defaultLang}/`;

  return router.createUrlTree([redirectPath]);
};
