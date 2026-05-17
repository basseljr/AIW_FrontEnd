import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { throwError } from 'rxjs';

import { LanguageToggleService } from '@shared/i18n';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let registerSpy: jasmine.Spy;

  const mockAuthService = {
    isLoading: signal(false),
    register: jasmine.createSpy('register'),
  };

  beforeEach(async () => {
    mockAuthService.register = jasmine.createSpy('register');
    registerSpy = mockAuthService.register;

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: CartService, useValue: { cartId: signal(null) } },
        {
          provide: LanguageToggleService,
          useValue: { current: signal('en'), isRtl: signal(false) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders registration form', () => {
    expect(fixture.debugElement.query(By.css('#reg-fullname'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#reg-email'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#reg-password'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('#reg-confirm'))).toBeTruthy();
  });

  it('shows password strength indicator when password is entered', () => {
    component.form.controls.password.setValue('Password1!');
    fixture.detectChanges();
    const strengthBars = fixture.debugElement.queryAll(
      By.css('.reg-page__strength-bar'),
    );
    expect(strengthBars.length).toBeGreaterThan(0);
  });

  it('shows error when email already exists (409)', () => {
    component.form.setValue({
      fullName: 'Alice Smith',
      email: 'taken@example.com',
      phone: '',
      password: 'Password1!',
      confirmPassword: 'Password1!',
    });

    registerSpy.and.returnValue(throwError(() => ({ status: 409 })));

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMsg()).toBe('auth.email_already_exists');
  });
});
