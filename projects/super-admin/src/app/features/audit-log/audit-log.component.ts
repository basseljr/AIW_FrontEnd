import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { AuditLogEntry } from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-audit-log',
  standalone: true,
  imports: [FormsModule, DatePipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.css'],
})
export class AuditLogComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly entries = signal<AuditLogEntry[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly pageSize = 50;
  readonly totalCount = signal(0);

  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly actorSearch = signal('');
  readonly actionFilter = signal('');
  readonly tenantFilter = signal('');

  readonly expandedId = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api
      .listAuditLogs({
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
        action: this.actionFilter() || undefined,
        tenantId: this.tenantFilter() || undefined,
        userId: this.actorSearch() || undefined,
        page: this.page(),
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.entries.set(res.items);
          this.totalCount.set(res.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.page() * this.pageSize < this.totalCount()) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  toggle(id: string): void {
    this.expandedId.update((e) => (e === id ? null : id));
  }

  exportCsv(): void {
    this.api
      .exportAuditLogs({
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
        action: this.actionFilter() || undefined,
        tenantId: this.tenantFilter() || undefined,
      })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        },
      });
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }
}
