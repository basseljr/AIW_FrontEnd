import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

import { TenantConfig } from '../models/tenant-config.model';

export interface PageMeta {
  titleEn: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

/**
 * Manages server-rendered SEO tags per PRD §10 and §09:
 *   - <title>
 *   - <meta name="description">
 *   - Open Graph: og:title, og:description, og:image, og:type
 *   - Twitter card tags
 *   - <link rel="canonical">
 *   - <link rel="alternate" hreflang="en|ar|x-default">
 *
 * Called from the shell component's ngOnInit (runs during SSR render)
 * so the SSR response already contains correct meta tags — no client-side
 * flicker after hydration.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  setPageMeta(pageMeta: PageMeta, tenant: TenantConfig, lang: 'en' | 'ar'): void {
    const isAr = lang === 'ar';
    const businessName = isAr ? tenant.branding.businessNameAr : tenant.branding.businessName;
    const pageTitle = isAr && pageMeta.titleAr ? pageMeta.titleAr : pageMeta.titleEn;
    const fullTitle = `${pageTitle} — ${businessName}`;
    const description = isAr && pageMeta.descriptionAr
      ? pageMeta.descriptionAr
      : (pageMeta.descriptionEn ?? tenant.seo.metaDescriptionEn ?? '');
    const ogImage = pageMeta.ogImage ?? tenant.seo.ogImageUrl ?? tenant.branding.coverPhotoUrl ?? '';

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: description });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    if (ogImage) {
      this.meta.updateTag({ property: 'og:image', content: ogImage });
    }

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    // hreflang + canonical
    const baseUrl = pageMeta.canonicalUrl ?? this.document.URL;
    this.setAlternateLinks(baseUrl, tenant.defaultLanguage);
  }

  private setAlternateLinks(currentUrl: string, defaultLang: string): void {
    // Remove existing alternate links to avoid duplicates on navigation
    this.document
      .querySelectorAll('link[rel="alternate"], link[rel="canonical"]')
      .forEach((el) => el.parentNode?.removeChild(el));

    const urlObj = this.tryParseUrl(currentUrl);
    if (!urlObj) return;

    const origin = urlObj.origin;
    // Get the path without the language prefix
    const pathWithoutLang = urlObj.pathname.replace(/^\/(en|ar)/, '') || '/';

    const enUrl = `${origin}/en${pathWithoutLang}`;
    const arUrl = `${origin}/ar${pathWithoutLang}`;
    const defaultUrl = `${origin}/${defaultLang}${pathWithoutLang}`;

    this.addLink('alternate', enUrl, 'en');
    this.addLink('alternate', arUrl, 'ar');
    this.addLink('alternate', defaultUrl, 'x-default');
    this.addLink('canonical', defaultUrl);
  }

  private addLink(rel: string, href: string, hreflang?: string): void {
    const link = this.document.createElement('link');
    link.setAttribute('rel', rel);
    link.setAttribute('href', href);
    if (hreflang) {
      link.setAttribute('hreflang', hreflang);
    }
    this.document.head.appendChild(link);
  }

  private tryParseUrl(url: string): URL | null {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }
}
