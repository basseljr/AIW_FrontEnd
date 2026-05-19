import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardOverview } from '../../core/models/dashboard-overview.model';
import { StatWidgetComponent } from './stat-widget/stat-widget.component';

@Component({
  selector: 'db-overview',
  standalone: true,
  imports: [TranslateModule, StatWidgetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="db-overview">
      <header class="db-overview__header">
        <h1 class="db-overview__title">{{ 'overview.title' | translate }}</h1>
        @if (overview()) {
          <p class="db-overview__timestamp">
            {{ 'overview.as_of' | translate: { time: formatTime(overview()!.generatedAtUtc) } }}
          </p>
        }
      </header>

      @if (loading()) {
        <div class="db-overview__grid">
          @for (_ of [1, 2, 3, 4]; track $index) {
            <div class="db-overview__skeleton" aria-hidden="true"></div>
          }
        </div>
      } @else if (error()) {
        <div class="db-overview__error" role="alert">
          <p>{{ 'overview.error' | translate }}</p>
          <button class="db-overview__retry" type="button" (click)="load()">
            {{ 'overview.retry' | translate }}
          </button>
        </div>
      } @else if (overview()) {
        <div class="db-overview__grid">
          <db-stat-widget
            [labelKey]="'overview.todays_orders'"
            [value]="overview()!.todaysOrdersCount.toString()"
            icon="📦"
            iconBg="color-mix(in srgb, var(--accent) 10%, transparent)"
          />
          <db-stat-widget
            [labelKey]="'overview.todays_revenue'"
            [value]="formatCurrency(overview()!.todaysRevenue)"
            icon="💰"
            iconBg="color-mix(in srgb, var(--success) 10%, transparent)"
          />
          <db-stat-widget
            [labelKey]="'overview.new_customers'"
            [value]="overview()!.newCustomersCount.toString()"
            icon="👥"
            iconBg="color-mix(in srgb, var(--info) 10%, transparent)"
          />
          <db-stat-widget
            [labelKey]="'overview.pending_orders'"
            [value]="overview()!.pendingOrdersCount.toString()"
            icon="⏳"
            iconBg="color-mix(in srgb, var(--warning) 10%, transparent)"
          />
        </div>
      }
    </div>
  `,
  styles: [
    `
      .db-overview {
        padding: 2rem;
        max-inline-size: 72rem;
      }

      .db-overview__header {
        display: flex;
        align-items: baseline;
        gap: 1rem;
        flex-wrap: wrap;
        margin-block-end: 1.75rem;
      }

      .db-overview__title {
        font-size: clamp(1.25rem, 3vw, 1.75rem);
        font-weight: 700;
        color: var(--text);
        margin: 0;
        letter-spacing: -0.02em;
      }

      .db-overview__timestamp {
        font-size: 0.8125rem;
        color: var(--text-subtle);
        margin: 0;
      }

      .db-overview__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.25rem;
      }

      @media (min-width: 640px) {
        .db-overview__grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (min-width: 1024px) {
        .db-overview__grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      .db-overview__skeleton {
        block-size: 6rem;
        background: linear-gradient(
          90deg,
          var(--border) 25%,
          var(--surface-alt) 50%,
          var(--border) 75%
        );
        background-size: 200% 100%;
        animation: db-shimmer 1.4s infinite;
        border-radius: var(--radius-card);
        border: 1px solid var(--border);
      }

      @keyframes db-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .db-overview__error {
        padding: 2rem;
        text-align: center;
        color: var(--text-muted);
      }

      .db-overview__error p {
        margin: 0 0 1rem;
      }

      .db-overview__retry {
        padding-block: 0.5rem;
        padding-inline: 1.25rem;
        background: var(--accent);
        color: var(--on-accent);
        border: none;
        border-radius: var(--radius-control);
        font-size: 0.875rem;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: background-color var(--motion-base);
      }

      .db-overview__retry:hover {
        background: var(--accent-hover);
      }
    `,
  ],
})
export class OverviewComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(false);
  readonly error = signal(false);
  readonly overview = signal<DashboardOverview | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.dashboardService.getOverview().subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  formatCurrency(amount: number): string {
    const currencyLabel = this.translate.instant('overview.currency');
    return `${amount.toFixed(3)} ${currencyLabel}`;
  }

  formatTime(iso: string): string {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }
}
