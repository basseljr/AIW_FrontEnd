import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import {
  BillingSummary,
  InvoiceListItem,
  InvoiceStatus,
  InvoiceType,
  PastDueTenant,
} from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-billing',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css'],
})
export class BillingComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly summary = signal<BillingSummary | null>(null);
  readonly pastDue = signal<PastDueTenant[]>([]);
  readonly invoices = signal<InvoiceListItem[]>([]);
  readonly loading = signal(true);

  readonly statusFilter = signal<InvoiceStatus | ''>('');
  readonly typeFilter = signal<InvoiceType | ''>('');
  readonly tenantSearch = signal('');

  readonly showCreate = signal(false);
  readonly newTenantId = signal('');
  readonly newType = signal<InvoiceType>('custom');
  readonly newDueDate = signal('');
  readonly newTaxAmount = signal(0);
  readonly newLineItems = signal<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getBillingSummary().subscribe((s) => this.summary.set(s));
    this.api.listPastDueTenants().subscribe((p) => this.pastDue.set(p));
    this.api.listInvoices().subscribe({
      next: (res) => {
        this.invoices.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilters(): void {
    this.api
      .listInvoices({
        status: this.statusFilter() || undefined,
        type: this.typeFilter() || undefined,
      })
      .subscribe((res) => this.invoices.set(res));
  }

  filteredInvoices(): InvoiceListItem[] {
    const q = this.tenantSearch().trim().toLowerCase();
    return this.invoices().filter((i) =>
      !q || i.tenantName.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q),
    );
  }

  badgeForStatus(status: InvoiceStatus): string {
    switch (status) {
      case 'paid': return 'sa-badge--success';
      case 'pending': return 'sa-badge--warning';
      case 'overdue': return 'sa-badge--danger';
      case 'void': case 'written_off': return 'sa-badge--neutral';
    }
  }

  markPaid(inv: InvoiceListItem): void {
    if (!confirm(`Mark ${inv.invoiceNumber} as paid?`)) return;
    this.api.markInvoicePaid(inv.id).subscribe(() => this.load());
  }

  writeOff(inv: InvoiceListItem): void {
    const reason = prompt('Reason for write-off?');
    if (!reason) return;
    this.api.writeOffInvoice(inv.id, { reason }).subscribe(() => this.load());
  }

  voidInvoice(inv: InvoiceListItem): void {
    if (!confirm(`Void invoice ${inv.invoiceNumber}? This cannot be undone.`)) return;
    this.api.voidInvoice(inv.id).subscribe(() => this.load());
  }

  addLineItem(): void {
    this.newLineItems.update((items) => [...items, { description: '', quantity: 1, unitPrice: 0 }]);
  }

  removeLineItem(idx: number): void {
    this.newLineItems.update((items) => items.filter((_, i) => i !== idx));
  }

  updateLineItem(idx: number, key: 'description' | 'quantity' | 'unitPrice', value: string | number): void {
    this.newLineItems.update((items) => {
      const next = [...items];
      const it = { ...next[idx], [key]: value } as { description: string; quantity: number; unitPrice: number };
      next[idx] = it;
      return next;
    });
  }

  invoiceTotal(): number {
    return this.newLineItems().reduce((s, i) => s + i.quantity * i.unitPrice, 0) + Number(this.newTaxAmount() || 0);
  }

  createInvoice(): void {
    if (!this.newTenantId() || !this.newDueDate()) return;
    this.api
      .createInvoice({
        tenantId: this.newTenantId(),
        type: this.newType(),
        lineItems: this.newLineItems(),
        taxAmount: Number(this.newTaxAmount() || 0),
        dueDate: this.newDueDate(),
      })
      .subscribe(() => {
        this.showCreate.set(false);
        this.newLineItems.set([{ description: '', quantity: 1, unitPrice: 0 }]);
        this.newTenantId.set('');
        this.newDueDate.set('');
        this.newTaxAmount.set(0);
        this.load();
      });
  }
}
