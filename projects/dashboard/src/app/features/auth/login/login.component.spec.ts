import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { ApiError } from '@shared/api';
import { DashboardAuthService } from '../../../core/services/dashboard-auth.service';
import { LoginComponent } from './login.component';

class MockLoader implements TranslateLoader {
  getTranslation() {
    return of({
      auth: {
        login: {
          title: 'Sign in',
          subtitle: 'Manage',
          tenant_id_label: 'Org ID',
          tenant_id_placeholder: 'Enter org ID',
          email_label: 'Email',
          email_placeholder: 'email@example.com',
          password_label: 'Password',
          password_placeholder: '••••',
          submit: 'Sign in',
          signing_in: 'Signing in...',
          invalid_credentials: 'Invalid credentials',
          account_locked: 'Account locked',
          generic_error: 'Error',
        },
      },
    });
  }
}

function buildFixture() {
  const mockUser = signal<{ userId: string; tenantId: string; role: 'owner'; email: string } | null>(null);
  const mockAuth = {
    currentUser: mockUser.asReadonly(),
    isAuthenticated: signal(false).asReadonly(),
    login: jasmine.createSpy('login').and.returnValue(of({
      userId: 'u1',
      tenantId: 't1',
      role: 'owner',
      accessTokenExpiresAt: '2026-06-01T00:00:00Z',
      cartId: null,
    })),
    logout: jasmine.createSpy('logout'),
  };

  TestBed.configureTestingModule({
    imports: [
      LoginComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      provideRouter([]),
      { provide: DashboardAuthService, useValue: mockAuth },
    ],
  });

  return { fixture: TestBed.createComponent(LoginComponent), mockAuth };
}

describe('LoginComponent', () => {
  beforeEach(() => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
  });

  it('renders form fields', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    const el = fixture.nativeElement;
    expect(el.querySelector('#tenantId')).toBeTruthy();
    expect(el.querySelector('#email')).toBeTruthy();
    expect(el.querySelector('#password')).toBeTruthy();
  });

  it('does not call login when fields are empty', () => {
    const { fixture, mockAuth } = buildFixture();
    fixture.detectChanges();

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(mockAuth.login).not.toHaveBeenCalled();
  });

  it('calls auth.login with correct payload', fakeAsync(() => {
    const { fixture, mockAuth } = buildFixture();
    fixture.detectChanges();

    fixture.componentInstance.form.set({ tenantId: 'abc', email: 'a@b.com', password: 'pass' });
    fixture.componentInstance.submit();
    tick();

    expect(mockAuth.login).toHaveBeenCalledWith({ tenantId: 'abc', email: 'a@b.com', password: 'pass' });
  }));

  it('shows invalid_credentials error on 401', fakeAsync(() => {
    const { fixture, mockAuth } = buildFixture();
    mockAuth.login.and.returnValue(
      throwError(() => new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Bad' })),
    );
    fixture.detectChanges();

    fixture.componentInstance.form.set({ tenantId: 'abc', email: 'a@b.com', password: 'pass' });
    fixture.componentInstance.submit();
    tick();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorKey()).toBe('auth.login.invalid_credentials');
  }));

  it('shows account_locked error on 423', fakeAsync(() => {
    const { fixture, mockAuth } = buildFixture();
    mockAuth.login.and.returnValue(
      throwError(() => new ApiError({ status: 423, code: 'LOCKED', message: 'Locked' })),
    );
    fixture.detectChanges();

    fixture.componentInstance.form.set({ tenantId: 'abc', email: 'a@b.com', password: 'pass' });
    fixture.componentInstance.submit();
    tick();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorKey()).toBe('auth.login.account_locked');
  }));

  it('disables submit button while loading', fakeAsync(() => {
    const { fixture, mockAuth } = buildFixture();
    let resolveLogin!: (v: unknown) => void;
    mockAuth.login.and.returnValue(
      new Observable((obs) => {
        resolveLogin = (v) => { obs.next(v); obs.complete(); };
      }),
    );
    fixture.detectChanges();

    fixture.componentInstance.form.set({ tenantId: 'abc', email: 'a@b.com', password: 'pass' });
    fixture.componentInstance.submit();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.db-login__submit');
    expect(btn.disabled).toBe(true);

    resolveLogin({});
    tick();
  }));
});
