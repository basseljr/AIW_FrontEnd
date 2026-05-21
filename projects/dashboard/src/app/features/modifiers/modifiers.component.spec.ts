import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { ModifiersService } from '../../core/services/modifiers.service';
import { ModifiersComponent } from './modifiers.component';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const MOCK_GROUPS = [
  {
    id: 'mg1',
    nameEn: 'Size',
    nameAr: 'الحجم',
    selectionType: 'single' as const,
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    sortOrder: 1,
    options: [
      { id: 'o1', nameEn: 'Small', nameAr: 'صغير', price: 0, sortOrder: 0 },
      { id: 'o2', nameEn: 'Large', nameAr: 'كبير', price: 0.5, sortOrder: 1 },
    ],
  },
];

function buildFixture() {
  const mockSvc = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of(MOCK_GROUPS)),
    create: jasmine.createSpy('create').and.returnValue(of(MOCK_GROUPS[0])),
    update: jasmine.createSpy('update').and.returnValue(of(MOCK_GROUPS[0])),
    delete: jasmine.createSpy('delete').and.returnValue(of(void 0)),
  };

  TestBed.configureTestingModule({
    imports: [
      ModifiersComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [{ provide: ModifiersService, useValue: mockSvc }],
  });

  return { fixture: TestBed.createComponent(ModifiersComponent), mockSvc };
}

describe('ModifiersComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads modifier groups on init', fakeAsync(() => {
    const { fixture, mockSvc } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockSvc.getAll).toHaveBeenCalled();
    expect(fixture.componentInstance.items().length).toBe(1);
  }));

  it('openAdd sets showForm to true', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.openAdd();
    expect(fixture.componentInstance.showForm()).toBeTrue();
  }));

  it('addOption increases options length', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.openAdd();
    fixture.componentInstance.addOption();
    expect(fixture.componentInstance.form().options.length).toBe(1);
  }));

  it('removeOption decreases options length', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.openAdd();
    fixture.componentInstance.addOption();
    fixture.componentInstance.addOption();
    fixture.componentInstance.removeOption(0);
    expect(fixture.componentInstance.form().options.length).toBe(1);
  }));
});
