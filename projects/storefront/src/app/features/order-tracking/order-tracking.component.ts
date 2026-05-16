import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageToggleService } from '@shared/i18n';
import { SkeletonComponent } from '@shared/ui';
import { OrderTrackingService } from '../../core/services/order-tracking.service';
import { TrackingStatus } from '../../core/models/checkout.model';

const STATUS_ICONS: Record<string, string> = {
  new: 'placed',
  confirmed: 'confirmed',
  preparing: 'preparing',
  ready: 'ready',
  out_for_delivery: 'delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

@Component({
  selector: 'sf-order-tracking',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslateModule, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf-tracking">
      <div class="sf-tracking__inner">
        <h1 class="sf-tracking__title">{{ 'tracking.title' | translate }}</h1>

        <!-- Connection state banner -->
        @switch (connectionState()) {
          @case ('reconnecting') {
            <div class="sf-tracking__reconnecting" role="status">
              <span class="sf-tracking__spinner" aria-hidden="true"></span>
              {{ 'tracking.reconnecting' | translate }}
            </div>
          }
          @case ('failed') {
            <div class="sf-tracking__offline" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
              {{ 'tracking.connection_failed' | translate }}
            </div>
          }
        }

        @if (!trackingStatus() && connectionState() === 'connecting') {
          <div class="sf-tracking__skeleton-wrap">
            <ui-skeleton variant="block" height="280px" />
          </div>
        } @else if (trackingStatus()) {
          <!-- Order number -->
          <p class="sf-tracking__order-num">{{ 'tracking.order_number' | translate }}: <strong>{{ trackingStatus()!.orderNumber }}</strong></p>

          <!-- Status tracker -->
          <div class="sf-tracking__card">
            <div class="sf-tracking__steps">
              @for (step of trackingStatus()!.timeline; track step.status; let last = $last) {
                <div class="sf-tracking__step" [class.sf-tracking__step--done]="step.completedAt !== null" [class.sf-tracking__step--active]="step.status === trackingStatus()!.status">
                  <div class="sf-tracking__step-icon-wrap">
                    <div class="sf-tracking__step-icon">
                      @if (step.status === 'new' || step.completedAt) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      } @else if (step.status === 'preparing') {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2"/><path d="M18 15V2"/><path d="M21 2H18"/><rect x="15" y="15" width="6" height="7" rx="1"/></svg>
                      } @else if (step.status === 'out_for_delivery') {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="1"/><circle cx="12" cy="17" r="1"/><circle cx="20" cy="17" r="1"/></svg>
                      } @else if (step.status === 'delivered') {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      } @else {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      }
                    </div>
                    @if (!last) {
                      <div class="sf-tracking__connector" [class.sf-tracking__connector--done]="step.completedAt !== null"></div>
                    }
                  </div>
                  <div class="sf-tracking__step-info">
                    <p class="sf-tracking__step-label">{{ lang() === 'ar' ? step.labelAr : step.label }}</p>
                    @if (step.completedAt) {
                      <p class="sf-tracking__step-time">{{ step.completedAt | date: 'h:mm a' }}</p>
                    } @else if (step.status === trackingStatus()!.status) {
                      <p class="sf-tracking__step-in-progress">{{ 'tracking.in_progress' | translate }}</p>
                    } @else {
                      <p class="sf-tracking__step-pending">{{ 'tracking.pending' | translate }}</p>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- ETA -->
            @if (trackingStatus()!.estimatedMinutes) {
              <div class="sf-tracking__eta">
                <div class="sf-tracking__eta-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p class="sf-tracking__eta-label">{{ 'tracking.estimated_arrival' | translate }}</p>
                  <p class="sf-tracking__eta-value">{{ trackingStatus()!.estimatedMinutes }} {{ 'item_detail.minutes' | translate: { count: trackingStatus()!.estimatedMinutes } }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Status message -->
          <div class="sf-tracking__status-msg">
            <p>{{ lang() === 'ar' ? trackingStatus()!.statusLabelAr : trackingStatus()!.statusLabel }}</p>
          </div>
        } @else {
          <!-- No data yet — show an info card -->
          <div class="sf-tracking__card sf-tracking__card--waiting">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <p>{{ 'tracking.waiting_for_updates' | translate }}</p>
          </div>
        }

        <div class="sf-tracking__footer-actions">
          <a class="sf-tracking__home-link" [routerLink]="['/', lang(), '']">← {{ 'confirm.return_home' | translate }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sf-tracking {
      background: var(--color-background, #fff8f1);
      min-block-size: 80vh;
      padding-block: 2rem;
      padding-inline: 1.5rem;
    }
    .sf-tracking__inner { max-inline-size: 48rem; margin-inline: auto; }
    .sf-tracking__title {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      color: var(--color-primary, #805600);
      margin: 0 0 0.5rem;
      letter-spacing: -0.02em;
    }
    .sf-tracking__order-num { font-size: 0.9375rem; color: var(--color-on-surface-variant, #514534); margin: 0 0 1.5rem; }

    .sf-tracking__reconnecting,
    .sf-tracking__offline {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-block-end: 1.25rem;
    }
    .sf-tracking__reconnecting {
      background: rgba(245,158,11,0.1);
      color: var(--color-warning, #b45309);
      border: 1px solid rgba(245,158,11,0.3);
    }
    .sf-tracking__offline {
      background: rgba(220,38,38,0.08);
      color: var(--color-error, #dc2626);
      border: 1px solid rgba(220,38,38,0.2);
    }
    .sf-tracking__offline svg { inline-size: 1.125rem; block-size: 1.125rem; }
    .sf-tracking__spinner {
      inline-size: 1rem;
      block-size: 1rem;
      border: 2px solid rgba(180,83,9,0.3);
      border-block-start-color: var(--color-warning, #b45309);
      border-radius: 50%;
      animation: sf-spin 0.7s linear infinite;
    }
    @keyframes sf-spin { to { transform: rotate(360deg); } }

    .sf-tracking__skeleton-wrap { border-radius: 16px; overflow: hidden; margin-block-end: 1.5rem; }

    .sf-tracking__card {
      background: var(--color-surface, #fff);
      border-radius: 16px;
      padding: 1.75rem;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      margin-block-end: 1.5rem;
    }
    .sf-tracking__card--waiting {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding-block: 3rem;
      color: var(--color-on-surface-variant, #514534);
      font-size: 1rem;
    }
    .sf-tracking__card--waiting svg { inline-size: 3rem; block-size: 3rem; opacity: 0.4; }

    .sf-tracking__steps { display: flex; flex-direction: column; gap: 0; }
    .sf-tracking__step { display: flex; gap: 1rem; align-items: flex-start; }
    .sf-tracking__step-icon-wrap { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
    .sf-tracking__step-icon {
      inline-size: 3.5rem;
      block-size: 3.5rem;
      border-radius: 50%;
      background: var(--color-surface-container-high, #eee7df);
      color: var(--color-on-surface-variant, #514534);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed var(--color-outline-variant, #d6c4ad);
      transition: background-color 0.3s, border-color 0.3s, color 0.3s;
    }
    .sf-tracking__step-icon svg { inline-size: 1.25rem; block-size: 1.25rem; }
    .sf-tracking__step--done .sf-tracking__step-icon {
      background: var(--color-primary, #805600);
      color: var(--color-on-primary, #fff);
      border-color: var(--color-primary, #805600);
      border-style: solid;
    }
    .sf-tracking__step--active .sf-tracking__step-icon {
      background: var(--color-primary-container, #f2a922);
      color: var(--color-on-primary-container, #634100);
      border-color: var(--color-primary-container, #f2a922);
      border-style: solid;
    }
    .sf-tracking__connector {
      inline-size: 2px;
      flex: 1;
      min-block-size: 2rem;
      background: var(--color-outline-variant, #d6c4ad);
      margin-block: 0.25rem;
      transition: background-color 0.3s;
    }
    .sf-tracking__connector--done { background: var(--color-primary, #805600); }

    .sf-tracking__step-info { padding-block: 0.625rem; padding-inline-start: 0; }
    .sf-tracking__step-label { font-size: 1rem; font-weight: 700; color: var(--color-on-surface, #1e1b17); margin: 0; }
    .sf-tracking__step-time { font-size: 0.8125rem; color: var(--color-primary, #805600); font-weight: 600; margin: 0.125rem 0 0; }
    .sf-tracking__step-in-progress { font-size: 0.8125rem; color: var(--color-primary-container, #d39207); font-weight: 600; margin: 0.125rem 0 0; }
    .sf-tracking__step-pending { font-size: 0.8125rem; color: var(--color-on-surface-variant, #514534); margin: 0.125rem 0 0; }

    .sf-tracking__eta {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--color-surface-container, #f4ede5);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-block-start: 1.5rem;
    }
    .sf-tracking__eta-icon {
      inline-size: 3rem;
      block-size: 3rem;
      border-radius: 50%;
      background: var(--color-primary-container, #f2a922);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .sf-tracking__eta-icon svg { inline-size: 1.25rem; block-size: 1.25rem; color: var(--color-on-primary-container, #634100); }
    .sf-tracking__eta-label { font-size: 0.875rem; font-weight: 600; color: var(--color-on-surface, #1e1b17); margin: 0; }
    .sf-tracking__eta-value { font-size: 1.25rem; font-weight: 900; color: var(--color-primary, #805600); margin: 0; }

    .sf-tracking__status-msg {
      background: var(--color-surface, #fff);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      border-inline-start: 4px solid var(--color-primary-container, #f2a922);
      margin-block-end: 1.5rem;
      font-size: 0.9375rem;
      color: var(--color-on-surface, #1e1b17);
      font-weight: 500;
    }
    .sf-tracking__status-msg p { margin: 0; }

    .sf-tracking__footer-actions { margin-block-start: 1.5rem; }
    .sf-tracking__home-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--color-primary, #805600);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
    }
    .sf-tracking__home-link:hover { text-decoration: underline; }
  `],
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly trackingService = inject(OrderTrackingService);
  private readonly langToggle = inject(LanguageToggleService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly lang = this.langToggle.current;
  readonly trackingStatus = signal<TrackingStatus | null>(null);
  readonly connectionState = signal<string>('disconnected');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    this.trackingService.connectionState$.subscribe((state) => {
      this.connectionState.set(state);
    });

    this.trackingService.status$.subscribe((status) => {
      if (status) this.trackingStatus.set(status);
    });

    this.trackingService.connect(orderId, token);
  }

  ngOnDestroy(): void {
    this.trackingService.disconnect();
  }
}
