import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { UsersComponent } from './users.component';
import { SuperAdminUserRow } from '../../core/models/super-admin-api.models';
import { TestTranslateLoader } from '../../testing/test-translate-loader';

const mkUser = (o: Partial<SuperAdminUserRow> = {}): SuperAdminUserRow => ({
  id: 'u-1',
  name: 'Alice',
  email: 'a@b.com',
  role: 'support_agent',
  mfaEnabled: true,
  lastLoginAt: '2026-05-20T10:00:00Z',
  status: 'active',
  createdAt: '2026-01-01T10:00:00Z',
  ...o,
});

describe('UsersComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UsersComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [{ provide: API_BASE_URL, useValue: '/api/v1' }],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads users on init', () => {
    const fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/users').flush([mkUser()]);
    expect(fixture.componentInstance.users().length).toBe(1);
  });

  it('opens edit clones the user', () => {
    const fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/users').flush([]);
    const u = mkUser({ id: 'u-2', name: 'Bob' });
    fixture.componentInstance.openEdit(u);
    expect(fixture.componentInstance.editingUser()).not.toBe(u);
    expect(fixture.componentInstance.editingUser()?.name).toBe('Bob');
  });

  it('updateEditing mutates the editing copy', () => {
    const fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/users').flush([]);
    fixture.componentInstance.openEdit(mkUser());
    fixture.componentInstance.updateEditing('name', 'Renamed');
    expect(fixture.componentInstance.editingUser()?.name).toBe('Renamed');
  });
});
