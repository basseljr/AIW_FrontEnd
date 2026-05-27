import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { BillingCurrentPlan, BillingInvoice } from '../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getCurrentPlan(): Observable<BillingCurrentPlan> {
    return this.http.get<BillingCurrentPlan>(
      `${this.baseUrl}/tenant-admin/billing/current-plan`,
      { withCredentials: true },
    );
  }

  getInvoices(): Observable<BillingInvoice[]> {
    return this.http.get<BillingInvoice[]>(
      `${this.baseUrl}/tenant-admin/billing/invoices`,
      { withCredentials: true },
    );
  }
}
