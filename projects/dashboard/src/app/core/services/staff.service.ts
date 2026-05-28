import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { StaffMember, InviteStaffRequest, UpdateStaffStatusRequest } from '../models/staff.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getStaff(): Observable<StaffMember[]> {
    return this.http.get<StaffMember[]>(
      `${this.baseUrl}/tenant-admin/staff`,
      { withCredentials: true },
    );
  }

  inviteStaff(request: InviteStaffRequest): Observable<StaffMember> {
    return this.http.post<StaffMember>(
      `${this.baseUrl}/tenant-admin/staff/invite`,
      request,
      { withCredentials: true },
    );
  }

  updateRole(userId: string, roleKey: string): Observable<StaffMember> {
    return this.http.put<StaffMember>(
      `${this.baseUrl}/tenant-admin/staff/${userId}/role`,
      { roleKey },
      { withCredentials: true },
    );
  }

  updateStatus(userId: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/tenant-admin/staff/${userId}/status`,
      { isActive } satisfies UpdateStaffStatusRequest,
      { withCredentials: true },
    );
  }

  resetPassword(userId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/tenant-admin/staff/${userId}/reset-password`,
      {},
      { withCredentials: true },
    );
  }
}
