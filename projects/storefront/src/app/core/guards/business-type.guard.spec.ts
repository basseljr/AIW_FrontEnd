import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TenantConfigService } from '../services/tenant-config.service';
import { isRestaurantTenant, isRetailTenant, isServiceTenant } from './business-type.guard';

function setupGuard(businessType: 'restaurant' | 'retail' | 'service') {
  const mockConfig = signal({ businessType } as any);
  TestBed.configureTestingModule({
    providers: [
      {
        provide: TenantConfigService,
        useValue: { config: mockConfig.asReadonly() },
      },
    ],
  });
}

describe('Business-type guards', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('isRestaurantTenant returns true when businessType is restaurant', () => {
    setupGuard('restaurant');
    const result = TestBed.runInInjectionContext(() => isRestaurantTenant({} as any, {} as any));
    expect(result).toBeTrue();
  });

  it('isRetailTenant returns true when businessType is retail', () => {
    setupGuard('retail');
    const result = TestBed.runInInjectionContext(() => isRetailTenant({} as any, {} as any));
    expect(result).toBeTrue();
  });

  it('isServiceTenant returns false when businessType is restaurant', () => {
    setupGuard('restaurant');
    const result = TestBed.runInInjectionContext(() => isServiceTenant({} as any, {} as any));
    expect(result).toBeFalse();
  });
});
