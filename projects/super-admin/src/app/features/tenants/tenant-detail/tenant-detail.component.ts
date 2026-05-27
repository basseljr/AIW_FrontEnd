import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { SuperAdminApiService } from '../../../core/services/super-admin-api.service';
import {
  FeatureFlag,
  InvoiceListItem,
  TenantCustomerSummary,
  TenantDetail,
  TenantDomainInfo,
  TenantOverviewKpis,
  TenantRevenuePoint,
  TenantSubscription,
  TenantUserSummary,
} from '../../../core/models/super-admin-api.models';

type TabKey = 'overview' | 'config' | 'flags' | 'subscription' | 'billing' | 'users' | 'customers' | 'domains';

@Component({
  selector: 'sa-tenant-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-detail.component.html',
  styleUrls: ['./tenant-detail.component.css'],
})
export class TenantDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SuperAdminApiService);

  readonly tenant = signal<TenantDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly activeTab = signal<TabKey>('overview');

  readonly overviewKpis = signal<TenantOverviewKpis | null>(null);
  readonly revenueTrend = signal<TenantRevenuePoint[]>([]);
  readonly flags = signal<FeatureFlag[]>([]);
  readonly subscription = signal<TenantSubscription | null>(null);
  readonly invoices = signal<InvoiceListItem[]>([]);
  readonly users = signal<TenantUserSummary[]>([]);
  readonly customers = signal<TenantCustomerSummary[]>([]);
  readonly domains = signal<TenantDomainInfo[]>([]);

  readonly tabs: { key: TabKey; labelKey: string }[] = [
    { key: 'overview', labelKey: 'tenant.tab.overview' },
    { key: 'config', labelKey: 'tenant.tab.config' },
    { key: 'flags', labelKey: 'tenant.tab.flags' },
    { key: 'subscription', labelKey: 'tenant.tab.subscription' },
    { key: 'billing', labelKey: 'tenant.tab.billing' },
    { key: 'users', labelKey: 'tenant.tab.users' },
    { key: 'customers', labelKey: 'tenant.tab.customers' },
    { key: 'domains', labelKey: 'tenant.tab.domains' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.api.getTenant(id).subscribe({
      next: (t) => {
        this.tenant.set(t);
        this.loadOverview(id);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  setTab(tab: TabKey): void {
    this.activeTab.set(tab);
    const id = this.tenant()?.id;
    if (!id) return;
    switch (tab) {
      case 'overview':
        if (!this.overviewKpis()) this.loadOverview(id);
        break;
      case 'flags':
        if (this.flags().length === 0) this.loadFlags(id);
        break;
      case 'subscription':
        if (!this.subscription()) this.loadSubscription(id);
        break;
      case 'billing':
        if (this.invoices().length === 0) this.loadInvoices(id);
        break;
      case 'users':
        if (this.users().length === 0) this.loadUsers(id);
        break;
      case 'customers':
        if (this.customers().length === 0) this.loadCustomers(id);
        break;
      case 'domains':
        if (this.domains().length === 0) this.loadDomains(id);
        break;
    }
  }

  toggleFlag(flag: FeatureFlag, override: 'default' | 'on' | 'off'): void {
    const tenantId = this.tenant()?.id;
    if (!tenantId) return;
    if (override === 'default') {
      this.api.removeTenantFlagOverride(tenantId, flag.key).subscribe(() => this.loadFlags(tenantId));
    } else {
      this.api
        .setTenantFlagOverride(tenantId, flag.key, { isEnabled: override === 'on' })
        .subscribe(() => this.loadFlags(tenantId));
    }
  }

  badgeForStatus(status: string): string {
    switch (status) {
      case 'active': return 'sa-badge--success';
      case 'trial': case 'trialing': return 'sa-badge--warning';
      case 'suspended': case 'past_due': return 'sa-badge--danger';
      default: return 'sa-badge--neutral';
    }
  }

  private loadOverview(id: string): void {
    this.api.getTenantOverview(id).subscribe({
      next: (r) => {
        this.overviewKpis.set(r.kpis);
        this.revenueTrend.set(r.revenueTrend);
      },
    });
  }

  private loadFlags(id: string): void {
    this.api.getTenantFeatureFlags(id).subscribe((flags) => this.flags.set(flags));
  }

  private loadSubscription(id: string): void {
    this.api.listSubscriptions().subscribe((all) => {
      const sub = all.find((s) => s.tenantId === id) ?? null;
      this.subscription.set(sub);
    });
  }

  private loadInvoices(id: string): void {
    this.api.listInvoices({ tenantId: id }).subscribe((res) => this.invoices.set(res));
  }

  private loadUsers(id: string): void {
    this.api.getTenantUsers(id).subscribe((res) => this.users.set(res));
  }

  private loadCustomers(id: string): void {
    this.api.getTenantCustomers(id).subscribe((res) => this.customers.set(res));
  }

  private loadDomains(id: string): void {
    this.api.getTenantDomains(id).subscribe((res) => this.domains.set(res));
  }

  flagOverrideMode(flag: FeatureFlag): 'default' | 'on' | 'off' {
    if (flag.resolvedValue == null) return 'default';
    return flag.resolvedValue === flag.defaultValue ? 'default' : flag.resolvedValue ? 'on' : 'off';
  }
}
