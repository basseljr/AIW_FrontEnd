import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { LanguageToggleService } from '@shared/i18n';
import { API_BASE_URL } from '@shared/api';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { CustomerProfile } from '../models/auth.model';
import { PLATFORM_ID, signal } from '@angular/core';

const MOCK_PROFILE: CustomerProfile = {
  id: 'u1',
  tenantId: 't1',
  fullName: 'Alice Smith',
  email: 'alice@example.com',
  phone: null,
  phoneCountryCode: null,
  isEmailVerified: true,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  deletionRequestedAt: null,
};

const MOCK_AUTH_RESPONSE = {
  customerId: 'u1',
  tenantId: 't1',
  role: 'customer',
  isEmailVerified: true,
  accessTokenExpiresAt: '2025-01-01T01:00:00Z',
  cartId: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let cartService: jasmine.SpyObj<CartService>;

  beforeEach(() => {
    cartService = jasmine.createSpyObj('CartService', ['reload', 'clear']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: API_BASE_URL, useValue: 'http://localhost:5182/api/v1' },
        { provide: CartService, useValue: cartService },
        {
          provide: LanguageToggleService,
          useValue: { current: signal('en'), isRtl: signal(false), toggle: () => {} },
        },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('isAuthenticated returns false when no user', () => {
    service.currentUser.set(null);
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('loads profile and sets currentUser signal', (done) => {
    service.loadProfile().subscribe(() => {
      expect(service.currentUser()).toEqual(MOCK_PROFILE);
      expect(service.isAuthenticated()).toBeTrue();
      done();
    });

    httpMock.expectOne((req) => req.url.includes('/storefront/account/profile'))
      .flush(MOCK_PROFILE);
  });

  it('logs in an existing user via POST /auth/login', (done) => {
    service.login('alice@example.com', 'secret', null).subscribe((res) => {
      expect(res.customerId).toBe('u1');
      expect(service.currentUser()).toEqual(MOCK_PROFILE);
      done();
    });

    httpMock.expectOne((req) => req.url.includes('/storefront/auth/login') && req.method === 'POST')
      .flush(MOCK_AUTH_RESPONSE);
    httpMock.expectOne((req) => req.url.includes('/storefront/account/profile'))
      .flush(MOCK_PROFILE);
  });

  it('registers a new user via POST /auth/register', (done) => {
    service.register('Alice Smith', 'alice@example.com', 'Password1!', null, null).subscribe((res) => {
      expect(res.customerId).toBe('u1');
      expect(service.currentUser()).toEqual(MOCK_PROFILE);
      done();
    });

    httpMock.expectOne((req) => req.url.includes('/storefront/auth/register') && req.method === 'POST')
      .flush(MOCK_AUTH_RESPONSE);
    httpMock.expectOne((req) => req.url.includes('/storefront/account/profile'))
      .flush(MOCK_PROFILE);
  });

  it('logs out and clears currentUser', (done) => {
    service.currentUser.set(MOCK_PROFILE);
    service.logout().subscribe({
      next: () => {
        expect(service.currentUser()).toBeNull();
        done();
      },
    });

    httpMock.expectOne((req) => req.url.includes('/storefront/auth/logout') && req.method === 'POST')
      .flush({ message: 'Logged out successfully.' });
  });
});
