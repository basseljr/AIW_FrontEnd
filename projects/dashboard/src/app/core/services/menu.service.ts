import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { MenuItem, MenuItemListResult, MenuItemRequest } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(opts: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
    isAvailable?: boolean;
  } = {}): Observable<MenuItemListResult> {
    let params = new HttpParams();
    if (opts.page != null)          params = params.set('page', String(opts.page));
    if (opts.pageSize != null)      params = params.set('pageSize', String(opts.pageSize));
    if (opts.search)                params = params.set('search', opts.search);
    if (opts.categoryId)            params = params.set('categoryId', opts.categoryId);
    if (opts.isAvailable != null)   params = params.set('isAvailable', String(opts.isAvailable));
    return this.http.get<MenuItemListResult>(`${this.baseUrl}/tenant-admin/menu/items`, {
      params,
      withCredentials: true,
    });
  }

  getById(id: string): Observable<MenuItem> {
    return this.http.get<MenuItem>(`${this.baseUrl}/tenant-admin/menu/items/${id}`, {
      withCredentials: true,
    });
  }

  create(body: MenuItemRequest): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.baseUrl}/tenant-admin/menu/items`, body, {
      withCredentials: true,
    });
  }

  update(id: string, body: MenuItemRequest): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.baseUrl}/tenant-admin/menu/items/${id}`, body, {
      withCredentials: true,
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tenant-admin/menu/items/${id}`, {
      withCredentials: true,
    });
  }
}
