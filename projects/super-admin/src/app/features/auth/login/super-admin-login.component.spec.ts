import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { SuperAdminLoginComponent } from './super-admin-login.component';
import { SuperAdminAuthService } from '../../../core/services/super-admin-auth.service';
import { TestTranslateLoader } from '../../../testing/test-translate-loader';

describe('SuperAdminLoginComponent', () => {
  let auth: jasmine.SpyObj<SuperAdminAuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    sessionStorage.clear();
    auth = jasmine.createSpyObj('SuperAdminAuthService', [
      'loginWithCredentials',
      'verifyMfa',
      'isAuthenticated',
    ]);
    auth.isAuthenticated.and.returnValue(false);

    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [
        SuperAdminLoginComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: SuperAdminAuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(SuperAdminLoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('redirects to root if already authenticated', () => {
    auth.isAuthenticated.and.returnValue(true);
    const fixture = TestBed.createComponent(SuperAdminLoginComponent);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('does not submit credentials when fields are empty', () => {
    const fixture = TestBed.createComponent(SuperAdminLoginComponent);
    fixture.detectChanges();
    fixture.componentInstance.submitCredentials();
    expect(auth.loginWithCredentials).not.toHaveBeenCalled();
    expect(fixture.componentInstance.submitted()).toBe(true);
  });

  it('moves to MFA step when API requires it', () => {
    auth.loginWithCredentials.and.returnValue(
      of({ mfaRequired: true, mfaChallengeToken: 'tok', session: null }),
    );
    const fixture = TestBed.createComponent(SuperAdminLoginComponent);
    const cmp = fixture.componentInstance;
    cmp.email.set('a@b.com');
    cmp.password.set('secret');
    cmp.submitCredentials();
    expect(cmp.step()).toBe('mfa');
  });

  it('routes home when MFA bypass returns a session', () => {
    auth.loginWithCredentials.and.returnValue(
      of({
        mfaRequired: false,
        mfaChallengeToken: null,
        session: {
          user: { userId: 'u', email: 'a@b.com', name: '', role: 'super_admin', mfaEnabled: true },
          accessToken: 't',
          accessTokenExpiresAt: '2026-12-31T00:00:00Z',
        },
      }),
    );
    const fixture = TestBed.createComponent(SuperAdminLoginComponent);
    const cmp = fixture.componentInstance;
    cmp.email.set('a@b.com');
    cmp.password.set('secret');
    cmp.submitCredentials();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('rejects malformed MFA codes', () => {
    const fixture = TestBed.createComponent(SuperAdminLoginComponent);
    const cmp = fixture.componentInstance;
    cmp.step.set('mfa');
    cmp.mfaCode.set('abc');
    cmp.submitMfa();
    expect(auth.verifyMfa).not.toHaveBeenCalled();
    expect(cmp.errorKey()).toBe('auth.login.mfa_invalid_format');
  });

  it('back button returns to credentials step', () => {
    const fixture = TestBed.createComponent(SuperAdminLoginComponent);
    const cmp = fixture.componentInstance;
    cmp.step.set('mfa');
    cmp.mfaCode.set('123456');
    cmp.errorKey.set('auth.login.mfa_invalid');
    cmp.backToCredentials();
    expect(cmp.step()).toBe('credentials');
    expect(cmp.mfaCode()).toBe('');
    expect(cmp.errorKey()).toBeNull();
  });
});
