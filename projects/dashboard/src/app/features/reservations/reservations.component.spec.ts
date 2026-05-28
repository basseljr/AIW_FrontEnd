import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { ReservationsComponent } from './reservations.component';
import { ReservationsService } from '../../core/services/reservations.service';
import { BranchesService } from '../../core/services/branches.service';
import { Reservation, ReservationListResult } from '../../core/models/reservation.model';
import { BranchListItem } from '../../core/models/branch.model';

const mockReservation = (partial: Partial<Reservation> = {}): Reservation => ({
  id: '00000000-0000-0000-0000-000000000001',
  branchId: '00000000-0000-0000-0000-000000000002',
  guestName: 'Ahmed Al-Rashid',
  guestPhone: '+96599000001',
  guestEmail: null,
  reservationDate: new Date().toLocaleDateString('en-CA'),
  reservationTime: '19:00:00',
  partySize: 4,
  status: 'pending',
  specialRequests: null,
  internalNotes: null,
  confirmedAt: null,
  cancelledAt: null,
  ...partial,
});

const emptyResult: ReservationListResult = {
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: 100,
};

const populatedResult: ReservationListResult = {
  items: [mockReservation()],
  totalCount: 1,
  page: 1,
  pageSize: 100,
};

const mockBranch = (partial: Partial<BranchListItem> = {}): BranchListItem => ({
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  tenantId: '11111111-1111-1111-1111-111111111111',
  nameEn: 'Main Branch',
  nameAr: 'الفرع الرئيسي',
  address: null,
  phone: null,
  latitude: null,
  longitude: null,
  isActive: true,
  workingHoursJson: null,
  ...partial,
});

