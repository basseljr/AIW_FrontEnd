import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  AnalyticsSummary,
  CustomersDetail,
  OrdersDetail,
  OrdersByStatus,
  ProductsDetail,
  RevenueByPaymentMethod,
  RevenueDetail,
  SalesByPeriodPoint,
  TopProduct,
} from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private buildParams(from?: Date, to?: Date, extras?: Record<string, string>): HttpParams {
    let params = new HttpParams();
    if (from) params = params.set('fromUtc', from.toISOString());
    if (to) params = params.set('toUtc', to.toISOString());
    if (extras) {
      Object.entries(extras).forEach(([k, v]) => { params = params.set(k, v); });
    }
    return params;
  }

  getSummary(from?: Date, to?: Date): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>(
      `${this.baseUrl}/tenant-admin/analytics/summary`,
      { params: this.buildParams(from, to), withCredentials: true },
    );
  }

  getSales(period: 'day' | 'week' | 'month', from?: Date, to?: Date): Observable<SalesByPeriodPoint[]> {
    return this.http.get<SalesByPeriodPoint[]>(
      `${this.baseUrl}/tenant-admin/analytics/sales`,
      { params: this.buildParams(from, to, { period }), withCredentials: true },
    );
  }

  getTopProducts(from?: Date, to?: Date, take = 10): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(
      `${this.baseUrl}/tenant-admin/analytics/top-products`,
      { params: this.buildParams(from, to, { take: String(take) }), withCredentials: true },
    );
  }

  getOrdersByStatus(from?: Date, to?: Date): Observable<OrdersByStatus[]> {
    return this.http.get<OrdersByStatus[]>(
      `${this.baseUrl}/tenant-admin/analytics/orders-by-status`,
      { params: this.buildParams(from, to), withCredentials: true },
    );
  }

  getRevenueByPaymentMethod(from?: Date, to?: Date): Observable<RevenueByPaymentMethod[]> {
    return this.http.get<RevenueByPaymentMethod[]>(
      `${this.baseUrl}/tenant-admin/analytics/revenue-by-payment-method`,
      { params: this.buildParams(from, to), withCredentials: true },
    );
  }

  getRevenueDetail(from?: Date, to?: Date, period = 'day'): Observable<RevenueDetail> {
    return this.http.get<RevenueDetail>(
      `${this.baseUrl}/tenant-admin/analytics/revenue-detail`,
      { params: this.buildParams(from, to, { period }), withCredentials: true },
    );
  }

  getOrdersDetail(from?: Date, to?: Date): Observable<OrdersDetail> {
    return this.http.get<OrdersDetail>(
      `${this.baseUrl}/tenant-admin/analytics/orders-detail`,
      { params: this.buildParams(from, to), withCredentials: true },
    );
  }

  getCustomersDetail(from?: Date, to?: Date): Observable<CustomersDetail> {
    return this.http.get<CustomersDetail>(
      `${this.baseUrl}/tenant-admin/analytics/customers-detail`,
      { params: this.buildParams(from, to), withCredentials: true },
    );
  }

  getProductsDetail(from?: Date, to?: Date): Observable<ProductsDetail> {
    return this.http.get<ProductsDetail>(
      `${this.baseUrl}/tenant-admin/analytics/products-detail`,
      { params: this.buildParams(from, to), withCredentials: true },
    );
  }
}
