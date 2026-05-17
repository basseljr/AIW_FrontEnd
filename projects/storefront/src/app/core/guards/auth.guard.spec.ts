import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { LanguageToggleService } from '@shared/i18n';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function makeState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('authGuard', () => {
  function setup(isAuthenticated: boolean) {
    const mockAuthService = {
      isInitialized: signal(true),
      isAuthenticated: signal(isAuthenticated),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: LanguageToggleService,
          useValue: { current: signal('en'), isRtl: signal(false) },
        },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    return { router: TestBed.inject(Router), authService: mockAuthService };
  }

  it('allows navigation when authenticated', fakeAsync(() => {
    setup(true);

    let result: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => {
      const obs = authGuard({} as ActivatedRouteSnapshot, makeState('/en/account')) as any;
      obs.subscribe((v: boolean | UrlTree) => { result = v; });
    });

    tick();
    expect(result).toBeTrue();
  }));

  it('redirects to /login when not authenticated', fakeAsync(() => {
    const { router } = setup(false);
    const spy = spyOn(router, 'createUrlTree').and.returnValue(new UrlTree());

    let result: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => {
      const obs = authGuard({} as ActivatedRouteSnapshot, makeState('/en/account')) as any;
      obs.subscribe((v: boolean | UrlTree) => { result = v; });
    });

    tick();
    expect(result).toBeInstanceOf(UrlTree);
    expect(spy).toHaveBeenCalledWith(
      ['/', 'en', 'login'],
      jasmine.objectContaining({ queryParams: { returnUrl: '/en/account' } }),
    );
  }));
});
