import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PLATFORM_ID, signal } from '@angular/core';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

import { LanguageToggleService } from '@shared/i18n';
import { API_BASE_URL } from '@shared/api';
import { ForgotPasswordComponent } from './forgot-password.component';
import type { SupportedLang } from '@shared/i18n';

const BASE = 'http://test-api';

function buildFixture() {
  TestBed.configureTestingModule({
    imports: [ForgotPasswordComponent, TranslateModule.forRoot(), HttpClientTestingModule],
    providers: [
      provideRouter([]),
      { provide: API_BASE_URL, useValue: BASE },
      // Use server platform to suppress AuthService constructor's loadProfile() and
      // CartService auto-init — prevents leftover open requests in httpMock.verify()
      { provide: PLATFORM_ID, useValue: 'server' },
      {
        provide: LanguageToggleService,
        useValue: { current: signal<SupportedLang>('en').asReadonly(), isRtl: signal(false).asReadonly() },
      },
    ],
  });

  const fixture = TestBed.createComponent(ForgotPasswordComponent);
  const httpMock = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  return { fixture, httpMock, component: fixture.componentInstance };
}

describe('ForgotPasswordComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders email form in initial state', () => {
    const { fixture } = buildFixture();
    const input = fixture.debugElement.query(By.css('#fp-email'));
    expect(input).toBeTruthy();
    expect(fixture.componentInstance.sent()).toBeFalse();
  });

  it('submit() does nothing when form is invalid', () => {
    const { component } = buildFixture();
    component.submit();
    expect(component.submitting()).toBeFalse();
    expect(component.sent()).toBeFalse();
  });

  it('submit() marks form touched and shows field error on empty submit', () => {
    const { fixture, component } = buildFixture();
    component.submit();
    fixture.detectChanges();
    expect(component.form.controls['email'].touched).toBeTrue();
    const err = fixture.debugElement.query(By.css('.fp-page__field-error'));
    expect(err).toBeTruthy();
  });

  it('submit() POSTs to /auth/forgot-password and shows success state', fakeAsync(() => {
    const { fixture, component, httpMock } = buildFixture();

    component.form.controls['email'].setValue('user@example.com');
    component.submit();
    fixture.detectChanges();

    expect(component.submitting()).toBeTrue();

    const req = httpMock.expectOne(`${BASE}/storefront/auth/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(jasmine.objectContaining({ email: 'user@example.com' }));
    req.flush({});

    tick();
    fixture.detectChanges();

    expect(component.sent()).toBeTrue();
    expect(component.submitting()).toBeFalse();
    const successIcon = fixture.debugElement.query(By.css('.fp-page__success'));
    expect(successIcon).toBeTruthy();

    httpMock.verify();
  }));

  it('shows success state even on HTTP error (security: no user enumeration)', fakeAsync(() => {
    const { fixture, component, httpMock } = buildFixture();

    component.form.controls['email'].setValue('nobody@example.com');
    component.submit();

    const req = httpMock.expectOne(`${BASE}/storefront/auth/forgot-password`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    tick();
    fixture.detectChanges();

    expect(component.sent()).toBeTrue();
    expect(component.submitting()).toBeFalse();

    httpMock.verify();
  }));
});
