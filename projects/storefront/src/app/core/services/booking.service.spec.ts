import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { provideApiBaseUrl } from '@shared/api';
import {
  BookingService,
  StaffMember,
  AvailabilityResponse,
  BookingConfirmation,
  CreateBookingRequest,
} from './booking.service';

const API_BASE = 'http://localhost:5000';

function mockStaff(): StaffMember[] {
  return [
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
}

function mockAvailability(): AvailabilityResponse {
  return {
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
        startTime: '10:00',
        endTime: '11:00',
        staffId: 'staff-1',
        staffFullNameEn: 'Sara Al-Mansouri',
        staffFullNameAr: 'سارة المنصوري',
      },
    ],
  };
}

function mockConfirmation(): BookingConfirmation {
  return {
    id: 'booking-uuid-1',
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
    createdAt: '2026-06-01T10:00:00Z',
  };
}

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiBaseUrl(API_BASE),
        BookingService,
      ],
    });
    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── getStaffForService ────────────────────────────────────────────────────

  it('getStaffForService() calls the correct URL', () => {
    const staff = mockStaff();
    service.getStaffForService('classic-facial').subscribe((result) => {
      expect(result).toEqual(staff);
    });

    const req = httpMock.expectOne(
      `${API_BASE}/storefront/services/classic-facial/staff`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(staff);
  });

  it('getStaffForService() encodes slugs with spaces', () => {
    service.getStaffForService('swedish massage').subscribe();

    const req = httpMock.expectOne(
      `${API_BASE}/storefront/services/swedish%20massage/staff`,
    );
    req.flush([]);
  });

  // ── getAvailability ───────────────────────────────────────────────────────

  it('getAvailability() sends required query params', () => {
    const availability = mockAvailability();
    service
      .getAvailability('svc-1', 'branch-1', '2026-06-10')
      .subscribe((result) => {
        expect(result.slots.length).toBe(2);
      });

    const req = httpMock.expectOne((r) =>
      r.url === `${API_BASE}/storefront/bookings/availability`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('serviceId')).toBe('svc-1');
    expect(req.request.params.get('branchId')).toBe('branch-1');
    expect(req.request.params.get('date')).toBe('2026-06-10');
    expect(req.request.params.has('staffId')).toBeFalse();
    req.flush(availability);
  });

  it('getAvailability() appends staffId when provided', () => {
    service
      .getAvailability('svc-1', 'branch-1', '2026-06-10', 'staff-1')
      .subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === `${API_BASE}/storefront/bookings/availability`,
    );
    expect(req.request.params.get('staffId')).toBe('staff-1');
    req.flush(mockAvailability());
  });

  it('getAvailability() does not append staffId when null', () => {
    service.getAvailability('svc-1', 'branch-1', '2026-06-10', null).subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === `${API_BASE}/storefront/bookings/availability`,
    );
    expect(req.request.params.has('staffId')).toBeFalse();
    req.flush(mockAvailability());
  });

  // ── createBooking ─────────────────────────────────────────────────────────

  it('createBooking() POSTs to /storefront/bookings', () => {
    const request: CreateBookingRequest = {
      branchId: 'branch-1',
      serviceId: 'svc-1',
      staffId: 'staff-1',
      guestName: 'Test Guest',
      guestEmail: 'test@example.com',
      guestPhone: '+96512345678',
      appointmentDate: '2026-06-10T00:00:00',
      startTime: '09:00:00',
      customerNotes: null,
    };

    const confirmation = mockConfirmation();
    service.createBooking(request).subscribe((result) => {
      expect(result.id).toBe('booking-uuid-1');
    });

    const req = httpMock.expectOne(`${API_BASE}/storefront/bookings`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(confirmation);
  });

  it('createBooking() passes staffId as null for "no preference"', () => {
    const request: CreateBookingRequest = {
      branchId: 'branch-1',
      serviceId: 'svc-1',
      staffId: null,
      guestName: 'Test Guest',
      guestEmail: 'test@example.com',
      guestPhone: '+96512345678',
      appointmentDate: '2026-06-10T00:00:00',
      startTime: '09:00:00',
    };

    service.createBooking(request).subscribe();

    const req = httpMock.expectOne(`${API_BASE}/storefront/bookings`);
    expect(req.request.body.staffId).toBeNull();
    req.flush(mockConfirmation());
  });

  // ── getBookingById ────────────────────────────────────────────────────────

  it('getBookingById() calls GET /storefront/bookings/{id}', () => {
    const confirmation = mockConfirmation();
    service.getBookingById('booking-uuid-1').subscribe((result) => {
      expect(result).toEqual(confirmation);
    });

    const req = httpMock.expectOne(
      `${API_BASE}/storefront/bookings/booking-uuid-1`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(confirmation);
  });
});
