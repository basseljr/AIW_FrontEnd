import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  CustomerProfile,
  CustomerAddress,
  OrderHistoryResponse,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  updateProfile(data: {
    fullName: string;
    phone: string | null;
    phoneCountryCode: string;
  }): Observable<CustomerProfile> {
    return this.http.put<CustomerProfile>(
      `${this.baseUrl}/storefront/account/profile`,
      data,
      { withCredentials: true },
    );
  }

  getAddresses(): Observable<CustomerAddress[]> {
    return this.http.get<CustomerAddress[]>(
      `${this.baseUrl}/storefront/account/addresses`,
      { withCredentials: true },
    );
  }

  createAddress(
    data: Omit<CustomerAddress, 'id' | 'customerId'>,
  ): Observable<CustomerAddress> {
    return this.http.post<CustomerAddress>(
      `${this.baseUrl}/storefront/account/addresses`,
      data,
      { withCredentials: true },
    );
  }

  updateAddress(
    id: string,
    data: Omit<CustomerAddress, 'id' | 'customerId'>,
  ): Observable<CustomerAddress> {
    return this.http.put<CustomerAddress>(
      `${this.baseUrl}/storefront/account/addresses/${id}`,
      data,
      { withCredentials: true },
    );
  }

  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/storefront/account/addresses/${id}`,
      { withCredentials: true },
    );
  }

  getOrders(page: number, pageSize: number): Observable<OrderHistoryResponse> {
    return this.http.get<OrderHistoryResponse>(
      `${this.baseUrl}/storefront/account/orders`,
      { params: { page, pageSize }, withCredentials: true },
    );
  }

  requestDeletion(): Observable<{ message: string; scheduledAt: string }> {
    return this.http.post<{ message: string; scheduledAt: string }>(
      `${this.baseUrl}/storefront/account/deletion-request`,
      {},
      { withCredentials: true },
    );
  }
}
