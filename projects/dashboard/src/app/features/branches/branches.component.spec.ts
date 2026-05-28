import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { BranchesService } from '../../core/services/branches.service';
import { BranchesComponent } from './branches.component';
import { BranchListItem } from '../../core/models/branch.model';

class MockLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

const MOCK_BRANCH: BranchListItem = {
  id: '22222222-2222-2222-2222-222222222222',
  tenantId: '11111111-1111-1111-1111-111111111111',
  nameEn: 'Main Branch',
  nameAr: 'الفرع الرئيسي',
  address: 'Kuwait City',
  phone: '+96512345678',
  latitude: 29.37,
  longitude: 47.97,
  isActive: true,
  workingHoursJson: null,
};

function buildFixture(branches: BranchListItem[] = [MOCK_BRANCH]) {
  const mockService = {
    getAll: jasmine.createSpy('getAll').and.returnValue(of(branches)),
    getById: jasmine.createSpy('getById').and.returnValue(of(MOCK_BRANCH)),
    create: jasmine.createSpy('create').and.returnValue(of({ ...MOCK_BRANCH, id: 'new-id' })),
    update: jasmine.createSpy('update').and.returnValue(of(MOCK_BRANCH)),
    delete: jasmine.createSpy('delete').and.returnValue(of(undefined)),
  };

  TestBed.configureTestingModule({
    imports: [
      BranchesComponent,
      TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
    ],
    providers: [
      { provide: BranchesService, useValue: mockService },
    ],
  });

  return { fixture: TestBed.createComponent(BranchesComponent), mockService };
}

