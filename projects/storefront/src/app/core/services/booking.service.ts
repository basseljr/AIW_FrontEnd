import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/api';

// ── Domain models ────────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  fullNameEn: string;
  fullNameAr: string;
  jobTitleEn: string | null;
  jobTitleAr: string | null;
  photoUrl: string | null;
  status: string;
}

export interface TimeSlot {
  startTime: string;   // "HH:MM" (24-hour)
  endTime: string;     // "HH:MM"
  staffId: string;
  staffFullNameEn: string;
  staffFullNameAr: string;
}

export interface AvailabilityResponse {
  date: string;        // YYYY-MM-DD
  slots: TimeSlot[];
}

export interface CreateBookingRequest {
  branchId: string;
  serviceId: string;
  staffId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  appointmentDate: string;   // YYYY-MM-DD
  startTime: string;         // "HH:MM:SS" (TimeSpan-compatible)
  customerNotes?: string | null;
}

export interface BookingConfirmation {
  id: string;
  branchId: string;
  serviceId: string;
  serviceNameEn: string;
  serviceNameAr: string;
  staffId: string | null;
  staffFullNameEn: string | null;
  customerId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  servicePrice: number;
  depositAmount: number;
  balanceDue: number;
  status: string;
  paymentStatus: string;
  customerNotes: string | null;
  createdAt: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * GET /api/v1/storefront/services/{serviceSlug}/staff
   * Returns staff members who can perform the given service.
   */
  getStaffForService(serviceSlug: string): Observable<StaffMember[]> {
    return this.http.get<StaffMember[]>(
      `${this.baseUrl}/storefront/services/${encodeURIComponent(serviceSlug)}/staff`,
      { withCredentials: true },
    );
  }

  /**
   * GET /api/v1/storefront/bookings/availability
   * Returns available time slots for a service/date combination.
   */
  getAvailability(
    serviceId: string,
    branchId: string,
    date: string,
    staffId?: string | null,
  ): Observable<AvailabilityResponse> {
    let params = new HttpParams()
      .set('serviceId', serviceId)
      .set('branchId', branchId)
      .set('date', date);

    if (staffId) {
      params = params.set('staffId', staffId);
    }

    return this.http.get<AvailabilityResponse>(
      `${this.baseUrl}/storefront/bookings/availability`,
      { params, withCredentials: true },
    );
  }

  /**
   * POST /api/v1/storefront/bookings
   * Create a booking (guest or authenticated customer).
   */
  createBooking(request: CreateBookingRequest): Observable<BookingConfirmation> {
    return this.http.post<BookingConfirmation>(
      `${this.baseUrl}/storefront/bookings`,
      request,
      { withCredentials: true },
    );
  }

  /**
   * GET /api/v1/storefront/bookings/{id}
   * Retrieve a booking by its ID — used for the confirmation screen.
   */
  getBookingById(id: string): Observable<BookingConfirmation> {
    return this.http.get<BookingConfirmation>(
      `${this.baseUrl}/storefront/bookings/${id}`,
      { withCredentials: true },
    );
  }
}
