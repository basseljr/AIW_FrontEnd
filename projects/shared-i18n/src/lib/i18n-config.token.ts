import { InjectionToken } from '@angular/core';

export type SupportedLang = 'en' | 'ar';

export interface I18nConfig {
  defaultLang: SupportedLang;
  supportedLangs: readonly SupportedLang[];
  cookieName?: string;
  cookieMaxAgeDays?: number;
}

export const I18N_CONFIG = new InjectionToken<I18nConfig>('I18N_CONFIG');

export const DEFAULT_I18N_CONFIG: Required<I18nConfig> = {
  defaultLang: 'en',
  supportedLangs: ['en', 'ar'],
  cookieName: 'lang',
  cookieMaxAgeDays: 365,
};
