/**
 * Tiny cookie helpers — `document.cookie` parsing isolated here so the
 * language-toggle service stays focused on language state rather than string
 * juggling. Returns null when running in a non-browser context (SSR) so the
 * caller can fall back to the configured default.
 */
import { SupportedLang } from './i18n-config.token';

export function readLangCookie(cookieName: string): SupportedLang | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${cookieName}=`));
  if (!match) {
    return null;
  }
  const value = match.slice(cookieName.length + 1);
  if (value === 'en' || value === 'ar') {
    return value;
  }
  return null;
}

export function writeLangCookie(cookieName: string, lang: SupportedLang, maxAgeDays: number): void {
  if (typeof document === 'undefined') {
    return;
  }
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${cookieName}=${lang}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}
