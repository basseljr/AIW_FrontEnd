import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { DeliveryProvidersComponent } from './delivery-providers.component';
import { TestTranslateLoader } from '../../testing/test-translate-loader';

describe('DeliveryProvidersComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DeliveryProvidersComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [{ provide: API_BASE_URL, useValue: '/api/v1' }],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads providers', () => {
    const fixture = TestBed.createComponent(DeliveryProvidersComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/delivery-providers').flush([
      { key: 'talabat', name: 'Talabat', isEnabled: true, tenantCount: 5, description: 'A' },
      { key: 'careem', name: 'Careem', isEnabled: false, tenantCount: 0, description: 'B' },
    ]);
    expect(fixture.componentInstance.providers().length).toBe(2);
  });

  it('toggle PATCHes the provider', () => {
    const fixture = TestBed.createComponent(DeliveryProvidersComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/delivery-providers').flush([
      { key: 'talabat', name: 'Talabat', isEnabled: false, tenantCount: 0, description: 'A' },
    ]);
    fixture.componentInstance.toggle(fixture.componentInstance.providers()[0]);
    const patch = httpMock.expectOne('/api/v1/admin/delivery-providers/talabat');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ isEnabled: true });
    patch.flush({ key: 'talabat', name: 'Talabat', isEnabled: true, tenantCount: 0, description: 'A' });
    httpMock.expectOne('/api/v1/admin/delivery-providers').flush([]);
  });
});
