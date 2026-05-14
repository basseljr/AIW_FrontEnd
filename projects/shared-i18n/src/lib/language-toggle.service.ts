import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  DEFAULT_I18N_CONFIG,
  I18N_CONFIG,
  I18nConfig,
  SupportedLang,
} from './i18n-config.token';
import { readLangCookie, writeLangCookie } from './lang-cookie';

/**
 * Single source of truth for the active language.
 *
 * Responsibilities (per PRD §29):
 *   - Track the active language (`en` | `ar`) in a signal so components can
 *     reactively bind to it without subscribing to RxJS.
 *   - Push the active language through ngx-translate so all `{{ 'x' | translate }}`
 *     bindings re-render automatically.
 *   - Set `<html dir>` to `rtl` for Arabic, `ltr` for English. This is the
 *     single toggle that activates CSS logical-property mirroring everywhere
 *     in the app — no per-component RTL CSS required.
 *   - Set `<html lang>` so assistive tech and the browser pick up the change.
 *   - Persist the user's choice in a long-lived cookie so returning visitors
 *     get their preferred language without a flash of the default.
 *   - On boot, restore the cookie value (or honor a server-supplied URL prefix
 *     where present in storefront contexts).
 *
 * The service is a no-op for unsupported languages — passing 'fr' is silently
 * coerced to the configured default. This matches the LanguageGuard pattern
 * from PRD §29 where unknown lang segments redirect to the default.
 */
@Injectable({ providedIn: 'root' })
export class LanguageToggleService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private readonly config: Required<I18nConfig> = {
    ...DEFAULT_I18N_CONFIG,
    ...inject(I18N_CONFIG, { optional: true }),
  };

  private readonly _current = signal<SupportedLang>(this.config.defaultLang);

  /** Active language as a signal — components bind to this for reactivity. */
  readonly current = this._current.asReadonly();

  /** True when the active language is right-to-left. */
  readonly isRtl = computed(() => this._current() === 'ar');

  /** List of supported languages — exposed for language-picker UIs. */
  readonly supported: readonly SupportedLang[] = this.config.supportedLangs;

  /**
   * Initialize the active language. Call once during bootstrap (the
   * `provideI18n` provider sets this up via an APP_INITIALIZER so application
   * code does not need to remember it).
   *
   * Priority: explicit `preferred` argument → cookie → config default.
   */
  initialize(preferred?: SupportedLang | null): void {
    const cookieLang = readLangCookie(this.config.cookieName);
    const candidate = preferred ?? cookieLang ?? this.config.defaultLang;
    this.set(candidate);
  }

  /**
   * Switch to the given language. Idempotent — calling with the active
   * language is a no-op (cookie still refreshed so its TTL slides forward).
   */
  set(lang: SupportedLang): void {
    const resolved = this.config.supportedLangs.includes(lang) ? lang : this.config.defaultLang;

    this._current.set(resolved);
    this.translate.use(resolved);

    const html = this.document.documentElement;
    html.setAttribute('dir', resolved === 'ar' ? 'rtl' : 'ltr');
    html.setAttribute('lang', resolved);

    writeLangCookie(this.config.cookieName, resolved, this.config.cookieMaxAgeDays);
  }

  /** Flip between en and ar. Convenience for the header toggle button. */
  toggle(): void {
    this.set(this._current() === 'en' ? 'ar' : 'en');
  }
}
