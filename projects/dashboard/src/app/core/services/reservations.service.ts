import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  Reservation,
  ReservationListResult,
  ReservationFilters,
  CreateReservationRequest,
  UpdateReservationStatusRequest,
  RestaurantTable,
} from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getReservations(filters: ReservationFilters = {}): Observable<ReservationListResult> {
    let params = new HttpParams();
    if (filters.status)    params = params.set('status', filters.status);
    if (filters.fromDate)  params = params.set('fromDate', filters.fromDate);
    if (filters.toDate)    params = params.set('toDate', filters.toDate);
    if (filters.branchId)  params = params.set('branchId', filters.branchId);
    if (filters.page != null) params = params.set('page', String(filters.page));
    if (filters.pageSize != null) params = params.set('pageSize', String(filters.pageSize));

    return this.http.get<ReservationListResult>(
      `${this.baseUrl}/reservations`,
      { params, withCredentials: true },
    );
  }

  create(body: CreateReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(
      `${this.baseUrl}/reservations`,
      body,
      { withCredentials: true },
    );
  }

  patchStatus(id: string, body: UpdateReservationStatusRequest): Observable<Reservation> {
    return this.http.put<Reservation>(
      `${this.baseUrl}/reservations/${id}/status`,
      body,
      { withCredentials: true },
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/reservations/${id}`,
      { withCredentials: true },
    );
  }

  getTables(branchId?: string): Observable<{ items: RestaurantTable[] }> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);

    return this.http.get<{ items: RestaurantTable[] }>(
      `${this.baseUrl}/tables`,
      { params, withCredentials: true },
    );
  }
}
