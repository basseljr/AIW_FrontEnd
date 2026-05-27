import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '@shared/api';
import { SuperAdminAuthService, SESSION_INACTIVITY_MS } from './super-admin-auth.service';

describe('SuperAdminAuthService', () => {
  let service: SuperAdminAuthService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test-api';

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(SuperAdminAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.getToken()).toBe('');
  });

  it('loginWithCredentials() returns MFA challenge when required', (done) => {
    service.loginWithCredentials({ email: 'a@b.com', password: 'p' }).subscribe((res) => {
      expect(res.mfaRequired).toBe(true);
      expect(res.mfaChallengeToken).toBe('challenge-1');
      expect(service.isAuthenticated()).toBe(false);
      done();
    });
    const req = httpMock.expectOne(`${BASE}/admin/auth/login`);
    expect(req.request.body.email).toBe('a@b.com');
    expect(req.request.body.deviceId).toBeTruthy();
    req.flush({ mfaRequired: true, mfaChallengeToken: 'challenge-1', session: null });
  });

  it('loginWithCredentials() applies session when MFA is bypassed', (done) => {
    service.loginWithCredentials({ email: 'a@b.com', password: 'p' }).subscribe(() => {
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.email).toBe('a@b.com');
      expect(service.getToken()).toBe('access-1');
      done();
    });
    const req = httpMock.expectOne(`${BASE}/admin/auth/login`);
    req.flush({
      mfaRequired: false,
      mfaChallengeToken: null,
      session: {
        user: {
          userId: 'u-1',
          email: 'a@b.com',
          name: 'Alice',
          role: 'super_admin',
          mfaEnabled: true,
        },
        accessToken: 'access-1',
        accessTokenExpiresAt: '2026-12-31T00:00:00Z',
      },
    });
  });

  it('verifyMfa() applies the session and hydrates state', (done) => {
    service.verifyMfa({ mfaChallengeToken: 'challenge-1', code: '123456' }).subscribe(() => {
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getToken()).toBe('access-2');
      done();
    });
    const req = httpMock.expectOne(`${BASE}/admin/auth/login/mfa`);
    expect(req.request.body.code).toBe('123456');
    req.flush({
      user: {
        userId: 'u-1', email: 'a@b.com', name: 'Alice',
        role: 'super_admin', mfaEnabled: true,
      },
      accessToken: 'access-2',
      accessTokenExpiresAt: '2026-12-31T00:00:00Z',
    });
  });

  it('persists user and token to sessionStorage on session apply', (done) => {
    service.verifyMfa({ mfaChallengeToken: 'c', code: '123456' }).subscribe(() => {
      expect(sessionStorage.getItem('sa_user')).toContain('a@b.com');
      expect(sessionStorage.getItem('sa_access_token')).toBe('tok');
      done();
    });
    httpMock.expectOne(`${BASE}/admin/auth/login/mfa`).flush({
      user: { userId: 'u-1', email: 'a@b.com', name: '', role: 'super_admin', mfaEnabled: true },
      accessToken: 'tok',
      accessTokenExpiresAt: '2026-12-31T00:00:00Z',
    });
  });

  it('enforceInactivityTimeout() clears session if expired', () => {
    sessionStorage.setItem(
      'sa_user',
      JSON.stringify({ userId: 'u', email: 'a@b.com', name: '', role: 'super_admin', mfaEnabled: true }),
    );
    sessionStorage.setItem('sa_access_token', 't');
    sessionStorage.setItem('sa_last_activity', (Date.now() - SESSION_INACTIVITY_MS - 1000).toString());

    // Re-inject to trigger hydration
    service = TestBed.inject(SuperAdminAuthService);
    const expired = service.enforceInactivityTimeout();
    expect(expired).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('recordActivity() writes a fresh timestamp', () => {
    service.recordActivity();
    expect(parseInt(sessionStorage.getItem('sa_last_activity') ?? '0', 10)).toBeGreaterThan(0);
  });

  it('updateToken() updates signal and sessionStorage', () => {
    service.updateToken('new-token');
    expect(service.getToken()).toBe('new-token');
    expect(sessionStorage.getItem('sa_access_token')).toBe('new-token');
  });

  it('creates a stable device id', () => {
    service.loginWithCredentials({ email: 'a@b.com', password: 'p' }).subscribe();
    const req1 = httpMock.expectOne(`${BASE}/admin/auth/login`);
    const id1 = req1.request.body.deviceId;
    req1.flush({ mfaRequired: false, mfaChallengeToken: null, session: null });

    service.loginWithCredentials({ email: 'a@b.com', password: 'p' }).subscribe();
    const req2 = httpMock.expectOne(`${BASE}/admin/auth/login`);
    expect(req2.request.body.deviceId).toBe(id1);
    req2.flush({ mfaRequired: false, mfaChallengeToken: null, session: null });
  });
});
