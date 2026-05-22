import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { LoyaltySettings } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getSettings(): Observable<LoyaltySettings> {
    return this.http.get<LoyaltySettings>(
      `${this.baseUrl}/tenant-admin/loyalty/settings`,
      { withCredentials: true },
    );
  }

  updateSettings(body: LoyaltySettings): Observable<LoyaltySettings> {
    return this.http.put<LoyaltySettings>(
      `${this.baseUrl}/tenant-admin/loyalty/settings`,
      body,
      { withCredentials: true },
    );
  }
}
