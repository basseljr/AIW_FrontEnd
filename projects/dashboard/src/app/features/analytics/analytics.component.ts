import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';

import { AnalyticsService } from '../../core/services/analytics.service';
import {
  AnalyticsTab,
  CustomersDetail,
  DateRangePreset,
  OrdersDetail,
  ProductsDetail,
  RevenueDetail,
} from '../../core/models/analytics.model';

Chart.register(...registerables);

interface DateRange { from: Date; to: Date; }

function getRangeForPreset(preset: DateRangePreset, customFrom?: Date, customTo?: Date): DateRange {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000 - 1);
  switch (preset) {
    case 'today': return { from: startOfToday, to: endOfToday };
    case 'yesterday': {
      const s = new Date(startOfToday); s.setDate(s.getDate() - 1);
      const e = new Date(startOfToday); e.setMilliseconds(-1);
      return { from: s, to: e };
    }
    case 'last7': { const s = new Date(startOfToday); s.setDate(s.getDate() - 6); return { from: s, to: endOfToday }; }
    case 'last30': { const s = new Date(startOfToday); s.setDate(s.getDate() - 29); return { from: s, to: endOfToday }; }
    case 'thisMonth': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from: s, to: e };
    }
    case 'lastMonth': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from: s, to: e };
    }
    case 'custom': return { from: customFrom ?? startOfToday, to: customTo ?? endOfToday };
  }
}

