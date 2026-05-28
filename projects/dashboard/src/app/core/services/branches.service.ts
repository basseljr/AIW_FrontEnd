import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { BranchListItem, BranchDetail, UpsertBranchRequest } from '../models/branch.model';

@Injectable({ providedIn: 'root' })
export class BranchesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(): Observable<BranchListItem[]> {
    return this.http.get<BranchListItem[]>(`${this.baseUrl}/branches`, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<BranchDetail> {
    return this.http.get<BranchDetail>(`${this.baseUrl}/branches/${id}`, {
      withCredentials: true,
    });
  }

  create(body: UpsertBranchRequest): Observable<BranchDetail> {
    return this.http.post<BranchDetail>(`${this.baseUrl}/branches`, body, {
      withCredentials: true,
    });
  }

  update(id: string, body: UpsertBranchRequest): Observable<BranchDetail> {
    return this.http.put<BranchDetail>(`${this.baseUrl}/branches/${id}`, body, {
      withCredentials: true,
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/branches/${id}`, {
      withCredentials: true,
    });
  }
}