describe('BranchesComponent', () => {
  it('renders without error', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  }));

  it('loads branches list on init', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(mockService.getAll).toHaveBeenCalled();
    expect(fixture.componentInstance.items().length).toBe(1);
    expect(fixture.componentInstance.items()[0].id).toBe(MOCK_BRANCH.id);
  }));

  it('loading signal is false after data arrives', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.loading()).toBeFalse();
  }));

  it('sets error signal when load fails', fakeAsync(() => {
    const mockService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(throwError(() => new Error('network'))),
      create: jasmine.createSpy('create'),
      update: jasmine.createSpy('update'),
      delete: jasmine.createSpy('delete'),
    };

    TestBed.configureTestingModule({
      imports: [
        BranchesComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
      ],
      providers: [{ provide: BranchesService, useValue: mockService }],
    });

    const fixture = TestBed.createComponent(BranchesComponent);
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.error()).toBeTrue();
  }));

  it('opens add panel when Add Branch button clicked', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    fixture.componentInstance.openAdd();
    expect(fixture.componentInstance.panelOpen()).toBeTrue();
    expect(fixture.componentInstance.panelMode()).toBe('form');
    expect(fixture.componentInstance.isEditing()).toBeFalse();
  }));

  it('opens edit panel with branch data', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();

    fixture.componentInstance.openEdit(MOCK_BRANCH);
    expect(fixture.componentInstance.panelOpen()).toBeTrue();
    expect(fixture.componentInstance.isEditing()).toBeTrue();
    expect(fixture.componentInstance.form().nameEn).toBe(MOCK_BRANCH.nameEn);
    expect(fixture.componentInstance.form().nameAr).toBe(MOCK_BRANCH.nameAr);
  }));

  it('calls createBranch on save when adding', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges();
    tick();

    fixture.componentInstance.openAdd();
    fixture.componentInstance.patchForm({ nameEn: 'New Branch', nameAr: 'فرع جديد' });
    fixture.componentInstance.saveForm();
    tick();

    expect(mockService.create).toHaveBeenCalled();
    const callArg = mockService.create.calls.mostRecent().args[0];
    expect(callArg.nameEn).toBe('New Branch');
    tick(3501);
  }));

  it('does not call create when nameEn is empty', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges();
    tick();

    fixture.componentInstance.openAdd();
    fixture.componentInstance.patchForm({ nameEn: '', nameAr: 'فرع' });
    fixture.componentInstance.saveForm();
    tick();

    expect(mockService.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.submitted()).toBeTrue();
  }));

  it('calls update on service when editing', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges();
    tick();

    fixture.componentInstance.openEdit(MOCK_BRANCH);
    fixture.componentInstance.saveForm();
    tick();

    expect(mockService.update).toHaveBeenCalledWith(
      MOCK_BRANCH.id,
      jasmine.objectContaining({ nameEn: MOCK_BRANCH.nameEn }),
    );
    tick(3501);
  }));

  it('sets deleteTarget when confirmDelete is called', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();

    fixture.componentInstance.confirmDelete(MOCK_BRANCH);
    expect(fixture.componentInstance.deleteTarget()).toBe(MOCK_BRANCH);
  }));

  it('clears deleteTarget on cancelDelete', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();

    fixture.componentInstance.confirmDelete(MOCK_BRANCH);
    fixture.componentInstance.cancelDelete();
    expect(fixture.componentInstance.deleteTarget()).toBeNull();
  }));

  it('calls delete service and removes branch from list', fakeAsync(() => {
    const { fixture, mockService } = buildFixture();
    fixture.detectChanges();
    tick();

    fixture.componentInstance.confirmDelete(MOCK_BRANCH);
    fixture.componentInstance.executeDelete();
    tick();

    expect(mockService.delete).toHaveBeenCalledWith(MOCK_BRANCH.id);
    expect(fixture.componentInstance.items().length).toBe(0);
    expect(fixture.componentInstance.deleteTarget()).toBeNull();
    tick(3501);
  }));

  it('shows delete error when delete fails', fakeAsync(() => {
    const mockService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([MOCK_BRANCH])),
      create: jasmine.createSpy('create'),
      update: jasmine.createSpy('update'),
      delete: jasmine.createSpy('delete').and.returnValue(throwError(() => new Error('server error'))),
    };

    TestBed.configureTestingModule({
      imports: [
        BranchesComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: MockLoader } }),
      ],
      providers: [{ provide: BranchesService, useValue: mockService }],
    });

    const fixture = TestBed.createComponent(BranchesComponent);
    fixture.detectChanges();
    tick();

    fixture.componentInstance.confirmDelete(MOCK_BRANCH);
    fixture.componentInstance.executeDelete();
    tick();

    expect(fixture.componentInstance.deleteError()).toBeTruthy();
    expect(fixture.componentInstance.deleteTarget()).not.toBeNull();
  }));

  it('openDetail sets selectedBranch and panelMode to detail', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();

    fixture.componentInstance.selectBranch(MOCK_BRANCH);
    expect(fixture.componentInstance.selectedBranch()).toBe(MOCK_BRANCH);
    expect(fixture.componentInstance.panelMode()).toBe('detail');
  }));

  it('closePanel resets panelOpen', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();

    fixture.componentInstance.openAdd();
    expect(fixture.componentInstance.panelOpen()).toBeTrue();
    fixture.componentInstance.closePanel();
    expect(fixture.componentInstance.panelOpen()).toBeFalse();
  }));

  it('dayKey returns correct abbreviation', () => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    expect(fixture.componentInstance.dayKey(0)).toBe('sun');
    expect(fixture.componentInstance.dayKey(1)).toBe('mon');
    expect(fixture.componentInstance.dayKey(6)).toBe('sat');
  });

  it('toggleDayClosed flips isClosed for a day', fakeAsync(() => {
    const { fixture } = buildFixture();
    fixture.detectChanges();
    tick();

    fixture.componentInstance.openAdd();
    const initialClosed = fixture.componentInstance.form().workingHours[0].isClosed;
    fixture.componentInstance.toggleDayClosed(0);
    expect(fixture.componentInstance.form().workingHours[0].isClosed).toBe(!initialClosed);
  }));
});
