import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { DashboardOverview } from '../models/dashboard-overview.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(
      `${this.baseUrl}/tenant-admin/dashboard/overview`,
      { withCredentials: true },
    );
  }
}