describe('ReservationsComponent', () => {
  let mockService: jasmine.SpyObj<ReservationsService>;
  let mockBranchesService: jasmine.SpyObj<BranchesService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('ReservationsService', [
      'getReservations',
      'create',
      'patchStatus',
      'delete',
      'getTables',
    ]);
    mockService.getReservations.and.returnValue(of(emptyResult));

    mockBranchesService = jasmine.createSpyObj('BranchesService', ['getAll']);
    mockBranchesService.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ReservationsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ReservationsService, useValue: mockService },
        { provide: BranchesService, useValue: mockBranchesService },
      ],
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(ReservationsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, component };
  }

  it('renders without error', () => {
    const { fixture } = createComponent();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('defaults to "today" tab', () => {
    const { component } = createComponent();
    expect(component.activeTab()).toBe('today');
  });

  it('switchTab() changes the active tab', () => {
    const { component } = createComponent();
    component.switchTab('upcoming');
    expect(component.activeTab()).toBe('upcoming');
  });

  it('switchTab() resets status filter', () => {
    const { component } = createComponent();
    component.statusFilter.set('confirmed');
    component.switchTab('past');
    expect(component.statusFilter()).toBe('');
  });

  it('calls getReservations on ngOnInit', () => {
    createComponent();
    expect(mockService.getReservations).toHaveBeenCalledOnceWith({ pageSize: 100 });
  });

  it('sets loading to false after successful fetch', fakeAsync(() => {
    mockService.getReservations.and.returnValue(of(emptyResult));
    const { component } = createComponent();
    tick();
    expect(component.loading()).toBeFalse();
  }));

  it('populates reservations from service response', fakeAsync(() => {
    mockService.getReservations.and.returnValue(of(populatedResult));
    const { component } = createComponent();
    tick();
    expect(component.reservations().length).toBe(1);
    expect(component.reservations()[0].guestName).toBe('Ahmed Al-Rashid');
  }));

  it('sets error signal when fetch fails', fakeAsync(() => {
    mockService.getReservations.and.returnValue(throwError(() => new Error('network')));
    const { component } = createComponent();
    tick();
    expect(component.error()).toBeTrue();
    expect(component.loading()).toBeFalse();
  }));

  it('shows add form when button state set to true', () => {
    const { component } = createComponent();
    expect(component.showAddForm()).toBeFalse();
    component.showAddForm.set(true);
    expect(component.showAddForm()).toBeTrue();
  });

  it('closeForm() resets showAddForm and clears formError', () => {
    const { component } = createComponent();
    component.showAddForm.set(true);
    component.formError.set('some error');
    component.closeForm();
    expect(component.showAddForm()).toBeFalse();
    expect(component.formError()).toBeNull();
  });

  it('updateStatus() calls service patchStatus with correct args', fakeAsync(() => {
    const updated = mockReservation({ status: 'confirmed' });
    mockService.patchStatus.and.returnValue(of(updated));

    const { component } = createComponent();
    component.reservations.set([mockReservation()]);

    component.updateStatus('00000000-0000-0000-0000-000000000001', 'confirmed');
    tick();

    expect(mockService.patchStatus).toHaveBeenCalledOnceWith(
      '00000000-0000-0000-0000-000000000001',
      { status: 'confirmed' },
    );
  }));

  it('updateStatus() updates the matching reservation in the list', fakeAsync(() => {
    const updated = mockReservation({ status: 'confirmed' });
    mockService.patchStatus.and.returnValue(of(updated));

    const { component } = createComponent();
    component.reservations.set([mockReservation()]);

    component.updateStatus('00000000-0000-0000-0000-000000000001', 'confirmed');
    tick();

    expect(component.reservations()[0].status).toBe('confirmed');
  }));

  it('clears updatingId after successful status update', fakeAsync(() => {
    mockService.patchStatus.and.returnValue(of(mockReservation({ status: 'confirmed' })));
    const { component } = createComponent();
    component.reservations.set([mockReservation()]);
    component.updateStatus('00000000-0000-0000-0000-000000000001', 'confirmed');
    tick();
    expect(component.updatingId()).toBeNull();
  }));

  it('clears updatingId on status update error', fakeAsync(() => {
    mockService.patchStatus.and.returnValue(throwError(() => new Error('fail')));
    const { component } = createComponent();
    component.reservations.set([mockReservation()]);
    component.updateStatus('00000000-0000-0000-0000-000000000001', 'confirmed');
    tick();
    expect(component.updatingId()).toBeNull();
  }));

  // ── Status transition guards ───────────────────────────────────────────────
  it('canConfirm() returns true only for pending', () => {
    const { component } = createComponent();
    expect(component.canConfirm('pending')).toBeTrue();
    expect(component.canConfirm('confirmed')).toBeFalse();
    expect(component.canConfirm('seated')).toBeFalse();
    expect(component.canConfirm('completed')).toBeFalse();
    expect(component.canConfirm('cancelled')).toBeFalse();
  });

  it('canSeat() returns true only for confirmed', () => {
    const { component } = createComponent();
    expect(component.canSeat('confirmed')).toBeTrue();
    expect(component.canSeat('pending')).toBeFalse();
    expect(component.canSeat('seated')).toBeFalse();
  });

  it('canComplete() returns true only for seated', () => {
    const { component } = createComponent();
    expect(component.canComplete('seated')).toBeTrue();
    expect(component.canComplete('confirmed')).toBeFalse();
    expect(component.canComplete('pending')).toBeFalse();
  });

  it('canCancel() returns true for pending and confirmed', () => {
    const { component } = createComponent();
    expect(component.canCancel('pending')).toBeTrue();
    expect(component.canCancel('confirmed')).toBeTrue();
    expect(component.canCancel('seated')).toBeFalse();
    expect(component.canCancel('completed')).toBeFalse();
    expect(component.canCancel('cancelled')).toBeFalse();
  });

  // ── Computed filteredItems ─────────────────────────────────────────────────
  it('filteredItems() filters by search on guestName', fakeAsync(() => {
    mockService.getReservations.and.returnValue(of(populatedResult));
    const { component } = createComponent();
    tick();

    component.searchInput.set('ahmed');
    expect(component.filteredItems().length).toBe(1);

    component.searchInput.set('ZZZZZ');
    expect(component.filteredItems().length).toBe(0);
  }));

  it('filteredItems() only shows today tab items with today date', fakeAsync(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const future = new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-CA');

    mockService.getReservations.and.returnValue(of({
      items: [
        mockReservation({ id: '1', reservationDate: today }),
        mockReservation({ id: '2', reservationDate: future }),
      ],
      totalCount: 2,
      page: 1,
      pageSize: 100,
    }));

    const { component } = createComponent();
    tick();

    component.activeTab.set('today');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].id).toBe('1');
  }));

  // ── formatDateTime helper ──────────────────────────────────────────────────
  it('formatDateTime() returns a non-empty string', () => {
    const { component } = createComponent();
    const result = component.formatDateTime('2026-05-28', '19:00:00');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('19:00');
  });

  // ── getStatusKey helper ────────────────────────────────────────────────────
  it('getStatusKey() maps known statuses to translation keys', () => {
    const { component } = createComponent();
    expect(component.getStatusKey('pending')).toBe('reservations_page.status_pending');
    expect(component.getStatusKey('confirmed')).toBe('reservations_page.status_confirmed');
    expect(component.getStatusKey('seated')).toBe('reservations_page.status_seated');
    expect(component.getStatusKey('completed')).toBe('reservations_page.status_completed');
    expect(component.getStatusKey('cancelled')).toBe('reservations_page.status_cancelled');
  });

  it('getStatusKey() returns the raw value for unknown statuses', () => {
    const { component } = createComponent();
    expect(component.getStatusKey('mystery_status')).toBe('mystery_status');
  });

  // ── Branch loading ─────────────────────────────────────────────────────────
  it('calls branchesService.getAll on ngOnInit', () => {
    createComponent();
    expect(mockBranchesService.getAll).toHaveBeenCalledTimes(1);
  });

  it('populates branches signal from service', fakeAsync(() => {
    mockBranchesService.getAll.and.returnValue(of([mockBranch()]));
    const { component } = createComponent();
    tick();
    expect(component.branches().length).toBe(1);
  }));

  it('auto-selects branch when only one active branch exists', fakeAsync(() => {
    mockBranchesService.getAll.and.returnValue(of([mockBranch()]));
    const { component } = createComponent();
    tick();
    expect(component.selectedBranchId()).toBe('aaaaaaaa-0000-0000-0000-000000000001');
  }));

  it('does not auto-select when multiple branches exist', fakeAsync(() => {
    mockBranchesService.getAll.and.returnValue(of([
      mockBranch({ id: 'aaaaaaaa-0000-0000-0000-000000000001' }),
      mockBranch({ id: 'aaaaaaaa-0000-0000-0000-000000000002', nameEn: 'Branch 2' }),
    ]));
    const { component } = createComponent();
    tick();
    expect(component.selectedBranchId()).toBe('');
  }));

  it('submitAdd() does nothing when branchId is not set', fakeAsync(() => {
    const { component } = createComponent();
    component.form.set({
      guestName: 'Test',
      guestPhone: '+966500000001',
      guestEmail: '',
      reservationDate: '2026-06-01',
      reservationTime: '19:00',
      partySize: 2,
      specialRequests: '',
      internalNotes: '',
    });
    component.selectedBranchId.set('');
    component.submitAdd();
    tick();
    expect(mockService.create).not.toHaveBeenCalled();
  }));

  it('submitAdd() calls service.create with the selected branchId', fakeAsync(() => {
    const created = mockReservation();
    mockService.create.and.returnValue(of(created));
    mockBranchesService.getAll.and.returnValue(of([mockBranch()]));

    const { component } = createComponent();
    tick();

    component.form.set({
      guestName: 'Test',
      guestPhone: '+966500000001',
      guestEmail: '',
      reservationDate: '2026-06-01',
      reservationTime: '19:00',
      partySize: 2,
      specialRequests: '',
      internalNotes: '',
    });
    component.submitAdd();
    tick();

    expect(mockService.create).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ branchId: 'aaaaaaaa-0000-0000-0000-000000000001' }),
    );
  }));
});
