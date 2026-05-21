import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  Category,
  CategoryRequest,
  CategoryReorderItem,
} from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(parentId?: string): Observable<Category[]> {
    let params = new HttpParams();
    if (parentId != null) params = params.set('parentId', parentId);
    return this.http.get<Category[]>(`${this.baseUrl}/tenant-admin/categories`, {
      params,
      withCredentials: true,
    });
  }

  getById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/tenant-admin/categories/${id}`, {
      withCredentials: true,
    });
  }

  create(body: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/tenant-admin/categories`, body, {
      withCredentials: true,
    });
  }

  update(id: string, body: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/tenant-admin/categories/${id}`, body, {
      withCredentials: true,
    });
  }

  reorder(items: CategoryReorderItem[]): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/tenant-admin/categories/reorder`,
      { items },
      { withCredentials: true },
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tenant-admin/categories/${id}`, {
      withCredentials: true,
    });
  }
}
