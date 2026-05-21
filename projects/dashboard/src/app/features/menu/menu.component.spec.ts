import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { MenuService } from '../../core/services/menu.service';
import { CategoriesService } from '../../core/services/categories.service';
import { ModifiersService } from '../../core/services/modifiers.service';
import { MenuComponent } from './menu.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const MOCK_CATEGORIES = [
  { id: 'cat1', parentId: null, nameEn: 'Starters', nameAr: 'مقبلات', descriptionEn: null, descriptionAr: null, imageUrl: null, sortOrder: 1, isPublished: true },
];

const MOCK_ITEMS_RESULT = {
  items: [
    {
      id: 'mi1', categoryId: 'cat1', categoryNameEn: 'Starters',
      nameEn: 'Salad', nameAr: 'سلطة', descriptionEn: null, descriptionAr: null,
      price: 1.5, imageUrl: null, isPublished: true, isAvailable: true,
      preparationTime: 5, calories: 120, spiceLevel: 'none', tags: null,
      sku: null, sortOrder: 1, modifierGroupIds: [],
    },
  ],
  totalCount: 1, page: 1, pageSize: 500,
};

function buildFixture() {
  const mockMenu = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of(MOCK_ITEMS_RESULT)),
    create: jasmine.createSpy('create').and.returnValue(of(MOCK_ITEMS_RESULT.items[0])),
    update: jasmine.createSpy('update').and.returnValue(of(MOCK_ITEMS_RESULT.items[0])),
    delete: jasmine.createSpy('delete').and.returnValue(of(void 0)),
  };
  const mockCategories = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of(MOCK_CATEGORIES)),
    create: jasmine.createSpy('create').and.returnValue(of(MOCK_CATEGORIES[0])),
    update: jasmine.createSpy('update').and.returnValue(of(MOCK_CATEGORIES[0])),
    delete: jasmine.createSpy('delete').and.returnValue(of(void 0)),
  };
  const mockModifiers = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of([])),
  };

  TestBed.configureTestingModule({
    imports: [
      MenuComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: MenuService, useValue: mockMenu },
      { provide: CategoriesService, useValue: mockCategories },
      { provide: ModifiersService, useValue: mockModifiers },
    ],
  });

  return { fixture: TestBed.createComponent(MenuComponent), mockMenu, mockCategories };
}

describe('MenuComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads categories on init', fakeAsync(() => {
    const { fixture, mockCategories } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockCategories.getAll).toHaveBeenCalled();
    expect(fixture.componentInstance.categories().length).toBe(1);
  }));

  it('loads all menu items on init', fakeAsync(() => {
    const { fixture, mockMenu } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockMenu.getAll).toHaveBeenCalled();
    expect(fixture.componentInstance.allItems().length).toBe(1);
  }));

  it('selectCategory updates signal', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.selectCategory('cat1');
    expect(fixture.componentInstance.selectedCategoryId()).toBe('cat1');
  }));

  it('filteredItems returns items for selected category', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.selectCategory('cat1');
    expect(fixture.componentInstance.filteredItems().length).toBe(1);
  }));

  it('openAddItem sets showItemForm to true when category selected', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.selectCategory('cat1');
    fixture.componentInstance.openAddItem();
    expect(fixture.componentInstance.showItemForm()).toBeTrue();
  }));

  it('toggleModifier adds and removes group ids', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.openAddCategory();
    fixture.componentInstance.openAddItem();
    fixture.componentInstance.toggleModifier('mg1', true);
    expect(fixture.componentInstance.itemForm().modifierGroupIds).toContain('mg1');
    fixture.componentInstance.toggleModifier('mg1', false);
    expect(fixture.componentInstance.itemForm().modifierGroupIds).not.toContain('mg1');
  }));
});
