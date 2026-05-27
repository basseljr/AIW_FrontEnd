import { Observable, of } from 'rxjs';
import { TranslateLoader } from '@ngx-translate/core';

/**
 * Minimal TranslateLoader that returns empty translation tables. Tests don't
 * exercise translation rendering — the loader just needs to resolve.
 */
export class TestTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}
