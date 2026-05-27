import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import {
  SubscriptionStatus,
  SubscriptionSummary,
  TenantSubscription,
} from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-subscriptions',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.css'],
})
export class SubscriptionsComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly summary = signal<SubscriptionSummary | null>(null);
  readonly subscriptions = signal<TenantSubscription[]>([]);
  readonly statusFilter = signal<SubscriptionStatus | ''>('');

  readonly filtered = computed(() => {
    const f = this.statusFilter();
    if (!f) return this.subscriptions();
    return this.subscriptions().filter((s) => s.status === f);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.getSubscriptionSummary().subscribe({
      next: (s) => this.summary.set(s),
      error: () => {},
    });
    this.api.listSubscriptions().subscribe({
      next: (res) => {
        this.subscriptions.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  badgeForStatus(status: SubscriptionStatus): string {
    switch (status) {
      case 'active': return 'sa-badge--success';
      case 'trialing': return 'sa-badge--warning';
      case 'past_due': return 'sa-badge--danger';
      case 'cancelled':
      case 'suspended':
      case 'incomplete':
        return 'sa-badge--neutral';
      default: return 'sa-badge--neutral';
    }
  }
}
