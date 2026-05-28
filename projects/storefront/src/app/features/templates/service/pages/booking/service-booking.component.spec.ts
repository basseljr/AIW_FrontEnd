import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { provideApiBaseUrl } from '@shared/api';
import { ServiceBookingComponent, BookingState } from './service-booking.component';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { BookingService, StaffMember, AvailabilityResponse, BookingConfirmation } from '../../../../../core/services/booking.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { BranchesService } from '../../../../../core/services/branches.service';
import { CatalogItemDetail } from '../../../../../core/models/catalog.model';

// ── Test fixtures ──────────────────────────────────────────────────────────

const mockServiceDetail: CatalogItemDetail = {
  id: 'svc-1',
  nameEn: 'Classic Facial',
  nameAr: 'فيشل كلاسيك',
  descriptionEn: 'A rejuvenating facial.',
  descriptionAr: 'فيشل منعش.',
  price: 15,
  durationMinutes: 60,
  imageUrl: undefined,
  slug: 'classic-facial',
  isAvailable: true,
  isPublished: true,
};

const mockStaff: StaffMember[] = [
  {
    id: 'staff-1',
    fullNameEn: 'Sara Al-Mansouri',
    fullNameAr: 'سارة المنصوري',
    jobTitleEn: 'Senior Esthetician',
    jobTitleAr: 'خبيرة تجميل أولى',
    photoUrl: null,
    status: 'active',
  },
];

const mockAvailability: AvailabilityResponse = {
  date: '2026-06-10',
  slots: [
    {
      startTime: '09:00',
      endTime: '10:00',
      staffId: 'staff-1',
      staffFullNameEn: 'Sara Al-Mansouri',
      staffFullNameAr: 'سارة المنصوري',
    },
    {
      startTime: '10:30',
      endTime: '11:30',
      staffId: 'staff-1',
      staffFullNameEn: 'Sara Al-Mansouri',
      staffFullNameAr: 'سارة المنصوري',
    },
  ],
};

const mockConfirmation: BookingConfirmation = {
  id: 'booking-uuid-abc',
  branchId: 'branch-1',
  serviceId: 'svc-1',
  serviceNameEn: 'Classic Facial',
  serviceNameAr: 'فيشل كلاسيك',
  staffId: 'staff-1',
  staffFullNameEn: 'Sara Al-Mansouri',
  customerId: null,
  guestName: 'Test Guest',
  guestEmail: 'test@example.com',
  guestPhone: '+96512345678',
  appointmentDate: '2026-06-10',
  startTime: '09:00:00',
  endTime: '10:00:00',
  durationMinutes: 60,
  servicePrice: 15,
  depositAmount: 0,
  balanceDue: 15,
  status: 'pending',
  paymentStatus: 'unpaid',
  customerNotes: null,
  createdAt: '2026-06-01T00:00:00Z',
};

// ── Setup ──────────────────────────────────────────────────────────────────

