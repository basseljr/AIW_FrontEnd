import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  OrderListResult,
  OrderDetail,
  OrderFilters,
  UpdateOrderStatusRequest,
} from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getOrders(filters: OrderFilters = {}): Observable<OrderListResult> {
    let params = new HttpParams();
    if (filters.search)        params = params.set('search', filters.search);
    if (filters.status)        params = params.set('status', filters.status);
    if (filters.orderType)     params = params.set('orderType', filters.orderType);
    if (filters.paymentStatus) params = params.set('paymentStatus', filters.paymentStatus);
    if (filters.branchId)      params = params.set('branchId', filters.branchId);
    if (filters.fromUtc)       params = params.set('fromUtc', filters.fromUtc);
    if (filters.toUtc)         params = params.set('toUtc', filters.toUtc);
    if (filters.cursor)        params = params.set('cursor', filters.cursor);
    if (filters.limit != null) params = params.set('limit', String(filters.limit));

    return this.http.get<OrderListResult>(
      `${this.baseUrl}/tenant-admin/orders`,
      { params, withCredentials: true },
    );
  }

  getOrderDetail(orderId: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(
      `${this.baseUrl}/tenant-admin/orders/${orderId}`,
      { withCredentials: true },
    );
  }

  updateOrderStatus(
    orderId: string,
    request: UpdateOrderStatusRequest,
  ): Observable<OrderDetail> {
    return this.http.patch<OrderDetail>(
      `${this.baseUrl}/tenant-admin/orders/${orderId}/status`,
      request,
      { withCredentials: true },
    );
  }
}
