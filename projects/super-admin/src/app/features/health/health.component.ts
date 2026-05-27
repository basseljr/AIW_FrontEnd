import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { ServiceStatus, SystemHealthResponse } from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-health',
  standalone: true,
  imports: [TranslateModule, DatePipe, DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css'],
})
export class HealthComponent implements OnInit, OnDestroy {
  private readonly api = inject(SuperAdminApiService);
  private pollSub: Subscription | null = null;

  readonly health = signal<SystemHealthResponse | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.pollSub = interval(60_000)
      .pipe(
        startWith(0),
        switchMap(() => this.api.getSystemHealth()),
      )
      .subscribe({
        next: (h) => {
          this.health.set(h);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  statusColor(status: ServiceStatus): string {
    switch (status) {
      case 'healthy': return 'sa-health__dot--healthy';
      case 'degraded': return 'sa-health__dot--warn';
      case 'down': return 'sa-health__dot--down';
      default: return 'sa-health__dot--unknown';
    }
  }

  statusLabel(status: ServiceStatus): string {
    switch (status) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'down': return '🔴';
      default: return '⚪';
    }
  }
}
