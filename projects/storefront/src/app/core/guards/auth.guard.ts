import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { LanguageToggleService } from '@shared/i18n';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (
  _route,
  state,
): Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const lang = inject(LanguageToggleService);

  return toObservable(auth.isInitialized).pipe(
    filter((initialized) => initialized),
    take(1),
    map(() => {
      if (auth.isAuthenticated()) return true;
      return router.createUrlTree(['/', lang.current(), 'login'], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};
