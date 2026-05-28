import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  CustomerListResult,
  CustomerDetail,
  BlacklistedCustomer,
  CustomerNote,
} from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getCustomers(opts: { search?: string; page?: number; pageSize?: number } = {}): Observable<CustomerListResult> {
    let params = new HttpParams();
    if (opts.search)    params = params.set('search', opts.search);
    if (opts.page)      params = params.set('page', String(opts.page));
    if (opts.pageSize)  params = params.set('pageSize', String(opts.pageSize));

    return this.http.get<CustomerListResult>(
      `${this.baseUrl}/tenant-admin/customers`,
      { params, withCredentials: true },
    );
  }

  getCustomerDetail(id: string): Observable<CustomerDetail> {
    return this.http.get<CustomerDetail>(
      `${this.baseUrl}/tenant-admin/customers/${id}`,
      { withCredentials: true },
    );
  }

  getBlacklist(): Observable<BlacklistedCustomer[]> {
    return this.http.get<BlacklistedCustomer[]>(
      `${this.baseUrl}/tenant-admin/customers/blacklist`,
      { withCredentials: true },
    );
  }

  addToBlacklist(id: string, reason: string): Observable<unknown> {
    return this.http.post(
      `${this.baseUrl}/tenant-admin/customers/${id}/blacklist`,
      { reason },
      { withCredentials: true },
    );
  }

  removeFromBlacklist(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/tenant-admin/customers/${id}/blacklist`,
      { withCredentials: true },
    );
  }

  getNotes(id: string): Observable<CustomerNote[]> {
    return this.http.get<CustomerNote[]>(
      `${this.baseUrl}/tenant-admin/customers/${id}/notes`,
      { withCredentials: true },
    );
  }

  addNote(id: string, text: string): Observable<CustomerNote> {
    return this.http.post<CustomerNote>(
      `${this.baseUrl}/tenant-admin/customers/${id}/notes`,
      { text },
      { withCredentials: true },
    );
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/tenant-admin/customers/export`,
      { withCredentials: true, responseType: 'blob' },
    );
  }
}
