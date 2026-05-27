import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { TenantListItem, TenantStatus } from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-tenants',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenants.component.html',
  styleUrls: ['./tenants.component.css'],
})
export class TenantsComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  readonly tenants = signal<TenantListItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly searchInput = signal('');
  readonly statusFilter = signal<TenantStatus | ''>('');
  readonly typeFilter = signal<string>('');
  readonly planFilter = signal<string>('');
  readonly countryFilter = signal<string>('');

  readonly filtered = computed(() => {
    const q = this.searchInput().trim().toLowerCase();
    return this.tenants().filter((t) => {
      if (q && !`${t.businessNameEn} ${t.slug}`.toLowerCase().includes(q)) return false;
      if (this.statusFilter() && t.status !== this.statusFilter()) return false;
      if (this.typeFilter() && t.businessType !== this.typeFilter()) return false;
      if (this.planFilter() && t.planName !== this.planFilter()) return false;
      if (this.countryFilter() && t.country !== this.countryFilter()) return false;
      return true;
    });
  });

  readonly availablePlans = computed(() => {
    const set = new Set<string>();
    this.tenants().forEach((t) => t.planName && set.add(t.planName));
    return Array.from(set).sort();
  });

  readonly availableCountries = computed(() => {
    const set = new Set<string>();
    this.tenants().forEach((t) => t.country && set.add(t.country));
    return Array.from(set).sort();
  });

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe((q) => this.searchInput.set(q));
    this.load();
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.listTenants().subscribe({
      next: (res) => {
        this.tenants.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  badgeForStatus(status: TenantStatus): string {
    switch (status) {
      case 'active': return 'sa-badge--success';
      case 'trial': return 'sa-badge--warning';
      case 'suspended':
      case 'cancelled':
      case 'archived':
      case 'deleted':
        return 'sa-badge--danger';
      default: return 'sa-badge--neutral';
    }
  }

  suspend(tenant: TenantListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(`Suspend ${tenant.businessNameEn}?`)) return;
    this.api.suspendTenant(tenant.id).subscribe({
      next: () => this.load(),
    });
  }

  reactivate(tenant: TenantListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.api.reactivateTenant(tenant.id).subscribe({
      next: () => this.load(),
    });
  }

  impersonate(tenant: TenantListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.api.impersonateTenant(tenant.id).subscribe({
      next: (res) => {
        // Open tenant dashboard in new tab with token. In a real deployment, the
        // dashboard SPA accepts the impersonation token via a fragment param.
        const url = `/dashboard?impersonate=${encodeURIComponent(res.token)}`;
        window.open(url, '_blank', 'noopener');
      },
    });
  }
}
