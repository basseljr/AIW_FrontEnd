import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { throwError } from 'rxjs';

import { provideRouter } from '@angular/router';
import { LanguageToggleService } from '@shared/i18n';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let loginSpy: jasmine.Spy;

  const mockAuthService = {
    isLoading: signal(false),
    login: jasmine.createSpy('login'),
  };

  beforeEach(async () => {
    mockAuthService.login = jasmine.createSpy('login');
    loginSpy = mockAuthService.login;

    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: CartService, useValue: { cartId: signal(null) } },
        {
          provide: LanguageToggleService,
          useValue: { current: signal('en'), isRtl: signal(false) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders email form on step 1', () => {
    expect(component.step()).toBe(1);
    const emailInput = fixture.debugElement.query(By.css('#login-email'));
    expect(emailInput).toBeTruthy();
  });

  it('renders password form on step 2 after email submit', () => {
    component.emailForm.controls.email.setValue('test@example.com');
    component.onEmailSubmit();
    fixture.detectChanges();
    expect(component.step()).toBe(2);
    const pwInput = fixture.debugElement.query(By.css('#login-password'));
    expect(pwInput).toBeTruthy();
  });

  it('shows error on invalid credentials (401)', () => {
    component.step.set(2);
    component.passwordForm.controls.password.setValue('secret');
    component.emailForm.controls.email.setValue('test@example.com');

    loginSpy.and.returnValue(throwError(() => ({ status: 401 })));

    component.onPasswordSubmit();
    fixture.detectChanges();

    expect(component.errorMsg()).toBe('auth.invalid_credentials');
  });
});
