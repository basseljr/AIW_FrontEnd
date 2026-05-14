import { APP_BASE_HREF } from '@angular/common';
import { renderApplication } from '@angular/platform-server';
import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

import bootstrap from './src/main.server';
import {
  TENANT_CONFIG_TOKEN,
  REQUEST_LANG_TOKEN,
  ROUTE_NOT_FOUND_TOKEN,
} from './src/app/core/tokens/tenant-config.token';
import {
  TenantConfig,
  DEFAULT_DEV_TENANT,
  buildTenantThemeCSS,
  ApiTenantConfigResponse,
  mapApiTenantConfig,
} from './src/app/core/models/tenant-config.model';

const isDev = process.env['NODE_ENV'] !== 'production';
const API_BASE_URL = process.env['API_BASE_URL'] ?? 'https://localhost:7201/api/v1';
const PORT = parseInt(process.env['PORT'] ?? '4000', 10);

// ---------------------------------------------------------------------------
// Tenant resolution
// ---------------------------------------------------------------------------

interface ApiEnvelope<T> {
  data: T;
}

async function resolveTenant(host: string): Promise<TenantConfig | null> {
  const cleanHost = host.split(':')[0];
  try {
    const url = `${API_BASE_URL}/storefront/config`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', Host: cleanHost },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiTenantConfigResponse;
    return mapApiTenantConfig(json);
  } catch {
    if (isDev) return { ...DEFAULT_DEV_TENANT, primaryDomain: cleanHost };
    return null;
  }
}

function extractLangFromUrl(url: string): 'en' | 'ar' | null {
  const match = /^\/([a-z]{2})(\/|$)/.exec(url);
  if (!match) return null;
  const l = match[1];
  return l === 'en' || l === 'ar' ? l : null;
}

// ---------------------------------------------------------------------------
// HTML post-processing (keeps Angular DI clean — no DOCUMENT access in DI)
// ---------------------------------------------------------------------------

function injectTenantTheme(html: string, tenantConfig: TenantConfig): string {
  const css = buildTenantThemeCSS(tenantConfig.theme);
  const tag = `<style id="tenant-theme" data-tenant-id="${tenantConfig.tenantId}">\n${css}\n</style>`;
  return html.replace('<head>', `<head>\n${tag}`);
}

function injectLangDir(html: string, lang: 'en' | 'ar'): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return html.replace(/<html([^>]*)>/i, (_m, attrs: string) => {
    const a = attrs
      .replace(/\blang="[^"]*"/g, `lang="${lang}"`)
      .replace(/\bdir="[^"]*"/g, `dir="${dir}"`);
    const withLang = a.includes('lang=') ? a : `${a} lang="${lang}"`;
    const withDir = withLang.includes('dir=') ? withLang : `${withLang} dir="${dir}"`;
    return `<html${withDir}>`;
  });
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');

  // Read the server document once at startup
  const serverHtmlPath = join(serverDistFolder, 'index.server.html');
  const browserHtmlPath = join(browserDistFolder, 'index.csr.html');
  const fallbackHtmlPath = join(browserDistFolder, 'index.html');

  const documentPath = existsSync(serverHtmlPath)
    ? serverHtmlPath
    : existsSync(browserHtmlPath)
      ? browserHtmlPath
      : fallbackHtmlPath;

  const document = readFileSync(documentPath, 'utf8');

  server.use(compression());
  server.use('/assets', express.static(join(browserDistFolder, 'assets'), { maxAge: '7d' }));
  server.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );

  server.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /checkout/\nDisallow: /account/\n');
  });

  // ---------------------------------------------------------------------------
  // SSR route
  // ---------------------------------------------------------------------------
  server.get('**', async (req: Request, res: Response, next: NextFunction) => {
    const host = req.headers.host ?? 'localhost';

    try {
      const tenantConfig = await resolveTenant(host);

      // Domain not found → 404
      if (!tenantConfig) {
        const rawHtml = await renderApplication(bootstrap, {
          document,
          url: `${req.protocol}://${host}/404`,
          platformProviders: [
            { provide: APP_BASE_HREF, useValue: '/' },
            { provide: ROUTE_NOT_FOUND_TOKEN, useValue: true },
          ],
        });
        return res.status(404).send(injectLangDir(rawHtml, 'en'));
      }

      // Suspended tenant → maintenance
      if (tenantConfig.status === 'suspended') {
        const lang = tenantConfig.defaultLanguage;
        const rawHtml = await renderApplication(bootstrap, {
          document,
          url: `${req.protocol}://${host}/${lang}/maintenance`,
          platformProviders: [
            { provide: APP_BASE_HREF, useValue: '/' },
            { provide: TENANT_CONFIG_TOKEN, useValue: tenantConfig },
            { provide: REQUEST_LANG_TOKEN, useValue: lang },
          ],
        });
        const themed = injectTenantTheme(rawHtml, tenantConfig);
        return res.status(503).send(injectLangDir(themed, lang));
      }

      // Root redirect
      if (req.path === '/') {
        return res.redirect(302, `/${tenantConfig.defaultLanguage}/`);
      }

      const lang = extractLangFromUrl(req.originalUrl) ?? tenantConfig.defaultLanguage;

      const rawHtml = await renderApplication(bootstrap, {
        document,
        url: `${req.protocol}://${host}${req.originalUrl}`,
        platformProviders: [
          { provide: APP_BASE_HREF, useValue: '/' },
          { provide: TENANT_CONFIG_TOKEN, useValue: tenantConfig },
          { provide: REQUEST_LANG_TOKEN, useValue: lang },
        ],
      });

      const themed = injectTenantTheme(rawHtml, tenantConfig);
      const final = injectLangDir(themed, lang);
      res.send(final);
    } catch (err) {
      next(err);
    }
  });

  server.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[SSR Error]', err);
    res.status(500).send('Internal Server Error');
  });

  return server;
}

function run(): void {
  app().listen(PORT, () => {
    console.log(`Storefront SSR listening on http://localhost:${PORT}`);
  });
}

run();
