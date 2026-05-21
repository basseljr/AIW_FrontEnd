import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { ModifierGroup, ModifierGroupRequest } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class ModifiersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(): Observable<ModifierGroup[]> {
    return this.http.get<ModifierGroup[]>(`${this.baseUrl}/tenant-admin/menu/modifier-groups`, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<ModifierGroup> {
    return this.http.get<ModifierGroup>(`${this.baseUrl}/tenant-admin/menu/modifier-groups/${id}`, {
      withCredentials: true,
    });
  }

  create(body: ModifierGroupRequest): Observable<ModifierGroup> {
    return this.http.post<ModifierGroup>(`${this.baseUrl}/tenant-admin/menu/modifier-groups`, body, {
      withCredentials: true,
    });
  }

  update(id: string, body: ModifierGroupRequest): Observable<ModifierGroup> {
    return this.http.put<ModifierGroup>(
      `${this.baseUrl}/tenant-admin/menu/modifier-groups/${id}`,
      body,
      { withCredentials: true },
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tenant-admin/menu/modifier-groups/${id}`, {
      withCredentials: true,
    });
  }
}
