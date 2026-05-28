import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { LanguageToggleService, SupportedLang } from '@shared/i18n';
import { TenantConfigService } from '../../../core/services/tenant-config.service';
import { WishlistService, WishlistItem } from '../../../core/services/wishlist.service';
import { AccountWishlistComponent } from './account-wishlist.component';
import { DEFAULT_DEV_TENANT } from '../../../core/models/tenant-config.model';

class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      account: {
        wishlist_title: 'My Wishlist',
        wishlist_not_available: 'Wishlist available for retail stores',
        no_wishlist: 'Your wishlist is empty',
        no_wishlist_sub: 'Save products you love',
        wishlist_move_to_cart: 'Move to Cart',
      },
      common: { currency: 'KD', remove: 'Remove', loading: 'Loading...' },
      home: { shop_now: 'Shop Now' },
    });
  }
}

const mockItems: WishlistItem[] = [
  {
    id: 'w1',
    productId: 'p1',
    productNameEn: 'Blue Shirt',
    productNameAr: 'قميص أزرق',
    price: 12.5,
    imageUrl: 'https://example.com/shirt.jpg',
    slug: 'blue-shirt',
    categorySlug: 'clothing',
  },
  {
    id: 'w2',
    productId: 'p2',
    productNameEn: 'Black Pants',
    productNameAr: 'بنطلون أسود',
    price: 22.0,
    imageUrl: undefined,
    slug: 'black-pants',
    categorySlug: 'clothing',
  },
];

function buildFixture(opts: { isRetail?: boolean; items?: WishlistItem[] } = {}) {
  const isRetailTenant = opts.isRetail !== false;
  const mockLang = signal<SupportedLang>('en');
  const config = { ...DEFAULT_DEV_TENANT, businessType: isRetailTenant ? 'retail' : 'restaurant' };
  const mockConfig = signal(config);

  const mockWishlist = {
    getWishlist: jasmine.createSpy('getWishlist').and.returnValue(of(opts.items ?? mockItems)),
    removeItem: jasmine.createSpy('removeItem').and.returnValue(of(undefined)),
    moveToCart: jasmine.createSpy('moveToCart').and.returnValue(of({})),
    addItem: jasmine.createSpy('addItem').and.returnValue(of(mockItems[0])),
  };

  TestBed.configureTestingModule({
    imports: [
      AccountWishlistComponent,
      HttpClientTestingModule,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockTranslateLoader } }),
    ],
    providers: [
      provideRouter([]),
      { provide: API_BASE_URL, useValue: 'http://localhost' },
      { provide: TenantConfigService, useValue: { config: mockConfig.asReadonly() } },
      { provide: LanguageToggleService, useValue: { current: mockLang.asReadonly(), isRtl: signal(false).asReadonly() } },
      { provide: WishlistService, useValue: mockWishlist },
    ],
  });

  const fixture = TestBed.createComponent(AccountWishlistComponent);
  fixture.detectChanges();
  return { fixture, mockWishlist };
}

describe('AccountWishlistComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('shows unavailable message for non-retail tenants', () => {
    const { fixture } = buildFixture({ isRetail: false });
    const el = fixture.nativeElement.querySelector('.wishlist__unavailable');
    expect(el).toBeTruthy();
  });

  it('does not call getWishlist for non-retail tenants', () => {
    const { mockWishlist } = buildFixture({ isRetail: false });
    expect(mockWishlist.getWishlist).not.toHaveBeenCalled();
  });

  it('calls getWishlist on init for retail tenant', () => {
    const { mockWishlist } = buildFixture();
    expect(mockWishlist.getWishlist).toHaveBeenCalledTimes(1);
  });

  it('renders wishlist items', () => {
    const { fixture } = buildFixture();
    const cards = fixture.nativeElement.querySelectorAll('.wishlist__card');
    expect(cards.length).toBe(mockItems.length);
  });

  it('shows empty state when no items', () => {
    const { fixture } = buildFixture({ items: [] });
    const empty = fixture.nativeElement.querySelector('.wishlist__empty');
    expect(empty).toBeTruthy();
  });

  it('displays product names', () => {
    const { fixture } = buildFixture();
    const names = fixture.nativeElement.querySelectorAll('.wishlist__card-name');
    expect(names[0].textContent?.trim()).toContain('Blue Shirt');
  });

  it('displays placeholder when no imageUrl', () => {
    const { fixture } = buildFixture();
    const placeholder = fixture.nativeElement.querySelector('.wishlist__card-img-placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('removes item optimistically on remove click', () => {
    const { fixture } = buildFixture();
    expect(fixture.componentInstance.items().length).toBe(2);
    fixture.componentInstance.onRemove(mockItems[0]);
    fixture.detectChanges();
    expect(fixture.componentInstance.items().length).toBe(1);
  });

  it('restores item on remove failure', () => {
    const { fixture, mockWishlist } = buildFixture();
    mockWishlist.removeItem.and.returnValue(throwError(() => new Error('fail')));
    fixture.componentInstance.onRemove(mockItems[0]);
    fixture.detectChanges();
    // Item restored
    expect(fixture.componentInstance.items().length).toBe(2);
  });

  it('removes item from wishlist after successful move to cart', () => {
    const { fixture } = buildFixture();
    fixture.componentInstance.onMoveToCart(mockItems[0]);
    fixture.detectChanges();
    expect(fixture.componentInstance.items().find((i) => i.productId === 'p1')).toBeUndefined();
  });

  it('shows error on move to cart failure', () => {
    const { fixture, mockWishlist } = buildFixture();
    mockWishlist.moveToCart.and.returnValue(throwError(() => new Error('fail')));
    fixture.componentInstance.onMoveToCart(mockItems[0]);
    fixture.detectChanges();
    expect(fixture.componentInstance.errors().has('p1')).toBeTrue();
  });
});
