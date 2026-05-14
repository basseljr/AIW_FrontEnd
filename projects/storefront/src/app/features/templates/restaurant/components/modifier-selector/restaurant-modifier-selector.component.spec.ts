import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RestaurantModifierSelectorComponent } from './restaurant-modifier-selector.component';
import { CatalogItemDetail } from '../../../../../core/models/catalog.model';

class MockLoader implements TranslateLoader {
  getTranslation() {
    return of({
      catalog: { add_to_cart: 'Add to Cart', free: 'Free' },
      common: { close: 'Close', currency: 'KD' },
      item_detail: {
        required: 'Required',
        optional: 'Optional',
        special_instructions: 'Special instructions',
        special_instructions_placeholder: 'Requests...',
        total_price: 'Total',
      },
    });
  }
}

const mockItem: CatalogItemDetail = {
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
  modifierGroups: [
    {
      id: 'g1',
      nameEn: 'Size',
      nameAr: 'الحجم',
      selectionType: 'single',
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      options: [
        { id: 'o1', nameEn: 'Small', nameAr: 'صغير', price: 0 },
        { id: 'o2', nameEn: 'Large', nameAr: 'كبير', price: 0.5 },
      ],
    },
    {
      id: 'g2',
      nameEn: 'Extras',
      nameAr: 'إضافات',
      selectionType: 'multiple',
      isRequired: false,
      minSelections: 0,
      maxSelections: 3,
      options: [
        { id: 'o3', nameEn: 'Extra Sauce', nameAr: 'صوص إضافي', price: 0.25 },
      ],
    },
  ],
};

function buildFixture(open = true) {
  TestBed.configureTestingModule({
    imports: [
      RestaurantModifierSelectorComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
  });
  const fixture = TestBed.createComponent(RestaurantModifierSelectorComponent);
  fixture.componentInstance.item = mockItem;
  fixture.componentInstance.open = open;
  fixture.detectChanges();
  return fixture;
}

describe('RestaurantModifierSelectorComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('shows required badge for required groups', () => {
    const fixture = buildFixture();
    const badges = fixture.nativeElement.querySelectorAll('.sf-mod__required-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('single-select uses radio buttons', () => {
    const fixture = buildFixture();
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(2); // Size group has 2 options
  });

  it('multi-select uses checkboxes', () => {
    const fixture = buildFixture();
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(1); // Extras group has 1 option
  });

  it('confirm button disabled until required groups filled', () => {
    const fixture = buildFixture();
    const btn = fixture.nativeElement.querySelector('.sf-mod__confirm-btn') as HTMLButtonElement;
    // Initially disabled (required Size not selected)
    expect(btn.disabled).toBeTrue();
  });

  it('total price updates when modifier selected', () => {
    const fixture = buildFixture();
    // Select "Large" radio (price 0.5)
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    // radios[1] = Large option
    radios[1].click();
    fixture.detectChanges();
    const totalEl = fixture.nativeElement.querySelector('.sf-mod__total-value');
    // 2.5 base + 0.5 large = 3.0 * 1 qty
    expect(totalEl?.textContent).toContain('3.000');
  });
});
