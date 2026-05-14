import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { ApplicationRef } from '@angular/core';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

/**
 * Server bootstrap function passed to `renderApplication`.
 *
 * CRITICAL: The `BootstrapContext` argument MUST be forwarded to
 * `bootstrapApplication` as the third parameter. Angular's `renderApplication`
 * passes the server-side platform injector (including the server-side DOCUMENT)
 * through this context. Without it, Angular falls back to the browser platform
 * which accesses the global `document` — causing NG0210 on the server.
 */
export const bootstrap = (context: BootstrapContext): Promise<ApplicationRef> =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;
