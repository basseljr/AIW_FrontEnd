import { TestBed } from '@angular/core/testing';
import { makeStateKey, TransferState } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { TenantConfigService, TENANT_CONFIG_STATE_KEY, NOT_FOUND_STATE_KEY } from './tenant-config.service';
import { TENANT_CONFIG_TOKEN, ROUTE_NOT_FOUND_TOKEN } from '../tokens/tenant-config.token';
import { DEFAULT_DEV_TENANT } from '../models/tenant-config.model';
import { provideApiBaseUrl } from '@shared/api';

describe('TenantConfigService', () => {
  function build(overrides: {
    tenantConfig?: typeof DEFAULT_DEV_TENANT | null;
    notFound?: boolean;
    transferStateConfig?: typeof DEFAULT_DEV_TENANT | null;
    transferStateNotFound?: boolean;
  } = {}): TenantConfigService {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiBaseUrl('http://test/api/v1'),
        overrides.tenantConfig !== undefined
          ? { provide: TENANT_CONFIG_TOKEN, useValue: overrides.tenantConfig }
          : [],
        overrides.notFound
          ? { provide: ROUTE_NOT_FOUND_TOKEN, useValue: true }
          : [],
      ],
    });

    if (overrides.transferStateConfig !== undefined) {
      const ts = TestBed.inject(TransferState);
      ts.set(TENANT_CONFIG_STATE_KEY, overrides.transferStateConfig as typeof DEFAULT_DEV_TENANT);
    }
    if (overrides.transferStateNotFound) {
      const ts = TestBed.inject(TransferState);
      ts.set(NOT_FOUND_STATE_KEY, true);
    }

    return TestBed.inject(TenantConfigService);
  }

  it('exposes tenant config from server injection token', () => {
    const service = build({ tenantConfig: DEFAULT_DEV_TENANT });
    expect(service.config()).toBe(DEFAULT_DEV_TENANT);
    expect(service.isNotFound()).toBe(false);
  });

  it('sets isNotFound when ROUTE_NOT_FOUND_TOKEN is true', () => {
    const service = build({ notFound: true });
    expect(service.isNotFound()).toBe(true);
    expect(service.config()).toBeNull();
  });

  it('reads tenant config from TransferState on browser hydration', () => {
    const service = build({ transferStateConfig: DEFAULT_DEV_TENANT });
    expect(service.config()).toEqual(DEFAULT_DEV_TENANT);
    // Confirm TransferState was consumed (key removed after read)
    const ts = TestBed.inject(TransferState);
    expect(ts.hasKey(TENANT_CONFIG_STATE_KEY)).toBe(false);
  });

  it('reads isNotFound from TransferState on browser hydration', () => {
    const service = build({ transferStateNotFound: true });
    expect(service.isNotFound()).toBe(true);
  });
});
