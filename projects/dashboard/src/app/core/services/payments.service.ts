import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  PaymentFilters,
  PaymentListResult,
  PaymentTransactionDetail,
} from '../models/payments.model';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getPayments(filters: PaymentFilters): Observable<PaymentListResult> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('pageSize', filters.pageSize.toString());

    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.method) params = params.set('method', filters.method);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<PaymentListResult>(
      `${this.baseUrl}/tenant-admin/payments`,
      { params, withCredentials: true },
    );
  }

  getPaymentDetail(id: string): Observable<PaymentTransactionDetail> {
    return this.http.get<PaymentTransactionDetail>(
      `${this.baseUrl}/tenant-admin/payments/${id}`,
      { withCredentials: true },
    );
  }
}
