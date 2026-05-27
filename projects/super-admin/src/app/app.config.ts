import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { errorInterceptor, provideApiBaseUrl } from '@shared/api';
import { superAdminAuthInterceptor } from './core/interceptors/super-admin-auth.interceptor';
import { provideI18n } from '@shared/i18n';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([superAdminAuthInterceptor, errorInterceptor])),
    provideApiBaseUrl(environment.apiBaseUrl),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
    ),
    provideI18n({ defaultLang: 'en', supportedLangs: ['en', 'ar'] }),
  ],
};
