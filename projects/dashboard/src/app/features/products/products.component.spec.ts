import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductsComponent } from './products.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const MOCK_PRODUCTS = {
  items: [
    { id: 'p1', categoryId: null, categoryNameEn: null, nameEn: 'T-Shirt', nameAr: 'تيشيرت', descriptionEn: null, descriptionAr: null, price: 5.5, sku: null, barcode: null, imageUrl: null, isPublished: true, sortOrder: 1, productType: 'physical', outOfStockBehavior: null, lowStockThreshold: null },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

function buildFixture() {
  const mockProducts = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of(MOCK_PRODUCTS)),
    create: jasmine.createSpy('create').and.returnValue(of(MOCK_PRODUCTS.items[0])),
    update: jasmine.createSpy('update').and.returnValue(of(MOCK_PRODUCTS.items[0])),
    delete: jasmine.createSpy('delete').and.returnValue(of(void 0)),
  };
  const mockCategories = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of([])),
  };
  const mockInventory = {
    getVariants: jasmine.createSpy('getVariants').and.returnValue(of([])),
    createVariant: jasmine.createSpy('createVariant').and.returnValue(of({})),
  };

  TestBed.configureTestingModule({
    imports: [
      ProductsComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: ProductsService, useValue: mockProducts },
      { provide: CategoriesService, useValue: mockCategories },
      { provide: InventoryService, useValue: mockInventory },
    ],
  });

  return { fixture: TestBed.createComponent(ProductsComponent), mockProducts };
}

describe('ProductsComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads products on init', fakeAsync(() => {
    const { fixture, mockProducts } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockProducts.getAll).toHaveBeenCalled();
    expect(fixture.componentInstance.items().length).toBe(1);
  }));

  it('openAdd sets showForm to true', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.openAdd();
    expect(fixture.componentInstance.showForm()).toBeTrue();
  }));

  it('closeForm sets showForm to false', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.openAdd();
    fixture.componentInstance.closeForm();
    expect(fixture.componentInstance.showForm()).toBeFalse();
  }));
});
