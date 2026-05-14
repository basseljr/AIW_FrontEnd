import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { CartItem } from '../models/catalog.model';

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

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CartService] });
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
