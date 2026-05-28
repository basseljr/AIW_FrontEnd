import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Observable, of, throwError } from 'rxjs';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

import { StaffComponent } from './staff.component';
import { StaffService } from '../../core/services/staff.service';
import { StaffMember } from '../../core/models/staff.model';

// Minimal translate loader so templates render translation keys as-is
class FakeTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

const MOCK_STAFF: StaffMember[] = [
  {
    userId: 'aaaa-1111',
    fullName: 'Alice Owner',
    email: 'alice@example.com',
    roleKey: 'owner',
    isActive: true,
    lastLoginAt: '2026-05-01T10:00:00Z',
  },
  {
    userId: 'bbbb-2222',
    fullName: 'Bob Manager',
    email: 'bob@example.com',
    roleKey: 'manager',
    isActive: true,
    lastLoginAt: null,
  },
  {
    userId: 'cccc-3333',
    fullName: 'Carol Staff',
    email: 'carol@example.com',
    roleKey: 'staff',
    isActive: false,
    lastLoginAt: null,
  },
];

describe('StaffComponent', () => {
  let component: StaffComponent;
  let fixture: ComponentFixture<StaffComponent>;
  let staffServiceSpy: jasmine.SpyObj<StaffService>;

  beforeEach(async () => {
    staffServiceSpy = jasmine.createSpyObj<StaffService>('StaffService', [
      'getStaff',
      'inviteStaff',
      'updateStatus',
      'updateRole',
      'resetPassword',
    ]);
    staffServiceSpy.getStaff.and.returnValue(of(MOCK_STAFF));

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        StaffComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [{ provide: StaffService, useValue: staffServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render without error', () => {
    expect(component).toBeTruthy();
  });

  it('should load staff on init', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    expect(staffServiceSpy.getStaff).toHaveBeenCalledOnceWith();
    expect(component.staff().length).toBe(3);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeFalse();
  }));

  it('should set error state when getStaff fails', fakeAsync(() => {
    staffServiceSpy.getStaff.and.returnValue(throwError(() => new Error('network')));
    component.load();
    tick();
    expect(component.error()).toBeTrue();
    expect(component.loading()).toBeFalse();
  }));

  it('should show invite form when button clicked', () => {
    expect(component.showInviteForm()).toBeFalse();
    component.toggleInviteForm();
    fixture.detectChanges();
    expect(component.showInviteForm()).toBeTrue();
  });

  it('should hide invite form and reset on cancelInvite', () => {
    component.showInviteForm.set(true);
    component.inviteForm.fullName = 'Test';
    component.cancelInvite();
    expect(component.showInviteForm()).toBeFalse();
    expect(component.inviteForm.fullName).toBe('');
  });

  it('should call inviteStaff and add member on successful invite', fakeAsync(() => {
    const newMember: StaffMember = {
      userId: 'dddd-4444',
      fullName: 'Dave Driver',
      email: 'dave@example.com',
      roleKey: 'driver',
      isActive: true,
      lastLoginAt: null,
    };
    staffServiceSpy.inviteStaff.and.returnValue(of(newMember));

    component.showInviteForm.set(true);
    component.inviteForm = { fullName: 'Dave Driver', email: 'dave@example.com', password: 'secure123', roleKey: 'driver' };
    const submittedForm = { ...component.inviteForm };
    component.submitInvite();
    tick();

    expect(staffServiceSpy.inviteStaff).toHaveBeenCalledOnceWith(submittedForm);
    expect(component.staff().find((m) => m.userId === 'dddd-4444')).toBeTruthy();
    expect(component.showInviteForm()).toBeFalse();
    expect(component.inviting()).toBeFalse();
    tick(3001);
  }));

  it('should set errorMsg when inviteStaff fails', fakeAsync(() => {
    staffServiceSpy.inviteStaff.and.returnValue(throwError(() => ({ error: { message: 'Duplicate email' } })));
    component.inviteForm = { fullName: 'X', email: 'x@x.com', password: 'password1', roleKey: 'staff' };
    component.submitInvite();
    tick();
    expect(component.errorMsg()).toBe('Duplicate email');
  }));

  it('should not deactivate owner — sets errorMsg', () => {
    const owner = MOCK_STAFF[0];
    expect(owner.roleKey).toBe('owner');
    component.toggleStatus(owner);
    expect(staffServiceSpy.updateStatus).not.toHaveBeenCalled();
    expect(component.errorMsg()).toBeTruthy();
  });

  it('should call updateStatus for non-owner member', fakeAsync(() => {
    staffServiceSpy.updateStatus.and.returnValue(of(undefined));
    const manager = MOCK_STAFF[1];
    component.toggleStatus(manager);
    tick();
    expect(staffServiceSpy.updateStatus).toHaveBeenCalledOnceWith(manager.userId, false);
    const updated = component.staff().find((m) => m.userId === manager.userId);
    expect(updated?.isActive).toBeFalse();
    tick(3001);
  }));

  it('should reactivate inactive member via toggleStatus', fakeAsync(() => {
    staffServiceSpy.updateStatus.and.returnValue(of(undefined));
    const inactive = MOCK_STAFF[2];
    expect(inactive.isActive).toBeFalse();
    component.toggleStatus(inactive);
    tick();
    expect(staffServiceSpy.updateStatus).toHaveBeenCalledOnceWith(inactive.userId, true);
    const updated = component.staff().find((m) => m.userId === inactive.userId);
    expect(updated?.isActive).toBeTrue();
    tick(3001);
  }));

  it('should call resetPassword and show success message', fakeAsync(() => {
    staffServiceSpy.resetPassword.and.returnValue(of(undefined));
    const manager = MOCK_STAFF[1];
    component.sendPasswordReset(manager);
    tick();
    expect(staffServiceSpy.resetPassword).toHaveBeenCalledOnceWith(manager.userId);
    expect(component.successMsg()).toBe('staff_page.reset_password_sent');
    tick(3001);
  }));

  it('should clear successMsg after 3 seconds', fakeAsync(() => {
    staffServiceSpy.resetPassword.and.returnValue(of(undefined));
    component.sendPasswordReset(MOCK_STAFF[1]);
    tick(2999);
    expect(component.successMsg()).toBeTruthy();
    tick(1);
    expect(component.successMsg()).toBe('');
  }));

  it('should format lastLoginAt as readable date', () => {
    const result = component.formatLogin('2026-05-01T10:00:00Z');
    expect(typeof result).toBe('string');
    expect(result).not.toBe('—');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return em-dash for null lastLoginAt', () => {
    expect(component.formatLogin(null)).toBe('—');
  });

  it('should compute initials from full name', () => {
    expect(component.initials('Alice Owner')).toBe('AO');
    expect(component.initials('Bob')).toBe('B');
  });
});
