import { APP_INITIALIZER, EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';

import { I18N_CONFIG, I18nConfig } from './i18n-config.token';
import { LanguageToggleService } from './language-toggle.service';

/**
 * Wires the i18n config + an APP_INITIALIZER that calls
 * `LanguageToggleService.initialize()` before bootstrap completes. Result: the
 * `dir` attribute, the `lang` attribute, and ngx-translate's active language
 * are all set before any component renders, so the first paint already
 * reflects the user's preferred language.
 */
export function provideI18n(config: I18nConfig): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: I18N_CONFIG, useValue: config },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (service: LanguageToggleService) => () => service.initialize(),
      deps: [LanguageToggleService],
    },
  ];
  return makeEnvironmentProviders(providers);
}
