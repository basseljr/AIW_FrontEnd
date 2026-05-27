import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import {
  InvoiceListItem,
  InvoiceStatus,
  InvoiceType,
} from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-invoices',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css'],
})
export class InvoicesComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly invoices = signal<InvoiceListItem[]>([]);
  readonly loading = signal(true);
  readonly statusFilter = signal<InvoiceStatus | ''>('');
  readonly typeFilter = signal<InvoiceType | ''>('');
  readonly search = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api
      .listInvoices({
        status: this.statusFilter() || undefined,
        type: this.typeFilter() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.invoices.set(res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  filtered(): InvoiceListItem[] {
    const q = this.search().trim().toLowerCase();
    return this.invoices().filter((i) =>
      !q ||
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.tenantName.toLowerCase().includes(q),
    );
  }

  badgeForStatus(status: InvoiceStatus): string {
    switch (status) {
      case 'paid': return 'sa-badge--success';
      case 'pending': return 'sa-badge--warning';
      case 'overdue': return 'sa-badge--danger';
      default: return 'sa-badge--neutral';
    }
  }
}
