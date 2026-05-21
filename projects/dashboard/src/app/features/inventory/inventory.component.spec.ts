import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { ProductsService } from '../../core/services/products.service';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryComponent } from './inventory.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const MOCK_PRODUCTS_RESULT = {
  items: [{ id: 'p1', nameEn: 'T-Shirt', nameAr: 'تيشيرت', categoryId: null, categoryNameEn: null, descriptionEn: null, descriptionAr: null, price: 5.5, sku: null, barcode: null, imageUrl: null, isPublished: true, sortOrder: 1, productType: 'physical', outOfStockBehavior: null, lowStockThreshold: null }],
  totalCount: 1, page: 1, pageSize: 200,
};

const MOCK_VARIANTS = [
  { id: 'v1', productId: 'p1', sku: 'S001', barcode: null, price: 5.5, compareAtPrice: null, quantity: 10, variantAttributesJson: '{"size":"M"}' },
];

function buildFixture() {
  const mockProducts = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of(MOCK_PRODUCTS_RESULT)),
  };
  const mockInventory = {
    getVariants: jasmine.createSpy('getVariants').and.returnValue(of(MOCK_VARIANTS)),
    updateInventory: jasmine.createSpy('updateInventory').and.returnValue(of({})),
  };

  TestBed.configureTestingModule({
    imports: [
      InventoryComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: ProductsService, useValue: mockProducts },
      { provide: InventoryService, useValue: mockInventory },
    ],
  });

  return { fixture: TestBed.createComponent(InventoryComponent), mockProducts, mockInventory };
}

describe('InventoryComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads product list on init', fakeAsync(() => {
    const { fixture, mockProducts } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockProducts.getAll).toHaveBeenCalled();
    expect(fixture.componentInstance.products().length).toBe(1);
  }));

  it('onProductChange loads variants', fakeAsync(() => {
    const { fixture, mockInventory } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.onProductChange('p1');
    tick();
    expect(mockInventory.getVariants).toHaveBeenCalledWith('p1');
    expect(fixture.componentInstance.rows().length).toBe(1);
  }));

  it('stockStatus returns out when quantity is 0', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    const row = { variant: MOCK_VARIANTS[0], branchId: 'b1', quantity: 0, lowStockThreshold: null, saving: false };
    expect(fixture.componentInstance.stockStatus(row)).toBe('out');
  }));

  it('stockStatus returns low when quantity <= threshold', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    const row = { variant: MOCK_VARIANTS[0], branchId: 'b1', quantity: 3, lowStockThreshold: 5, saving: false };
    expect(fixture.componentInstance.stockStatus(row)).toBe('low');
  }));

  it('formatAttrs parses JSON attributes', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.formatAttrs('{"size":"M","color":"blue"}')).toContain('size: M');
  }));
});
