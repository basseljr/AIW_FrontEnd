import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { FeatureFlagsComponent } from './feature-flags.component';
import { FeatureFlag } from '../../core/models/super-admin-api.models';
import { TestTranslateLoader } from '../../testing/test-translate-loader';

const makeFlag = (o: Partial<FeatureFlag> = {}): FeatureFlag => ({
  key: 'feature.test',
  label: 'Test',
  description: 'A test flag',
  category: 'Core',
  defaultValue: false,
  ...o,
});

describe('FeatureFlagsComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        FeatureFlagsComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [{ provide: API_BASE_URL, useValue: '/api/v1' }],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads flags on init', () => {
    const fixture = TestBed.createComponent(FeatureFlagsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/feature-flags').flush([
      makeFlag({ key: 'feature.a' }),
      makeFlag({ key: 'feature.b', category: 'Restaurant' }),
    ]);
    expect(fixture.componentInstance.flags().length).toBe(2);
  });

  it('filters by category', () => {
    const fixture = TestBed.createComponent(FeatureFlagsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/feature-flags').flush([
      makeFlag({ key: 'a', category: 'Core' }),
      makeFlag({ key: 'b', category: 'Restaurant' }),
    ]);
    fixture.componentInstance.categoryFilter.set('Restaurant');
    expect(fixture.componentInstance.filtered().length).toBe(1);
  });

  it('opens create form with blank values', () => {
    const fixture = TestBed.createComponent(FeatureFlagsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/feature-flags').flush([]);
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.showForm()).toBe(true);
    expect(fixture.componentInstance.editing()).toBeNull();
    expect(fixture.componentInstance.form().key).toBe('');
  });

  it('opens edit form preloaded with the flag', () => {
    const fixture = TestBed.createComponent(FeatureFlagsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/feature-flags').flush([]);
    const flag = makeFlag({ key: 'feature.kds', label: 'KDS' });
    fixture.componentInstance.openEdit(flag);
    expect(fixture.componentInstance.editing()?.key).toBe('feature.kds');
    expect(fixture.componentInstance.form().label).toBe('KDS');
  });

  it('search filters by key and description', () => {
    const fixture = TestBed.createComponent(FeatureFlagsComponent);
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/admin/feature-flags').flush([
      makeFlag({ key: 'feature.kds', description: 'Kitchen' }),
      makeFlag({ key: 'feature.loyalty', description: 'Customer rewards' }),
    ]);
    fixture.componentInstance.search.set('kitchen');
    expect(fixture.componentInstance.filtered().length).toBe(1);
    fixture.componentInstance.search.set('loyalty');
    expect(fixture.componentInstance.filtered().length).toBe(1);
  });
});
