import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { Coupon, CouponRequest } from '../models/coupon.model';

@Injectable({ providedIn: 'root' })
export class CouponsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(
      `${this.baseUrl}/tenant-admin/coupons`,
      { withCredentials: true },
    );
  }

  getById(id: string): Observable<Coupon> {
    return this.http.get<Coupon>(
      `${this.baseUrl}/tenant-admin/coupons/${id}`,
      { withCredentials: true },
    );
  }

  create(body: CouponRequest): Observable<Coupon> {
    return this.http.post<Coupon>(
      `${this.baseUrl}/tenant-admin/coupons`,
      body,
      { withCredentials: true },
    );
  }

  update(id: string, body: CouponRequest): Observable<Coupon> {
    return this.http.put<Coupon>(
      `${this.baseUrl}/tenant-admin/coupons/${id}`,
      body,
      { withCredentials: true },
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/tenant-admin/coupons/${id}`,
      { withCredentials: true },
    );
  }

  toggle(id: string): Observable<Coupon> {
    return this.http.patch<Coupon>(
      `${this.baseUrl}/tenant-admin/coupons/${id}/toggle`,
      {},
      { withCredentials: true },
    );
  }
}
