import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { ErrorEntry, ErrorSeverity } from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-errors',
  standalone: true,
  imports: [FormsModule, DatePipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './errors.component.html',
  styleUrls: ['./errors.component.css'],
})
export class ErrorsComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly errors = signal<ErrorEntry[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(true);

  readonly severityFilter = signal<ErrorSeverity | ''>('');
  readonly serviceFilter = signal('');
  readonly fromDate = signal('');
  readonly toDate = signal('');

  readonly expandedId = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api
      .listErrors({
        severity: this.severityFilter() || undefined,
        service: this.serviceFilter() || undefined,
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
        pageSize: 100,
      })
      .subscribe({
        next: (res) => {
          this.errors.set(res.items);
          this.totalCount.set(res.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  badgeFor(severity: ErrorSeverity): string {
    switch (severity) {
      case 'info': return 'sa-badge--info';
      case 'warning': return 'sa-badge--warning';
      case 'error':
      case 'critical':
        return 'sa-badge--danger';
      default: return 'sa-badge--neutral';
    }
  }

  toggle(id: string): void {
    this.expandedId.update((e) => (e === id ? null : id));
  }
}
