import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { Product, ProductListResult, ProductRequest } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(opts: { page?: number; pageSize?: number; search?: string; categoryId?: string } = {}): Observable<ProductListResult> {
    let params = new HttpParams();
    if (opts.page != null)       params = params.set('page', String(opts.page));
    if (opts.pageSize != null)   params = params.set('pageSize', String(opts.pageSize));
    if (opts.search)             params = params.set('search', opts.search);
    if (opts.categoryId)         params = params.set('categoryId', opts.categoryId);
    return this.http.get<ProductListResult>(`${this.baseUrl}/tenant-admin/products`, {
      params,
      withCredentials: true,
    });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/tenant-admin/products/${id}`, {
      withCredentials: true,
    });
  }

  create(body: ProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/tenant-admin/products`, body, {
      withCredentials: true,
    });
  }

  update(id: string, body: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/tenant-admin/products/${id}`, body, {
      withCredentials: true,
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tenant-admin/products/${id}`, {
      withCredentials: true,
    });
  }
}
