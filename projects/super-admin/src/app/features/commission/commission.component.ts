import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import {
  CommissionSummary,
  CommissionTenantRow,
} from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-commission',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './commission.component.html',
  styleUrls: ['./commission.component.css'],
})
export class CommissionComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly summary = signal<CommissionSummary | null>(null);
  readonly rows = signal<CommissionTenantRow[]>([]);
  readonly loading = signal(true);
  readonly periodMonth = signal(this.currentPeriod());
  readonly generating = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getCommissionSummary(this.periodMonth()).subscribe((s) => this.summary.set(s));
    this.api.listCommissionByTenant(this.periodMonth()).subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changePeriod(value: string): void {
    this.periodMonth.set(value);
    this.load();
  }

  badgeForStatus(status: string): string {
    switch (status) {
      case 'paid': return 'sa-badge--success';
      case 'invoiced': return 'sa-badge--info';
      case 'pending': return 'sa-badge--warning';
      default: return 'sa-badge--neutral';
    }
  }

  generateInvoices(): void {
    if (!confirm('Generate commission invoices for the selected period?')) return;
    this.generating.set(true);
    this.api.generateCommissionInvoices(this.periodMonth()).subscribe({
      next: (res) => {
        this.generating.set(false);
        alert(`Created ${res.invoicesCreated} invoices (KD ${res.totalAmount.toFixed(3)})`);
        this.load();
      },
      error: () => this.generating.set(false),
    });
  }

  private currentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
  }
}
