import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { CategoriesService } from '../../core/services/categories.service';
import { CategoriesComponent } from './categories.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const MOCK_CATS = [
  { id: 'c1', parentId: null, nameEn: 'Starters', nameAr: 'مقبلات', descriptionEn: null, descriptionAr: null, imageUrl: null, sortOrder: 1, isPublished: true },
  { id: 'c2', parentId: null, nameEn: 'Mains', nameAr: 'رئيسية', descriptionEn: null, descriptionAr: null, imageUrl: null, sortOrder: 2, isPublished: false },
];

function buildFixture(cats = MOCK_CATS, fail = false) {
  const mockSvc = {
    getAll: jasmine.createSpy('getAll').and.returnValue(fail ? of([]) : of(cats)),
    create: jasmine.createSpy('create').and.returnValue(of(cats[0])),
    update: jasmine.createSpy('update').and.returnValue(of(cats[0])),
    delete: jasmine.createSpy('delete').and.returnValue(of(void 0)),
    reorder: jasmine.createSpy('reorder').and.returnValue(of(void 0)),
  };

  TestBed.configureTestingModule({
    imports: [
      CategoriesComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [{ provide: CategoriesService, useValue: mockSvc }],
  });

  return { fixture: TestBed.createComponent(CategoriesComponent), mockSvc };
}

describe('CategoriesComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('calls getAll() on init', fakeAsync(() => {
    const { fixture, mockSvc } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockSvc.getAll).toHaveBeenCalled();
  }));

  it('sets items signal after load', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance.items().length).toBe(2);
  }));

  it('parentName returns — for null', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.parentName(null)).toBe('—');
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
