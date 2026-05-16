import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { CartService } from './cart.service';
import { CartItem } from '../models/catalog.model';
import { API_BASE_URL } from '@shared/api';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    itemId: 'item-1',
    slug: 'shawarma',
    categorySlug: 'mains',
    nameEn: 'Shawarma',
    nameAr: 'شاورما',
    price: 2.5,
    quantity: 1,
    ...overrides,
  };
}

describe('CartService (server-side, no HTTP calls)', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CartService,
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: API_BASE_URL, useValue: 'http://localhost' },
      ],
    });
    service = TestBed.inject(CartService);
  });

  it('addItem → count increases', () => {
    expect(service.count()).toBe(0);
    service.addItem(makeItem());
    expect(service.count()).toBe(1);
    service.addItem(makeItem({ itemId: 'item-2', slug: 'falafel' }));
    expect(service.count()).toBe(2);
  });

  it('addItem with same item → quantity merged', () => {
    service.addItem(makeItem({ quantity: 2 }));
    service.addItem(makeItem({ quantity: 3 }));
    expect(service.items().length).toBe(1);
    expect(service.items()[0].quantity).toBe(5);
    expect(service.count()).toBe(5);
  });

  it('removeItem → count decreases', () => {
    service.addItem(makeItem({ quantity: 2 }));
    expect(service.count()).toBe(2);
    service.removeItem('item-1');
    expect(service.count()).toBe(0);
    expect(service.items().length).toBe(0);
  });

  it('updateQuantity sets the correct quantity', () => {
    service.addItem(makeItem({ quantity: 1 }));
    service.updateQuantity('item-1', 4);
    expect(service.items()[0].quantity).toBe(4);
    expect(service.count()).toBe(4);
  });

  it('total calculation includes modifier prices', () => {
    const item: CartItem = makeItem({
      price: 2.0,
      quantity: 2,
      selectedModifiers: [
        {
          groupId: 'g1',
          groupNameEn: 'Size',
          groupNameAr: 'الحجم',
          optionId: 'o1',
          optionNameEn: 'Large',
          optionNameAr: 'كبير',
          price: 0.5,
        },
        {
          groupId: 'g2',
          groupNameEn: 'Sauce',
          groupNameAr: 'الصوص',
          optionId: 'o2',
          optionNameEn: 'Extra Sauce',
          optionNameAr: 'صوص إضافي',
          price: 0.25,
        },
      ],
    });
    service.addItem(item);
    // (2.0 + 0.5 + 0.25) * 2 = 5.5
    expect(service.total()).toBeCloseTo(5.5, 2);
  });

  it('clear empties the cart', () => {
    service.addItem(makeItem({ quantity: 3 }));
    service.addItem(makeItem({ itemId: 'item-2', slug: 'falafel', quantity: 2 }));
    expect(service.count()).toBe(5);
    service.clear();
    expect(service.count()).toBe(0);
    expect(service.items().length).toBe(0);
    expect(service.total()).toBe(0);
  });
});

describe('CartService (browser-side, loads from API)', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CartService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: API_BASE_URL, useValue: 'http://localhost' },
      ],
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads cart from API on init', () => {
    const req = httpMock.expectOne('http://localhost/storefront/cart');
    expect(req.request.method).toBe('GET');
    req.flush({
      cartId: 'cart-1',
      items: [{
        cartItemId: 'ci-1',
        productId: 'item-1',
        variantId: null,
        name: 'Shawarma',
        nameAr: 'شاورما',
        quantity: 2,
        unitPrice: 2.5,
        totalPrice: 5,
        modifiersJson: null,
        notes: null,
      }],
      subtotal: 5,
      deliveryFee: null,
      discount: 0,
      total: 5,
    });
    expect(service.count()).toBe(2);
    expect(service.cartId()).toBe('cart-1');
  });

  it('handles API failure gracefully on init', () => {
    const req = httpMock.expectOne('http://localhost/storefront/cart');
    req.error(new ProgressEvent('network error'));
    expect(service.count()).toBe(0);
  });
});
