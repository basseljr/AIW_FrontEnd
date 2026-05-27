import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { TenantsComponent } from './tenants.component';
import { TenantListItem } from '../../core/models/super-admin-api.models';
import { TestTranslateLoader } from '../../testing/test-translate-loader';

const makeTenant = (o: Partial<TenantListItem> = {}): TenantListItem => ({
  id: 't-1',
  slug: 'pizza',
  businessNameEn: 'Pizza Palace',
  businessNameAr: 'بيتزا بالاس',
  businessType: 'restaurant',
  status: 'active',
  planId: 'p-1',
  planName: 'Growth',
  gmvThisMonth: 5000,
  ordersThisMonth: 250,
  createdAt: '2026-01-01T10:00:00Z',
  lastActiveAt: '2026-05-22T10:00:00Z',
  country: 'Kuwait',
  ...o,
});

describe('TenantsComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TenantsComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(TenantsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/tenants').flush([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('filters by status', () => {
    const fixture = TestBed.createComponent(TenantsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/tenants').flush([
      makeTenant({ id: '1', status: 'active' }),
      makeTenant({ id: '2', status: 'suspended' }),
    ]);
    fixture.componentInstance.statusFilter.set('suspended');
    expect(fixture.componentInstance.filtered().length).toBe(1);
  });

  it('filters by business type', () => {
    const fixture = TestBed.createComponent(TenantsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/tenants').flush([
      makeTenant({ id: '1', businessType: 'restaurant' }),
      makeTenant({ id: '2', businessType: 'retail' }),
      makeTenant({ id: '3', businessType: 'restaurant' }),
    ]);
    fixture.componentInstance.typeFilter.set('restaurant');
    expect(fixture.componentInstance.filtered().length).toBe(2);
  });

  it('produces unique plan and country options', () => {
    const fixture = TestBed.createComponent(TenantsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/tenants').flush([
      makeTenant({ id: '1', planName: 'Growth', country: 'Kuwait' }),
      makeTenant({ id: '2', planName: 'Growth', country: 'UAE' }),
      makeTenant({ id: '3', planName: 'Starter', country: 'Kuwait' }),
    ]);
    expect(fixture.componentInstance.availablePlans()).toEqual(['Growth', 'Starter']);
    expect(fixture.componentInstance.availableCountries()).toEqual(['Kuwait', 'UAE']);
  });

  it('badgeForStatus returns success for active', () => {
    const fixture = TestBed.createComponent(TenantsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/tenants').flush([]);
    expect(fixture.componentInstance.badgeForStatus('active')).toBe('sa-badge--success');
    expect(fixture.componentInstance.badgeForStatus('trial')).toBe('sa-badge--warning');
    expect(fixture.componentInstance.badgeForStatus('suspended')).toBe('sa-badge--danger');
  });
});
