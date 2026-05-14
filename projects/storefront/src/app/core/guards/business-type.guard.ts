import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { TenantConfigService } from '../services/tenant-config.service';

// When config is null (still loading), default to restaurant routes.
// In ng serve, the dev tenant is always restaurant. In SSR production, config is
// injected synchronously before routing so null never occurs at routing time.
export const isRestaurantTenant: CanMatchFn = () => {
  const config = inject(TenantConfigService).config();
  return config === null || config.businessType === 'restaurant';
};

export const isRetailTenant: CanMatchFn = () =>
  inject(TenantConfigService).config()?.businessType === 'retail';

export const isServiceTenant: CanMatchFn = () =>
  inject(TenantConfigService).config()?.businessType === 'service';
