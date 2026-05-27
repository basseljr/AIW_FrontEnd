import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { superAdminAuthGuard } from './super-admin-auth.guard';
import { SuperAdminAuthService } from '../services/super-admin-auth.service';

describe('superAdminAuthGuard', () => {
  let mockAuth: jasmine.SpyObj<SuperAdminAuthService> & {
    isAuthenticated: () => boolean;
  };
  let router: jasmine.SpyObj<Router>;

  function setup(authenticated: boolean, timedOut = false) {
    const isAuth = signal(authenticated);
    mockAuth = jasmine.createSpyObj(
      'SuperAdminAuthService',
      ['enforceInactivityTimeout'],
      { isAuthenticated: () => isAuth() },
    ) as never;
    mockAuth.enforceInactivityTimeout.and.returnValue(timedOut);

    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue('LOGIN_TREE' as never);

    TestBed.configureTestingModule({
      providers: [
        { provide: SuperAdminAuthService, useValue: mockAuth },
        { provide: Router, useValue: router },
      ],
    });
  }

  it('redirects unauthenticated users to /login', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(() => superAdminAuthGuard({} as never, {} as never));
    expect(result).toBe('LOGIN_TREE' as never);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('redirects timed-out sessions to /login', () => {
    setup(true, true);
    const result = TestBed.runInInjectionContext(() => superAdminAuthGuard({} as never, {} as never));
    expect(result).toBe('LOGIN_TREE' as never);
  });

  it('allows authenticated and active sessions through', () => {
    setup(true, false);
    const result = TestBed.runInInjectionContext(() => superAdminAuthGuard({} as never, {} as never));
    expect(result).toBe(true);
  });
});
