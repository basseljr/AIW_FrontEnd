import { bootstrapApplication } from '@angular/platform-browser';
import { provideClientHydration } from '@angular/platform-browser';
import { mergeApplicationConfig } from '@angular/core';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * Browser-only config: merges the shared appConfig with hydration support.
 * provideClientHydration() is kept here (not in the shared appConfig) so it
 * never gets included in the server-side render context, where accessing
 * the global `document` directly would throw NG0210.
 */
const browserConfig = mergeApplicationConfig(appConfig, {
  providers: [provideClientHydration()],
});

bootstrapApplication(AppComponent, browserConfig).catch((err) => console.error(err));