function createComponent() {
  const catalogServiceSpy = jasmine.createSpyObj<CatalogService>('CatalogService', ['getItemDetail']);
  const bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService', [
    'getStaffForService',
    'getAvailability',
    'createBooking',
    'getBookingById',
  ]);
  const authServiceStub = {
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    currentUser: jasmine.createSpy('currentUser').and.returnValue(null),
  };
  const branchesServiceSpy = jasmine.createSpyObj<BranchesService>('BranchesService', ['getBranches']);

  catalogServiceSpy.getItemDetail.and.returnValue(of(mockServiceDetail));
  bookingServiceSpy.getStaffForService.and.returnValue(of(mockStaff));
  bookingServiceSpy.getAvailability.and.returnValue(of(mockAvailability));
  bookingServiceSpy.createBooking.and.returnValue(of(mockConfirmation));
  branchesServiceSpy.getBranches.and.returnValue(of([{ id: 'branch-1', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي', address: null, phone: null, workingHoursJson: null }]));

  TestBed.configureTestingModule({
    imports: [
      ServiceBookingComponent,
      TranslateModule.forRoot(),
    ],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideApiBaseUrl('http://localhost:5000'),
      { provide: CatalogService, useValue: catalogServiceSpy },
      { provide: BookingService, useValue: bookingServiceSpy },
      { provide: AuthService, useValue: authServiceStub },
      { provide: BranchesService, useValue: branchesServiceSpy },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({ serviceSlug: 'classic-facial' }),
          },
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(ServiceBookingComponent);
  const component = fixture.componentInstance;

  return { fixture, component, catalogServiceSpy, bookingServiceSpy, branchesServiceSpy };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ServiceBookingComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ── Initialization ────────────────────────────────────────────────────────

  it('should create', () => {
    const { fixture } = createComponent();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit() reads serviceSlug from route params', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    expect(component.serviceSlug).toBe('classic-facial');
  });

  it('ngOnInit() loads service details via CatalogService', () => {
    const { component, fixture, catalogServiceSpy } = createComponent();
    fixture.detectChanges();

    expect(catalogServiceSpy.getItemDetail).toHaveBeenCalledWith('', 'classic-facial');
    expect(component.bookingState().service).toEqual(mockServiceDetail);
    expect(component.loadingService()).toBeFalse();
  });

  it('ngOnInit() resolves branchId from first branch', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    expect(component.bookingState().branchId).toBe('branch-1');
  });

  it('initial step is 1', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(1);
  });

  // ── Step navigation ───────────────────────────────────────────────────────

  it('goToStep() advances to the target step', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    component.goToStep(2);
    expect(component.currentStep()).toBe(2);
  });

  it('goToStep(2) triggers staff fetch if staff list is empty', () => {
    const { component, fixture, bookingServiceSpy } = createComponent();
    fixture.detectChanges();
    expect(component.staffList().length).toBe(0);

    component.goToStep(2);
    expect(bookingServiceSpy.getStaffForService).toHaveBeenCalledWith('classic-facial');
    expect(component.staffList()).toEqual(mockStaff);
  });

  it('goToStep(2) does NOT re-fetch staff when already loaded', () => {
    const { component, fixture, bookingServiceSpy } = createComponent();
    fixture.detectChanges();
    // Load staff manually
    component['staffList'].set(mockStaff);
    bookingServiceSpy.getStaffForService.calls.reset();

    component.goToStep(2);
    expect(bookingServiceSpy.getStaffForService).not.toHaveBeenCalled();
  });

  it('goToStep(5) clears booking error', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    component['bookingError'].set('Some error');
    component.goToStep(5);
    expect(component.bookingError()).toBeNull();
  });

  // ── Staff selection ───────────────────────────────────────────────────────

  it('selectStaff() updates selectedStaffId', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    component.selectStaff('staff-1');
    expect(component.bookingState().selectedStaffId).toBe('staff-1');
  });

  it('selectStaff(null) represents "no preference"', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    component.selectStaff('staff-1');
    component.selectStaff(null);
    expect(component.bookingState().selectedStaffId).toBeNull();
  });

  it('selectStaff() clears previously selected slot', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    component['_patchState']({ selectedSlot: mockAvailability.slots[0] });
    component.selectStaff('staff-2');
    expect(component.bookingState().selectedSlot).toBeNull();
  });

  // ── Date/slot selection ───────────────────────────────────────────────────

  it('onDateChange() updates selectedDate and fetches slots', () => {
    const { component, fixture, bookingServiceSpy } = createComponent();
    fixture.detectChanges();
    component['_patchState']({ serviceId: 'svc-1', branchId: 'branch-1' });

    const fakeEvent = { target: { value: '2026-06-10' } } as unknown as Event;
    component.onDateChange(fakeEvent);

    expect(component.bookingState().selectedDate).toBe('2026-06-10');
    expect(bookingServiceSpy.getAvailability).toHaveBeenCalledWith(
      'svc-1', 'branch-1', '2026-06-10', null,
    );
    expect(component.availableSlots()).toEqual(mockAvailability.slots);
  });

  it('onDateChange() clears previously selected slot', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    component['_patchState']({ selectedSlot: mockAvailability.slots[0] });

    const fakeEvent = { target: { value: '2026-06-11' } } as unknown as Event;
    component.onDateChange(fakeEvent);
    expect(component.bookingState().selectedSlot).toBeNull();
  });

  it('selectSlot() updates selectedSlot', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    component.selectSlot(mockAvailability.slots[0]);
    expect(component.bookingState().selectedSlot).toEqual(mockAvailability.slots[0]);
  });

  // ── Guest details validation ──────────────────────────────────────────────

  it('guestDetailsValid() is false when fields are empty (guest mode)', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    // Auth is already stubbed as not authenticated
    expect(component.guestDetailsValid()).toBeFalse();
  });

  it('guestDetailsValid() is true when all guest fields are filled', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    component.guestName = 'Test Guest';
    component.guestEmail = 'test@example.com';
    component.guestPhone = '+96512345678';
    expect(component.guestDetailsValid()).toBeTrue();
  });

  // ── Booking submission ────────────────────────────────────────────────────

  it('confirmBooking() calls BookingService.createBooking with correct payload', () => {
    const { component, fixture, bookingServiceSpy } = createComponent();
    fixture.detectChanges();

    // Set up complete state
    component['_patchState']({
      service: mockServiceDetail,
      serviceId: 'svc-1',
      branchId: 'branch-1',
      selectedDate: '2026-06-10',
      selectedSlot: mockAvailability.slots[0],
      guestName: 'Test Guest',
      guestEmail: 'test@example.com',
      guestPhone: '+96512345678',
    });

    component.confirmBooking();

    expect(bookingServiceSpy.createBooking).toHaveBeenCalledWith(
      jasmine.objectContaining({
        branchId: 'branch-1',
        serviceId: 'svc-1',
        startTime: '09:00:00',
      }),
    );
  });

  it('confirmBooking() sets bookingSuccess on success', fakeAsync(() => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();

    component['_patchState']({
      service: mockServiceDetail,
      serviceId: 'svc-1',
      branchId: 'branch-1',
      selectedDate: '2026-06-10',
      selectedSlot: mockAvailability.slots[0],
      guestName: 'Test Guest',
      guestEmail: 'test@example.com',
      guestPhone: '+96512345678',
    });

    component.confirmBooking();
    tick();

    expect(component.bookingSuccess()).toBeTrue();
    expect(component.confirmedBookingId()).toBe('booking-uuid-abc');
    expect(component.submitting()).toBeFalse();
  }));

  it('confirmBooking() sets bookingError on failure', fakeAsync(() => {
    const { component, fixture, bookingServiceSpy } = createComponent();
    fixture.detectChanges();

    bookingServiceSpy.createBooking.and.returnValue(
      throwError(() => ({ error: { message: 'Slot no longer available.' } })),
    );

    component['_patchState']({
      service: mockServiceDetail,
      serviceId: 'svc-1',
      branchId: 'branch-1',
      selectedDate: '2026-06-10',
      selectedSlot: mockAvailability.slots[0],
      guestName: 'Test Guest',
      guestEmail: 'test@example.com',
      guestPhone: '+96512345678',
    });

    component.confirmBooking();
    tick();

    expect(component.bookingError()).toBe('Slot no longer available.');
    expect(component.bookingSuccess()).toBeFalse();
    expect(component.submitting()).toBeFalse();
  }));

  it('confirmBooking() does nothing if required state is missing', () => {
    const { component, fixture, bookingServiceSpy } = createComponent();
    fixture.detectChanges();
    // No service/slot set
    component.confirmBooking();
    expect(bookingServiceSpy.createBooking).not.toHaveBeenCalled();
  });

  // ── Utilities ─────────────────────────────────────────────────────────────

  it('formatTime() converts 24-hour time to 12-hour AM/PM', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    expect(component.formatTime('09:00')).toBe('9:00 AM');
    expect(component.formatTime('13:30')).toBe('1:30 PM');
    expect(component.formatTime('00:00')).toBe('12:00 AM');
    expect(component.formatTime('12:00')).toBe('12:00 PM');
  });

  it('avatarInitials() returns first two initials', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    expect(component.avatarInitials(mockStaff[0])).toBe('SA');
  });

  // ── selectedStaffName computed ────────────────────────────────────────────

  it('selectedStaffName() returns EN name when lang is en', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    component['staffList'].set(mockStaff);
    component.selectStaff('staff-1');
    expect(component.selectedStaffName()).toBe('Sara Al-Mansouri');
  });

  it('selectedStaffName() returns empty string when no staff selected', () => {
    const { component, fixture } = createComponent();
    fixture.detectChanges();
    component['staffList'].set(mockStaff);
    component.selectStaff(null);
    expect(component.selectedStaffName()).toBe('');
  });
});
