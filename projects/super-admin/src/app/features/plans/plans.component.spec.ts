import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { API_BASE_URL } from '@shared/api';
import { PlansComponent } from './plans.component';
import { SubscriptionPlan } from '../../core/models/super-admin-api.models';
import { TestTranslateLoader } from '../../testing/test-translate-loader';

const makePlan = (o: Partial<SubscriptionPlan> = {}): SubscriptionPlan => ({
  id: 'p-1',
  name: 'Growth',
  description: 'Growth tier',
  isVisible: true,
  isHighlighted: false,
  billingModel: 'flat',
  monthlyPrice: 49,
  annualPrice: 490,
  commissionRate: null,
  commissionThreshold: null,
  currency: 'KWD',
  trialDays: 14,
  maxBranches: 3,
  maxStaffUsers: 10,
  maxProducts: null,
  tenantCount: 5,
  featureFlags: [{ flagKey: 'feature.kds', value: true }],
  ...o,
});

describe('PlansComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        PlansComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TestTranslateLoader } }),
      ],
      providers: [{ provide: API_BASE_URL, useValue: '/api/v1' }],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  function flush(plans: SubscriptionPlan[]) {
    httpMock.expectOne('/api/v1/admin/subscription-plans').flush(plans);
    httpMock.expectOne('/api/v1/admin/feature-flags').flush([]);
  }

  it('loads plans and flags', () => {
    const fixture = TestBed.createComponent(PlansComponent);
    fixture.detectChanges();
    flush([makePlan()]);
    expect(fixture.componentInstance.plans().length).toBe(1);
  });

  it('opens edit form pre-filled', () => {
    const fixture = TestBed.createComponent(PlansComponent);
    fixture.detectChanges();
    flush([]);
    fixture.componentInstance.openEdit(makePlan({ name: 'Pro' }));
    expect(fixture.componentInstance.form().name).toBe('Pro');
    expect(fixture.componentInstance.showForm()).toBe(true);
  });

  it('toggleFlag adds/removes from featureFlags', () => {
    const fixture = TestBed.createComponent(PlansComponent);
    fixture.detectChanges();
    flush([]);
    fixture.componentInstance.openCreate();
    fixture.componentInstance.toggleFlag('feature.x', true);
    expect(fixture.componentInstance.flagEnabled('feature.x')).toBe(true);
    fixture.componentInstance.toggleFlag('feature.x', false);
    expect(fixture.componentInstance.flagEnabled('feature.x')).toBe(false);
  });

  it('formatPrice returns "—" when null', () => {
    const fixture = TestBed.createComponent(PlansComponent);
    fixture.detectChanges();
    flush([]);
    const plan = makePlan({ monthlyPrice: null, annualPrice: 240 });
    expect(fixture.componentInstance.formatPrice(plan, 'monthly')).toBe('—');
    expect(fixture.componentInstance.formatPrice(plan, 'annual')).toBe('KD 240');
  });
});