@Component({
  selector: 'db-analytics',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="db-an">
  <header class="db-an__header">
    <h1 class="db-an__title">{{ 'analytics.title' | translate }}</h1>
  </header>

  <!-- Date Range Bar -->
  <div class="db-an__range-bar">
    @for (p of presets; track p.key) {
      <button class="db-an__preset" [class.db-an__preset--active]="activePreset === p.key"
        type="button" (click)="selectPreset(p.key)">{{ p.labelKey | translate }}</button>
    }
    @if (activePreset === 'custom') {
      <div class="db-an__custom-range">
        <input class="db-an__date-input" type="date" [(ngModel)]="customFromStr" (change)="applyCustom()" />
        <span class="db-an__range-sep">—</span>
        <input class="db-an__date-input" type="date" [(ngModel)]="customToStr" (change)="applyCustom()" />
      </div>
    }
  </div>

  <!-- Tab Bar -->
  <div class="db-an__tab-bar" role="tablist">
    @for (t of tabs; track t.key) {
      <button class="db-an__tab" [class.db-an__tab--active]="activeTab === t.key"
        role="tab" [attr.aria-selected]="activeTab === t.key" type="button"
        (click)="switchTab(t.key)">{{ t.labelKey | translate }}</button>
    }
  </div>

  <!-- ═══════════ TAB 1: REVENUE ═══════════ -->
  @if (activeTab === 'revenue') {
    <div class="db-an__tab-panel" role="tabpanel">

      @if (revenueError()) {
        <div class="db-an__error" role="alert">
          {{ 'analytics.error' | translate }}
          <button class="db-an__retry" type="button" (click)="loadRevenue()">{{ 'common.retry' | translate }}</button>
        </div>
      }

      <!-- 8 Revenue Cards -->
      <div class="db-an__cards db-an__cards--8">
        @if (revenueLoading()) {
          @for (_ of [1,2,3,4,5,6,7,8]; track $index) {
            <div class="db-an__card db-an__card--sk" aria-hidden="true">
              <span class="db-an__sk db-an__sk--label"></span>
              <span class="db-an__sk db-an__sk--value"></span>
            </div>
          }
        } @else if (revenueDetail()) {
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.rev_total' | translate }}</p>
            <p class="db-an__card-value">{{ formatCurrency(revenueDetail()!.totalRevenue) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.rev_delivery' | translate }}</p>
            <p class="db-an__card-value">{{ formatCurrency(revenueDetail()!.deliveryRevenue) }}</p>
            <p class="db-an__card-sub">{{ formatPercent(revenueDetail()!.deliveryRevenuePercent) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.rev_pickup' | translate }}</p>
            <p class="db-an__card-value">{{ formatCurrency(revenueDetail()!.pickupRevenue) }}</p>
            <p class="db-an__card-sub">{{ formatPercent(revenueDetail()!.pickupRevenuePercent) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.rev_dine_in' | translate }}</p>
            <p class="db-an__card-value">{{ formatCurrency(revenueDetail()!.dineInRevenue) }}</p>
            <p class="db-an__card-sub">{{ formatPercent(revenueDetail()!.dineInRevenuePercent) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.rev_discounts' | translate }}</p>
            <p class="db-an__card-value db-an__card-value--warn">{{ formatCurrency(revenueDetail()!.totalDiscounts) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.rev_net' | translate }}</p>
            <p class="db-an__card-value">{{ formatCurrency(revenueDetail()!.netRevenue) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.rev_tax' | translate }}</p>
            <p class="db-an__card-value">{{ formatCurrency(revenueDetail()!.taxCollected) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.rev_refunds' | translate }}</p>
            <p class="db-an__card-value db-an__card-value--danger">{{ formatCurrency(revenueDetail()!.refundsIssued) }}</p>
          </div>
        }
      </div>

      <!-- Revenue Over Time Chart -->
      <div class="db-an__chart-card">
        <div class="db-an__chart-card-header">
          <h2 class="db-an__chart-title">{{ 'analytics.revenue_chart_title' | translate }}</h2>
          <div class="db-an__period-tabs">
            @for (s of revenueSeries; track s.key) {
              <button class="db-an__period-tab" [class.db-an__period-tab--active]="activeRevenueSeries === s.key"
                type="button" (click)="setRevenueSeries(s.key)">{{ s.labelKey | translate }}</button>
            }
          </div>
        </div>
        @if (revenueLoading()) {
          <div class="db-an__chart-sk"></div>
        } @else if (!revenueDetail()?.revenueOverTime?.length) {
          <div class="db-an__empty-chart">{{ 'analytics.no_data' | translate }}</div>
        } @else {
          <div class="db-an__chart-wrap"><canvas #revenueOvertimeCanvas aria-hidden="true"></canvas></div>
        }
      </div>

      <!-- Revenue by Category Table -->
      <div class="db-an__table-card">
        <div class="db-an__table-card-header">
          <h2 class="db-an__chart-title">{{ 'analytics.rev_by_category' | translate }}</h2>
          <button class="db-an__export-btn" type="button" (click)="exportRevenueCsv()">{{ 'analytics.export_csv' | translate }}</button>
        </div>
        @if (revenueLoading()) {
          <div class="db-an__table-sk">@for (_ of [1,2,3]; track $index) { <div class="db-an__row-sk"></div> }</div>
        } @else if (!revenueDetail()?.revenueByCategory?.length) {
          <div class="db-an__empty-chart">{{ 'analytics.no_data' | translate }}</div>
        } @else {
          <table class="db-an__table" role="table">
            <thead class="db-an__thead">
              <tr>
                <th class="db-an__th" scope="col">{{ 'analytics.col_category' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_revenue' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_pct' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (cat of revenueDetail()!.revenueByCategory; track cat.categoryName) {
                <tr class="db-an__row">
                  <td class="db-an__td">{{ cat.categoryName }}</td>
                  <td class="db-an__td db-an__td--num">{{ formatCurrency(cat.revenue) }}</td>
                  <td class="db-an__td db-an__td--num">{{ formatPercent(cat.percentage) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  }

  <!-- ═══════════ TAB 2: ORDERS ═══════════ -->
  @if (activeTab === 'orders') {
    <div class="db-an__tab-panel" role="tabpanel">

      @if (ordersError()) {
        <div class="db-an__error" role="alert">
          {{ 'analytics.error' | translate }}
          <button class="db-an__retry" type="button" (click)="loadOrders()">{{ 'common.retry' | translate }}</button>
        </div>
      }

      <!-- 6 Orders Cards -->
      <div class="db-an__cards">
        @if (ordersLoading()) {
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <div class="db-an__card db-an__card--sk" aria-hidden="true">
              <span class="db-an__sk db-an__sk--label"></span>
              <span class="db-an__sk db-an__sk--value"></span>
            </div>
          }
        } @else if (ordersDetail()) {
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.ord_total' | translate }}</p>
            <p class="db-an__card-value">{{ ordersDetail()!.totalOrders }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.ord_completed' | translate }}</p>
            <p class="db-an__card-value">{{ ordersDetail()!.completedOrders }}</p>
            <p class="db-an__card-sub">{{ formatPercent(ordersDetail()!.completedPercent) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.ord_cancelled' | translate }}</p>
            <p class="db-an__card-value db-an__card-value--danger">{{ ordersDetail()!.cancelledOrders }}</p>
            <p class="db-an__card-sub">{{ formatPercent(ordersDetail()!.cancelledPercent) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.ord_avg_value' | translate }}</p>
            <p class="db-an__card-value">{{ formatCurrency(ordersDetail()!.avgOrderValue) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.ord_busiest_day' | translate }}</p>
            <p class="db-an__card-value db-an__card-value--sm">{{ translateDay(ordersDetail()!.busiestDay) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.ord_busiest_hour' | translate }}</p>
            <p class="db-an__card-value db-an__card-value--sm">{{ formatHour(ordersDetail()!.busiestHour) }}</p>
          </div>
        }
      </div>

      <!-- Charts Row: Orders by Status + Orders by Type -->
      <div class="db-an__charts-row">
        <div class="db-an__chart-card">
          <h2 class="db-an__chart-title">{{ 'analytics.orders_status_title' | translate }}</h2>
          @if (ordersLoading()) {
            <div class="db-an__chart-sk"></div>
          } @else if (!ordersDetail()?.totalOrders) {
            <div class="db-an__empty-chart">{{ 'analytics.no_data' | translate }}</div>
          } @else {
            <div class="db-an__donut-wrap"><canvas #statusCanvas aria-hidden="true"></canvas></div>
          }
        </div>
        <div class="db-an__chart-card">
          <h2 class="db-an__chart-title">{{ 'analytics.orders_type_title' | translate }}</h2>
          @if (ordersLoading()) {
            <div class="db-an__chart-sk"></div>
          } @else if (!ordersDetail()?.totalOrders) {
            <div class="db-an__empty-chart">{{ 'analytics.no_data' | translate }}</div>
          } @else {
            <div class="db-an__donut-wrap"><canvas #typeCanvas aria-hidden="true"></canvas></div>
          }
        </div>
      </div>

      <!-- Cancellation Reasons -->
      <div class="db-an__chart-card">
        <h2 class="db-an__chart-title">{{ 'analytics.cancel_reasons_title' | translate }}</h2>
        @if (ordersLoading()) {
          <div class="db-an__chart-sk"></div>
        } @else if (!ordersDetail()?.cancellationReasons?.length) {
          <div class="db-an__empty-chart">{{ 'analytics.no_data' | translate }}</div>
        } @else {
          <div class="db-an__bar-wrap"><canvas #cancelCanvas aria-hidden="true"></canvas></div>
        }
      </div>

      <!-- Export -->
      <div class="db-an__tab-actions">
        <button class="db-an__export-btn" type="button" (click)="exportOrdersCsv()">{{ 'analytics.export_csv' | translate }}</button>
      </div>
    </div>
  }

  <!-- ═══════════ TAB 3: CUSTOMERS ═══════════ -->
  @if (activeTab === 'customers') {
    <div class="db-an__tab-panel" role="tabpanel">

      @if (customersError()) {
        <div class="db-an__error" role="alert">
          {{ 'analytics.error' | translate }}
          <button class="db-an__retry" type="button" (click)="loadCustomers()">{{ 'common.retry' | translate }}</button>
        </div>
      }

      <!-- 6 Customer Cards -->
      <div class="db-an__cards">
        @if (customersLoading()) {
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <div class="db-an__card db-an__card--sk" aria-hidden="true">
              <span class="db-an__sk db-an__sk--label"></span>
              <span class="db-an__sk db-an__sk--value"></span>
            </div>
          }
        } @else if (customersDetail()) {
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.cust_total' | translate }}</p>
            <p class="db-an__card-value">{{ customersDetail()!.totalCustomers }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.cust_new' | translate }}</p>
            <p class="db-an__card-value">{{ customersDetail()!.newCustomers }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.cust_returning' | translate }}</p>
            <p class="db-an__card-value">{{ customersDetail()!.returningCustomers }}</p>
            <p class="db-an__card-sub">{{ formatPercent(customersDetail()!.returningPercent) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.cust_guest_orders' | translate }}</p>
            <p class="db-an__card-value">{{ customersDetail()!.guestOrders }}</p>
            <p class="db-an__card-sub">{{ formatPercent(customersDetail()!.guestPercent) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.cust_avg_orders' | translate }}</p>
            <p class="db-an__card-value">{{ customersDetail()!.avgOrdersPerCustomer.toFixed(1) }}</p>
          </div>
          <div class="db-an__card">
            <p class="db-an__card-label">{{ 'analytics.cust_clv' | translate }}</p>
            <p class="db-an__card-value">{{ formatCurrency(customersDetail()!.customerLifetimeValue) }}</p>
          </div>
        }
      </div>

      <!-- Top Customers Table -->
      <div class="db-an__table-card">
        <div class="db-an__table-card-header">
          <h2 class="db-an__chart-title">{{ 'analytics.cust_top_title' | translate }}</h2>
          <button class="db-an__export-btn" type="button" (click)="exportCustomersCsv()">{{ 'analytics.export_csv' | translate }}</button>
        </div>
        @if (customersLoading()) {
          <div class="db-an__table-sk">@for (_ of [1,2,3,4,5]; track $index) { <div class="db-an__row-sk"></div> }</div>
        } @else if (!customersDetail()?.topCustomers?.length) {
          <div class="db-an__empty-chart">{{ 'analytics.no_data' | translate }}</div>
        } @else {
          <table class="db-an__table" role="table">
            <thead class="db-an__thead">
              <tr>
                <th class="db-an__th" scope="col">{{ 'analytics.col_customer' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_orders' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_total_spent' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_last_order' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (c of customersDetail()!.topCustomers; track c.name; let i = $index) {
                <tr class="db-an__row">
                  <td class="db-an__td"><span class="db-an__rank">{{ i + 1 }}</span>{{ c.name }}</td>
                  <td class="db-an__td db-an__td--num">{{ c.orders }}</td>
                  <td class="db-an__td db-an__td--num">{{ formatCurrency(c.totalSpent) }}</td>
                  <td class="db-an__td db-an__td--num">{{ formatDate(c.lastOrder) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  }

  <!-- ═══════════ TAB 4: PRODUCTS ═══════════ -->
  @if (activeTab === 'products') {
    <div class="db-an__tab-panel" role="tabpanel">

      @if (productsError()) {
        <div class="db-an__error" role="alert">
          {{ 'analytics.error' | translate }}
          <button class="db-an__retry" type="button" (click)="loadProducts()">{{ 'common.retry' | translate }}</button>
        </div>
      }

      <!-- Top Sellers -->
      <div class="db-an__table-card">
        <div class="db-an__table-card-header">
          <h2 class="db-an__chart-title">{{ 'analytics.prod_top_sellers' | translate }}</h2>
          <button class="db-an__export-btn" type="button" (click)="exportProductsCsv()">{{ 'analytics.export_csv' | translate }}</button>
        </div>
        @if (productsLoading()) {
          <div class="db-an__table-sk">@for (_ of [1,2,3,4,5]; track $index) { <div class="db-an__row-sk"></div> }</div>
        } @else if (!productsDetail()?.topSellers?.length) {
          <div class="db-an__empty-chart">{{ 'analytics.no_data' | translate }}</div>
        } @else {
          <table class="db-an__table" role="table">
            <thead class="db-an__thead">
              <tr>
                <th class="db-an__th" scope="col">{{ 'analytics.col_item' | translate }}</th>
                <th class="db-an__th" scope="col">{{ 'analytics.col_category' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_units_sold' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_revenue' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (p of productsDetail()!.topSellers; track p.itemName; let i = $index) {
                <tr class="db-an__row">
                  <td class="db-an__td"><span class="db-an__rank">{{ i + 1 }}</span>{{ p.itemName }}</td>
                  <td class="db-an__td db-an__td--muted">{{ p.categoryName }}</td>
                  <td class="db-an__td db-an__td--num">{{ p.unitsSold }}</td>
                  <td class="db-an__td db-an__td--num">{{ formatCurrency(p.revenue) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Slow Movers -->
      <div class="db-an__table-card">
        <h2 class="db-an__chart-title">{{ 'analytics.prod_slow_movers' | translate }}</h2>
        @if (productsLoading()) {
          <div class="db-an__table-sk">@for (_ of [1,2,3]; track $index) { <div class="db-an__row-sk"></div> }</div>
        } @else if (!productsDetail()?.slowMovers?.length) {
          <div class="db-an__empty-chart">{{ 'analytics.no_data' | translate }}</div>
        } @else {
          <table class="db-an__table" role="table">
            <thead class="db-an__thead">
              <tr>
                <th class="db-an__th" scope="col">{{ 'analytics.col_item' | translate }}</th>
                <th class="db-an__th" scope="col">{{ 'analytics.col_category' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_units_sold' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_revenue' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (p of productsDetail()!.slowMovers; track p.itemName) {
                <tr class="db-an__row">
                  <td class="db-an__td">{{ p.itemName }}</td>
                  <td class="db-an__td db-an__td--muted">{{ p.categoryName }}</td>
                  <td class="db-an__td db-an__td--num db-an__td--warn">{{ p.unitsSold }}</td>
                  <td class="db-an__td db-an__td--num">{{ formatCurrency(p.revenue) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Category Performance -->
      <div class="db-an__table-card">
        <h2 class="db-an__chart-title">{{ 'analytics.prod_category_perf' | translate }}</h2>
        @if (productsLoading()) {
          <div class="db-an__table-sk">@for (_ of [1,2,3]; track $index) { <div class="db-an__row-sk"></div> }</div>
        } @else if (!productsDetail()?.categoryPerformance?.length) {
          <div class="db-an__empty-chart">{{ 'analytics.no_data' | translate }}</div>
        } @else {
          <table class="db-an__table" role="table">
            <thead class="db-an__thead">
              <tr>
                <th class="db-an__th" scope="col">{{ 'analytics.col_category' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_revenue' | translate }}</th>
                <th class="db-an__th db-an__th--num" scope="col">{{ 'analytics.col_orders' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (c of productsDetail()!.categoryPerformance; track c.categoryName) {
                <tr class="db-an__row">
                  <td class="db-an__td">{{ c.categoryName }}</td>
                  <td class="db-an__td db-an__td--num">{{ formatCurrency(c.revenue) }}</td>
                  <td class="db-an__td db-an__td--num">{{ c.orderCount }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  }
</div>
  `,
  styles: [`
    .db-an { padding-block: var(--space-xl, 2rem); padding-inline: var(--space-xl, 2rem); }
    .db-an__header { margin-block-end: 1.25rem; }
    .db-an__title { font-size: 1.375rem; font-weight: 700; color: var(--text); margin: 0; }

    /* Range bar */
    .db-an__range-bar {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem;
      margin-block-end: 1rem;
    }
    .db-an__preset {
      padding-block: 0.375rem; padding-inline: 0.75rem; font-size: 0.8125rem; font-weight: 500;
      font-family: inherit; border: 1px solid var(--border); border-radius: var(--radius-control);
      background: var(--surface); color: var(--text-muted); cursor: pointer;
      transition: all var(--motion-fast) ease; white-space: nowrap;
    }
    .db-an__preset:hover { background: var(--surface-alt); color: var(--text); }
    .db-an__preset--active {
      background: var(--accent); color: var(--on-accent); border-color: var(--accent); font-weight: 600;
    }
    .db-an__preset--active:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
    .db-an__custom-range { display: flex; align-items: center; gap: 0.375rem; margin-inline-start: 0.25rem; }
    .db-an__date-input {
      font-family: inherit; font-size: 0.8125rem; color: var(--text); background: var(--surface);
      border: 1px solid var(--border); border-radius: var(--radius-control);
      padding-block: 0.3125rem; padding-inline: 0.5rem; outline: none; cursor: pointer;
    }
    .db-an__date-input:focus { border-color: var(--accent); }
    .db-an__range-sep { color: var(--text-muted); font-size: 0.875rem; }

    /* Tabs */
    .db-an__tab-bar {
      display: flex; gap: 0; border-block-end: 2px solid var(--border);
      margin-block-end: 1.5rem; overflow-x: auto;
    }
    .db-an__tab {
      padding-block: 0.75rem; padding-inline: 1.125rem; font-size: 0.875rem; font-weight: 500;
      font-family: inherit; border: none; background: transparent; color: var(--text-muted);
      cursor: pointer; white-space: nowrap; position: relative;
      border-block-end: 2px solid transparent; margin-block-end: -2px;
      transition: color var(--motion-fast) ease;
    }
    .db-an__tab:hover { color: var(--text); }
    .db-an__tab--active { color: var(--accent); font-weight: 600; border-block-end-color: var(--accent); }

    /* Tab panel */
    .db-an__tab-panel { animation: db-an-fadein 0.15s ease; }
    @keyframes db-an-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

    /* Error */
    .db-an__error {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem;
      background: color-mix(in srgb, var(--error) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
      border-radius: var(--radius-card); color: var(--error); font-size: 0.875rem;
      margin-block-end: 1.25rem;
    }
    .db-an__retry {
      padding-block: 0.25rem; padding-inline: 0.75rem; font-size: 0.8125rem;
      font-family: inherit; font-weight: 600; background: var(--accent); color: var(--on-accent);
      border: none; border-radius: var(--radius-control); cursor: pointer;
    }

    /* Cards */
    .db-an__cards {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.75rem; margin-block-end: 1.25rem;
    }
    .db-an__cards--8 { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
    .db-an__card {
      padding: 1rem; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-card);
    }
    .db-an__card--sk { min-block-size: 76px; display: flex; flex-direction: column; justify-content: center; gap: 0.5rem; }
    .db-an__card-label {
      font-size: 0.6875rem; font-weight: 700; color: var(--text-subtle);
      text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 0.25rem;
    }
    .db-an__card-value { font-size: 1.25rem; font-weight: 700; color: var(--text); margin: 0; font-variant-numeric: tabular-nums; }
    .db-an__card-value--sm { font-size: 1rem; }
    .db-an__card-value--warn { color: var(--warning, #f59e0b); }
    .db-an__card-value--danger { color: var(--error); }
    .db-an__card-sub { font-size: 0.75rem; color: var(--text-muted); margin: 0.1875rem 0 0; font-variant-numeric: tabular-nums; }

    /* Skeletons */
    .db-an__sk {
      display: block; border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%; animation: db-an-shimmer 1.4s infinite;
    }
    .db-an__sk--label { block-size: 10px; inline-size: 80px; }
    .db-an__sk--value { block-size: 26px; inline-size: 100px; }
    @keyframes db-an-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Chart cards */
    .db-an__chart-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-card);
      padding: 1.25rem; margin-block-end: 1rem;
    }
    .db-an__chart-card-header {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
      gap: 0.5rem; margin-block-end: 1rem;
    }
    .db-an__chart-title { font-size: 0.9375rem; font-weight: 600; color: var(--text); margin: 0 0 0.875rem; }
    .db-an__chart-card-header .db-an__chart-title { margin: 0; }

    .db-an__period-tabs { display: flex; gap: 0.25rem; }
    .db-an__period-tab {
      padding-block: 0.3125rem; padding-inline: 0.625rem; font-size: 0.75rem; font-weight: 500;
      font-family: inherit; border: 1px solid var(--border); border-radius: var(--radius-control);
      background: transparent; color: var(--text-muted); cursor: pointer; transition: all var(--motion-fast) ease;
    }
    .db-an__period-tab--active { background: var(--accent); color: var(--on-accent); border-color: var(--accent); font-weight: 600; }

    .db-an__chart-wrap { position: relative; block-size: 220px; }
    .db-an__chart-wrap canvas { block-size: 100% !important; inline-size: 100% !important; }
    .db-an__donut-wrap { position: relative; block-size: 200px; display: flex; align-items: center; justify-content: center; }
    .db-an__donut-wrap canvas { max-block-size: 200px; max-inline-size: 200px; }
    .db-an__bar-wrap { position: relative; block-size: 200px; }
    .db-an__bar-wrap canvas { block-size: 100% !important; inline-size: 100% !important; }
    .db-an__chart-sk {
      block-size: 220px; border-radius: var(--radius-card);
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%; animation: db-an-shimmer 1.4s infinite;
    }
    .db-an__empty-chart {
      block-size: 120px; display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); font-size: 0.875rem;
    }
    .db-an__charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-block-end: 1rem; }
    @media (max-width: 767px) { .db-an__charts-row { grid-template-columns: 1fr; } }

    /* Tables */
    .db-an__table-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-card);
      overflow-x: auto; padding: 1.25rem; margin-block-end: 1.25rem;
    }
    .db-an__table-card-header {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
      gap: 0.5rem; margin-block-end: 1rem;
    }
    .db-an__table-card-header .db-an__chart-title { margin: 0; }
    .db-an__table { inline-size: 100%; min-inline-size: 420px; border-collapse: collapse; font-size: 0.875rem; }
    .db-an__thead { border-block-end: 1px solid var(--border); }
    .db-an__th {
      padding-block: 0.5rem; padding-inline: 0.5rem; text-align: start;
      font-size: 0.6875rem; font-weight: 700; color: var(--text-subtle);
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .db-an__th--num { text-align: end; }
    .db-an__row { border-block-end: 1px solid var(--border); }
    .db-an__row:last-child { border-block-end: none; }
    .db-an__row:hover { background: var(--surface-alt); }
    .db-an__td { padding-block: 0.625rem; padding-inline: 0.5rem; color: var(--text); vertical-align: middle; }
    .db-an__td--num { text-align: end; font-variant-numeric: tabular-nums; color: var(--text-muted); }
    .db-an__td--muted { color: var(--text-muted); font-size: 0.8125rem; }
    .db-an__td--warn { color: var(--warning, #f59e0b); }
    .db-an__rank {
      display: inline-flex; align-items: center; justify-content: center;
      inline-size: 1.375rem; block-size: 1.375rem; border-radius: 50%;
      background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent);
      font-size: 0.75rem; font-weight: 700; margin-inline-end: 0.5rem;
    }
    .db-an__table-sk { display: flex; flex-direction: column; gap: 0.5rem; padding-block: 0.5rem; }
    .db-an__row-sk {
      block-size: 36px; border-radius: 4px;
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%; animation: db-an-shimmer 1.4s infinite;
    }

    /* Export / actions */
    .db-an__export-btn {
      padding-block: 0.375rem; padding-inline: 0.875rem; font-size: 0.8125rem; font-weight: 600;
      font-family: inherit; border: 1px solid var(--border); border-radius: var(--radius-control);
      background: var(--surface); color: var(--text); cursor: pointer; white-space: nowrap;
      transition: background-color var(--motion-fast) ease;
    }
    .db-an__export-btn:hover { background: var(--surface-alt); }
    .db-an__tab-actions { display: flex; justify-content: flex-end; margin-block-end: 1rem; }

    @media (max-width: 480px) {
      .db-an__cards--8 { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('revenueOvertimeCanvas') revenueOvertimeCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusCanvas') statusCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeCanvas') typeCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cancelCanvas') cancelCanvasRef?: ElementRef<HTMLCanvasElement>;

  private revenueOvertimeChart?: Chart;
  private statusChart?: Chart;
  private typeChart?: Chart;
  private cancelChart?: Chart;

  readonly revenueDetail = signal<RevenueDetail | null>(null);
  readonly ordersDetail = signal<OrdersDetail | null>(null);
  readonly customersDetail = signal<CustomersDetail | null>(null);
  readonly productsDetail = signal<ProductsDetail | null>(null);

  readonly revenueLoading = signal(false);
  readonly ordersLoading = signal(false);
  readonly customersLoading = signal(false);
  readonly productsLoading = signal(false);

  readonly revenueError = signal(false);
  readonly ordersError = signal(false);
  readonly customersError = signal(false);
  readonly productsError = signal(false);

  activeTab: AnalyticsTab = 'revenue';
  activePreset: DateRangePreset = 'last7';
  activeRevenueSeries: 'total' | 'net' | 'refunds' = 'total';
  customFromStr = '';
  customToStr = '';

  private currentRange: DateRange = getRangeForPreset('last7');
  private loadedTabs = new Set<AnalyticsTab>();

  readonly tabs = [
    { key: 'revenue' as AnalyticsTab, labelKey: 'analytics.tab_revenue' },
    { key: 'orders' as AnalyticsTab, labelKey: 'analytics.tab_orders' },
    { key: 'customers' as AnalyticsTab, labelKey: 'analytics.tab_customers' },
    { key: 'products' as AnalyticsTab, labelKey: 'analytics.tab_products' },
  ];

  readonly presets: { key: DateRangePreset; labelKey: string }[] = [
    { key: 'today', labelKey: 'analytics.preset_today' },
    { key: 'yesterday', labelKey: 'analytics.preset_yesterday' },
    { key: 'last7', labelKey: 'analytics.preset_last7' },
    { key: 'last30', labelKey: 'analytics.preset_last30' },
    { key: 'thisMonth', labelKey: 'analytics.preset_this_month' },
    { key: 'lastMonth', labelKey: 'analytics.preset_last_month' },
    { key: 'custom', labelKey: 'analytics.preset_custom' },
  ];

  readonly revenueSeries = [
    { key: 'total' as const, labelKey: 'analytics.rev_series_total' },
    { key: 'net' as const, labelKey: 'analytics.rev_series_net' },
    { key: 'refunds' as const, labelKey: 'analytics.rev_series_refunds' },
  ];

  ngOnInit(): void {
    this.currentRange = getRangeForPreset(this.activePreset);
    this.loadActiveTab();
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  switchTab(tab: AnalyticsTab): void {
    this.destroyAllCharts();
    this.activeTab = tab;
    this.loadActiveTab();
  }

  selectPreset(preset: DateRangePreset): void {
    this.activePreset = preset;
    if (preset !== 'custom') {
      this.currentRange = getRangeForPreset(preset);
      this.invalidateAndReload();
    }
  }

  applyCustom(): void {
    if (!this.customFromStr || !this.customToStr) return;
    const from = new Date(this.customFromStr + 'T00:00:00');
    const to = new Date(this.customToStr + 'T23:59:59');
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return;
    this.currentRange = { from, to };
    this.invalidateAndReload();
  }

  setRevenueSeries(s: 'total' | 'net' | 'refunds'): void {
    this.activeRevenueSeries = s;
    if (this.revenueDetail()) {
      this.cdr.detectChanges();
      setTimeout(() => this.renderRevenueOvertimeChart(), 0);
    }
  }

  loadRevenue(): void {
    this.revenueLoading.set(true);
    this.revenueError.set(false);
    this.analyticsService.getRevenueDetail(this.currentRange.from, this.currentRange.to).subscribe({
      next: (data) => {
        this.revenueDetail.set(data);
        this.revenueLoading.set(false);
        this.loadedTabs.add('revenue');
        this.cdr.detectChanges();
        setTimeout(() => this.renderRevenueOvertimeChart(), 0);
      },
      error: () => { this.revenueLoading.set(false); this.revenueError.set(true); },
    });
  }

  loadOrders(): void {
    this.ordersLoading.set(true);
    this.ordersError.set(false);
    this.analyticsService.getOrdersDetail(this.currentRange.from, this.currentRange.to).subscribe({
      next: (data) => {
        this.ordersDetail.set(data);
        this.ordersLoading.set(false);
        this.loadedTabs.add('orders');
        this.cdr.detectChanges();
        setTimeout(() => {
          this.renderStatusChart();
          this.renderTypeChart();
          this.renderCancelChart();
        }, 0);
      },
      error: () => { this.ordersLoading.set(false); this.ordersError.set(true); },
    });
  }

  loadCustomers(): void {
    this.customersLoading.set(true);
    this.customersError.set(false);
    this.analyticsService.getCustomersDetail(this.currentRange.from, this.currentRange.to).subscribe({
      next: (data) => {
        this.customersDetail.set(data);
        this.customersLoading.set(false);
        this.loadedTabs.add('customers');
      },
      error: () => { this.customersLoading.set(false); this.customersError.set(true); },
    });
  }

  loadProducts(): void {
    this.productsLoading.set(true);
    this.productsError.set(false);
    this.analyticsService.getProductsDetail(this.currentRange.from, this.currentRange.to).subscribe({
      next: (data) => {
        this.productsDetail.set(data);
        this.productsLoading.set(false);
        this.loadedTabs.add('products');
      },
      error: () => { this.productsLoading.set(false); this.productsError.set(true); },
    });
  }

  private loadActiveTab(): void {
    if (!this.loadedTabs.has(this.activeTab)) {
      switch (this.activeTab) {
        case 'revenue': this.loadRevenue(); break;
        case 'orders': this.loadOrders(); break;
        case 'customers': this.loadCustomers(); break;
        case 'products': this.loadProducts(); break;
      }
    } else {
      this.cdr.detectChanges();
      setTimeout(() => this.renderChartsForTab(this.activeTab), 0);
    }
  }

  private invalidateAndReload(): void {
    this.loadedTabs.clear();
    this.revenueDetail.set(null);
    this.ordersDetail.set(null);
    this.customersDetail.set(null);
    this.productsDetail.set(null);
    this.destroyAllCharts();
    this.loadActiveTab();
  }

  private renderChartsForTab(tab: AnalyticsTab): void {
    if (tab === 'revenue') this.renderRevenueOvertimeChart();
    if (tab === 'orders') { this.renderStatusChart(); this.renderTypeChart(); this.renderCancelChart(); }
  }

  private destroyAllCharts(): void {
    this.revenueOvertimeChart?.destroy(); this.revenueOvertimeChart = undefined;
    this.statusChart?.destroy(); this.statusChart = undefined;
    this.typeChart?.destroy(); this.typeChart = undefined;
    this.cancelChart?.destroy(); this.cancelChart = undefined;
  }

  private css(prop: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  private renderRevenueOvertimeChart(): void {
    const canvas = this.revenueOvertimeCanvasRef?.nativeElement;
    if (!canvas) return;
    this.revenueOvertimeChart?.destroy();
    const data = this.revenueDetail()?.revenueOverTime ?? [];
    if (!data.length) return;
    const accent = this.css('--accent');
    const muted = this.css('--text-muted');
    const border = this.css('--border');
    const labels = data.map((d) => this.formatDateLabel(d.date));
    const seriesData = data.map((d) =>
      this.activeRevenueSeries === 'net' ? d.net : this.activeRevenueSeries === 'refunds' ? d.refunds : d.total
    );
    this.revenueOvertimeChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: this.translate.instant(`analytics.rev_series_${this.activeRevenueSeries}`),
          data: seriesData,
          borderColor: accent,
          backgroundColor: `${accent}1a`,
          borderWidth: 2, fill: true, tension: 0.3,
          pointRadius: data.length > 30 ? 0 : 3, pointHoverRadius: 5,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${this.formatCurrency(ctx.parsed.y ?? 0)}` } },
        },
        scales: {
          x: { grid: { color: border }, ticks: { color: muted, font: { size: 11 }, maxTicksLimit: 12 } },
          y: { grid: { color: border }, ticks: { color: muted, font: { size: 11 }, callback: (v) => this.formatCurrency(Number(v)) }, beginAtZero: true },
        },
      },
    });
  }

  private renderStatusChart(): void {
    const canvas = this.statusCanvasRef?.nativeElement;
    if (!canvas) return;
    this.statusChart?.destroy();
    const d = this.ordersDetail();
    if (!d?.totalOrders) return;
    const items = [
      { label: this.translate.instant('orders.status_delivered'), value: d.completedOrders },
      { label: this.translate.instant('orders.status_cancelled'), value: d.cancelledOrders },
      { label: this.translate.instant('analytics.ord_other'), value: Math.max(0, d.totalOrders - d.completedOrders - d.cancelledOrders) },
    ].filter((i) => i.value > 0);
    const accent = this.css('--accent');
    const muted = this.css('--text-muted');
    const surface = this.css('--surface');
    const palette = [accent, `${accent}99`, `${accent}55`];
    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: items.map((i) => i.label),
        datasets: [{ data: items.map((i) => i.value), backgroundColor: palette.slice(0, items.length), borderWidth: 2, borderColor: surface }],
      },
      options: { responsive: true, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: muted, font: { size: 11 }, boxWidth: 12, padding: 12 } } } },
    });
  }

  private renderTypeChart(): void {
    const canvas = this.typeCanvasRef?.nativeElement;
    if (!canvas) return;
    this.typeChart?.destroy();
    const d = this.ordersDetail();
    if (!d?.totalOrders) return;
    const items = [
      { label: this.translate.instant('orders.type_delivery'), value: d.deliveryOrders },
      { label: this.translate.instant('orders.type_pickup'), value: d.pickupOrders },
      { label: this.translate.instant('orders.type_dine_in'), value: d.dineInOrders },
    ].filter((i) => i.value > 0);
    const accent = this.css('--accent');
    const muted = this.css('--text-muted');
    const surface = this.css('--surface');
    const palette = [`${accent}ee`, `${accent}99`, `${accent}55`];
    this.typeChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: items.map((i) => i.label),
        datasets: [{ data: items.map((i) => i.value), backgroundColor: palette.slice(0, items.length), borderWidth: 2, borderColor: surface }],
      },
      options: { responsive: true, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: muted, font: { size: 11 }, boxWidth: 12, padding: 12 } } } },
    });
  }

  private renderCancelChart(): void {
    const canvas = this.cancelCanvasRef?.nativeElement;
    if (!canvas) return;
    this.cancelChart?.destroy();
    const reasons = this.ordersDetail()?.cancellationReasons ?? [];
    if (!reasons.length) return;
    const accent = this.css('--accent');
    const muted = this.css('--text-muted');
    const border = this.css('--border');
    this.cancelChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: reasons.map((r) => r.reason),
        datasets: [{ label: this.translate.instant('analytics.col_orders'), data: reasons.map((r) => r.count), backgroundColor: `${accent}cc`, borderColor: accent, borderWidth: 1, borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: border }, ticks: { color: muted, font: { size: 11 } }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: muted, font: { size: 11 } } },
        },
      },
    });
  }

  private formatDateLabel(iso: string): string {
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return iso; }
  }

  formatCurrency(value: number): string {
    if (value == null || isNaN(value)) return '—';
    return `${Number(value).toFixed(3)} KD`;
  }

  formatPercent(value: number): string {
    if (value == null || isNaN(value)) return '—';
    return `${Number(value).toFixed(1)}%`;
  }

  formatHour(hour: number): string {
    if (hour < 0 || hour == null) return '—';
    const h12 = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h12}:00 ${ampm}`;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(); } catch { return '—'; }
  }

  translateDay(day: string): string {
    if (!day) return '—';
    const key = `analytics.day_${day.toLowerCase()}`;
    const t = this.translate.instant(key);
    return t === key ? day : t;
  }

  exportRevenueCsv(): void {
    const d = this.revenueDetail();
    if (!d) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Metric', 'Value'],
      ['Total Revenue', d.totalRevenue],
      ['Delivery Revenue', d.deliveryRevenue],
      ['Pickup Revenue', d.pickupRevenue],
      ['Dine-In Revenue', d.dineInRevenue],
      ['Discounts Given', d.totalDiscounts],
      ['Net Revenue', d.netRevenue],
      ['Tax Collected', d.taxCollected],
      ['Refunds Issued', d.refundsIssued],
    ]), 'Summary');
    if (d.revenueOverTime.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.revenueOverTime.map((r) => ({ Date: this.formatDateLabel(r.date), Total: r.total, Net: r.net, Refunds: r.refunds }))), 'Revenue Over Time');
    }
    if (d.revenueByCategory.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.revenueByCategory.map((c) => ({ Category: c.categoryName, Revenue: c.revenue, '%': c.percentage }))), 'By Category');
    }
    XLSX.writeFile(wb, `revenue_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  exportOrdersCsv(): void {
    const d = this.ordersDetail();
    if (!d) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Metric', 'Value'],
      ['Total Orders', d.totalOrders],
      ['Completed', d.completedOrders],
      ['Cancelled', d.cancelledOrders],
      ['Avg Order Value', d.avgOrderValue],
      ['Busiest Day', d.busiestDay],
      ['Busiest Hour', this.formatHour(d.busiestHour)],
      ['Delivery Orders', d.deliveryOrders],
      ['Pickup Orders', d.pickupOrders],
      ['Dine-In Orders', d.dineInOrders],
    ]), 'Orders Summary');
    if (d.cancellationReasons.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.cancellationReasons.map((r) => ({ Reason: r.reason, Count: r.count }))), 'Cancellation Reasons');
    }
    XLSX.writeFile(wb, `orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  exportCustomersCsv(): void {
    const d = this.customersDetail();
    if (!d) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Metric', 'Value'],
      ['Total Customers', d.totalCustomers],
      ['New Customers', d.newCustomers],
      ['Returning Customers', d.returningCustomers],
      ['Guest Orders', d.guestOrders],
      ['Avg Orders/Customer', d.avgOrdersPerCustomer],
      ['Customer Lifetime Value', d.customerLifetimeValue],
    ]), 'Customers Summary');
    if (d.topCustomers.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.topCustomers.map((c) => ({ Name: c.name, Orders: c.orders, 'Total Spent': c.totalSpent, 'Last Order': this.formatDate(c.lastOrder) }))), 'Top Customers');
    }
    XLSX.writeFile(wb, `customers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  exportProductsCsv(): void {
    const d = this.productsDetail();
    if (!d) return;
    const wb = XLSX.utils.book_new();
    if (d.topSellers.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.topSellers.map((p, i) => ({ Rank: i + 1, Item: p.itemName, Category: p.categoryName, 'Units Sold': p.unitsSold, Revenue: p.revenue }))), 'Top Sellers');
    if (d.slowMovers.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.slowMovers.map((p) => ({ Item: p.itemName, Category: p.categoryName, 'Units Sold': p.unitsSold, Revenue: p.revenue }))), 'Slow Movers');
    if (d.categoryPerformance.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d.categoryPerformance.map((c) => ({ Category: c.categoryName, Revenue: c.revenue, Orders: c.orderCount }))), 'Category Performance');
    XLSX.writeFile(wb, `products_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}
