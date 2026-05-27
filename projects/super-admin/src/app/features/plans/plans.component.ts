import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import {
  BillingModel,
  CreatePlanRequest,
  FeatureFlag,
  PlanFeature,
  SubscriptionPlan,
} from '../../core/models/super-admin-api.models';

@Component({
  selector: 'sa-plans',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.css'],
})
export class PlansComponent implements OnInit {
  private readonly api = inject(SuperAdminApiService);

  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly allFlags = signal<FeatureFlag[]>([]);
  readonly loading = signal(true);

  readonly showForm = signal(false);
  readonly editing = signal<SubscriptionPlan | null>(null);
  readonly form = signal<CreatePlanRequest>(this.emptyForm());

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    forkJoin({
      plans: this.api.listPlans(),
      flags: this.api.listFeatureFlags(),
    }).subscribe({
      next: ({ plans, flags }) => {
        this.plans.set(plans);
        this.allFlags.set(flags);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.set(this.emptyForm());
    this.showForm.set(true);
  }

  openEdit(plan: SubscriptionPlan): void {
    this.editing.set(plan);
    this.form.set({
      name: plan.name,
      description: plan.description ?? '',
      isVisible: plan.isVisible,
      isHighlighted: plan.isHighlighted,
      billingModel: plan.billingModel,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      commissionRate: plan.commissionRate,
      commissionThreshold: plan.commissionThreshold,
      currency: plan.currency,
      trialDays: plan.trialDays,
      maxBranches: plan.maxBranches,
      maxStaffUsers: plan.maxStaffUsers,
      maxProducts: plan.maxProducts,
      featureFlags: plan.featureFlags,
    });
    this.showForm.set(true);
  }

  save(): void {
    const op = this.editing()
      ? this.api.updatePlan(this.editing()!.id, this.form())
      : this.api.createPlan(this.form());
    op.subscribe({
      next: () => {
        this.showForm.set(false);
        this.load();
      },
    });
  }

  archive(plan: SubscriptionPlan): void {
    if (!confirm(`Archive plan "${plan.name}"?`)) return;
    this.api.deletePlan(plan.id).subscribe(() => this.load());
  }

  updateForm<K extends keyof CreatePlanRequest>(key: K, value: CreatePlanRequest[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  toggleFlag(key: string, value: boolean): void {
    this.form.update((f) => ({
      ...f,
      featureFlags: f.featureFlags
        .filter((x) => x.flagKey !== key)
        .concat({ flagKey: key, value }),
    }));
  }

  flagEnabled(key: string): boolean {
    return this.form().featureFlags.find((f) => f.flagKey === key)?.value === true;
  }

  formatPrice(p: SubscriptionPlan, cycle: 'monthly' | 'annual'): string {
    const price = cycle === 'monthly' ? p.monthlyPrice : p.annualPrice;
    return price != null ? `KD ${price.toFixed(0)}` : '—';
  }

  private emptyForm(): CreatePlanRequest {
    return {
      name: '',
      description: '',
      isVisible: true,
      isHighlighted: false,
      billingModel: 'flat',
      monthlyPrice: 0,
      annualPrice: null,
      commissionRate: null,
      commissionThreshold: null,
      currency: 'KWD',
      trialDays: 14,
      maxBranches: null,
      maxStaffUsers: null,
      maxProducts: null,
      featureFlags: [],
    };
  }
}
