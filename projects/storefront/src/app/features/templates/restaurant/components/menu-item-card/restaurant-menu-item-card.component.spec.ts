import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RestaurantMenuItemCardComponent } from './restaurant-menu-item-card.component';
import { CatalogItem } from '../../../../../core/models/catalog.model';

class MockLoader implements TranslateLoader {
  getTranslation() {
    return of({
      catalog: {
        view_item: 'View Item',
        add_to_cart: 'Add to Cart',
        out_of_stock: 'Out of Stock',
      },
      common: { currency: 'KD' },
    });
  }
}

const mockItem: CatalogItem = {
  id: '1',
  slug: 'shawarma',
  categoryId: 'c1',
  categorySlug: 'mains',
  categoryNameEn: 'Mains',
  categoryNameAr: 'الرئيسية',
  nameEn: 'Chicken Shawarma',
  nameAr: 'شاورما دجاج',
  price: 2.5,
  isAvailable: true,
  isPublished: true,
};

function buildFixture(itemOverrides: Partial<CatalogItem> = {}) {
  TestBed.configureTestingModule({
    imports: [
      RestaurantMenuItemCardComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
  });
  const fixture = TestBed.createComponent(RestaurantMenuItemCardComponent);
  fixture.componentInstance.item = { ...mockItem, ...itemOverrides };
  fixture.componentInstance.lang = 'en';
  fixture.detectChanges();
  return fixture;
}

describe('RestaurantMenuItemCardComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders item name', () => {
    const fixture = buildFixture();
    const el = fixture.nativeElement.querySelector('.sf-menu-card__name');
    expect(el?.textContent?.trim()).toBe('Chicken Shawarma');
  });

  it('renders price', () => {
    const fixture = buildFixture();
    const el = fixture.nativeElement.querySelector('.sf-menu-card__price');
    expect(el?.textContent).toContain('2.500');
  });

  it('out-of-stock badge shown when isAvailable is false', () => {
    const fixture = buildFixture({ isAvailable: false });
    const badge = fixture.nativeElement.querySelector('.sf-menu-card__oos-badge');
    expect(badge).toBeTruthy();
  });

  it('viewItem emitted on button click', () => {
    const fixture = buildFixture();
    const spy = jasmine.createSpy('viewItem');
    fixture.componentInstance.viewItem.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('.sf-menu-card__btn') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ id: '1' }));
  });
});
