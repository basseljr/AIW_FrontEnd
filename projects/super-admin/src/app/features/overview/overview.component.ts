import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

import { SuperAdminApiService } from '../../core/services/super-admin-api.service';
import { LanguageToggleService } from '@shared/i18n';
import { OverviewResponse } from '../../core/models/super-admin-api.models';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
);

type Scope = 'this_month' | 'all_time';
type TrendMetric = 'mrr' | 'gmv' | 'commission';

@Component({
  selector: 'sa-overview',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
})
export class OverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(SuperAdminApiService);
  private readonly lang = inject(LanguageToggleService);

  @ViewChild('trendChart') trendChartEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('growthChart') growthChartEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChart') donutChartEl?: ElementRef<HTMLCanvasElement>;

  readonly scope = signal<Scope>('this_month');
  readonly trendMetric = signal<TrendMetric>('mrr');
  readonly data = signal<OverviewResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  private trendChart: Chart | null = null;
  private growthChart: Chart | null = null;
  private donutChart: Chart | null = null;

  constructor() {
    effect(() => {
      const _ = this.lang.current();
      const data = this.data();
      if (data) {
        // Defer until after Angular's CD cycle updates @ViewChild refs inside @if
        setTimeout(() => this.renderCharts());
      }
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    if (this.data()) this.renderCharts();
  }

  ngOnDestroy(): void {
    this.trendChart?.destroy();
    this.growthChart?.destroy();
    this.donutChart?.destroy();
  }

  setScope(scope: Scope): void {
    this.scope.set(scope);
    this.load();
  }

  setTrendMetric(metric: TrendMetric): void {
    this.trendMetric.set(metric);
    this.renderCharts();
  }

  formatKwd(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  trendVsLastMonth(): { delta: number; positive: boolean } | null {
    const d = this.data();
    if (!d) return null;
    const last = d.kpis.newTenantsLastMonth;
    if (last === 0) return null;
    const delta = ((d.kpis.newTenantsThisMonth - last) / last) * 100;
    return { delta: Math.abs(delta), positive: delta >= 0 };
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.getOverview(this.scope()).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private renderCharts(): void {
    if (!this.data()) return;
    this.renderTrendChart();
    this.renderGrowthChart();
    this.renderDonutChart();
  }

  private renderTrendChart(): void {
    if (!this.trendChartEl) return;
    const ctx = this.trendChartEl.nativeElement.getContext('2d');
    if (!ctx) return;
    const data = this.data()!;
    const metric = this.trendMetric();
    const values = data.trend.map((p) => p[metric]);
    const labels = data.trend.map((p) =>
      new Date(p.periodMonth).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
    );

    this.trendChart?.destroy();
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: metric.toUpperCase(),
            data: values,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#e2e8f0' } },
        },
      },
    };
    this.trendChart = new Chart(ctx, config);
  }

  private renderGrowthChart(): void {
    if (!this.growthChartEl) return;
    const ctx = this.growthChartEl.nativeElement.getContext('2d');
    if (!ctx) return;
    const data = this.data()!;
    const labels = data.tenantGrowth.map((p) =>
      new Date(p.periodMonth).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
    );

    this.growthChart?.destroy();
    this.growthChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Trial',
            data: data.tenantGrowth.map((p) => p.newTrial),
            backgroundColor: '#fde68a',
            stack: 's',
          },
          {
            label: 'Active',
            data: data.tenantGrowth.map((p) => p.newActive),
            backgroundColor: '#6366f1',
            stack: 's',
          },
          {
            label: 'Churned',
            data: data.tenantGrowth.map((p) => p.newChurned),
            backgroundColor: '#fca5a5',
            stack: 's',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, grid: { color: '#e2e8f0' } },
        },
      },
    });
  }

  private renderDonutChart(): void {
    if (!this.donutChartEl) return;
    const ctx = this.donutChartEl.nativeElement.getContext('2d');
    if (!ctx) return;
    const data = this.data()!;

    this.donutChart?.destroy();
    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.businessTypeDistribution.map((d) => d.businessType),
        datasets: [
          {
            data: data.businessTypeDistribution.map((d) => d.tenantCount),
            backgroundColor: ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }
}
