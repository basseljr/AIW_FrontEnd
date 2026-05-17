import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountOverviewComponent } from './account-overview.component';
import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';
import { CustomerProfile } from '../../../core/models/auth.model';

const MOCK_PROFILE: CustomerProfile = {
  id: 'u1',
  tenantId: 't1',
  fullName: 'Alice Smith',
  email: 'alice@example.com',
  phone: '+96512345678',
  phoneCountryCode: '+965',
  isEmailVerified: true,
  isActive: true,
  createdAt: '2025-01-15T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
  deletionRequestedAt: null,
};

describe('AccountOverviewComponent', () => {
  let fixture: ComponentFixture<AccountOverviewComponent>;
  let component: AccountOverviewComponent;

  beforeEach(async () => {
    const authService = {
      currentUser: signal<CustomerProfile | null>(MOCK_PROFILE),
      loadProfile: jasmine.createSpy('loadProfile').and.returnValue(of(MOCK_PROFILE)),
    };

    const accountService = {
      updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of(MOCK_PROFILE)),
    };

    await TestBed.configureTestingModule({
      imports: [AccountOverviewComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AccountService, useValue: accountService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows customer name and email', () => {
    const name = fixture.debugElement.query(By.css('.overview__name'));
    const email = fixture.debugElement.query(By.css('.overview__email'));
    expect(name.nativeElement.textContent).toContain('Alice Smith');
    expect(email.nativeElement.textContent).toContain('alice@example.com');
  });

  it('shows member since date', () => {
    const statsEl = fixture.debugElement.query(By.css('.overview__stats'));
    expect(statsEl.nativeElement.textContent).toContain('2025');
  });
});
