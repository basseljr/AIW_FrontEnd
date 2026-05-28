import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/shell/layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/overview/overview.component').then((m) => m.OverviewComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders-list/orders-list.component').then(
            (m) => m.OrdersListComponent,
          ),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/orders/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent,
          ),
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./features/menu/menu.component').then((m) => m.MenuComponent),
      },
      {
        path: 'modifiers',
        loadComponent: () =>
          import('./features/modifiers/modifiers.component').then((m) => m.ModifiersComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then((m) => m.ProductsComponent),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'branches',
        loadComponent: () =>
          import('./features/branches/branches.component').then((m) => m.BranchesComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.CustomersComponent),
      },
      {
        path: 'customers/blacklist',
        loadComponent: () =>
          import('./features/customers/blacklist/blacklist.component').then((m) => m.BlacklistComponent),
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import('./features/customers/customer-profile/customer-profile.component').then(
            (m) => m.CustomerProfileComponent,
          ),
      },
      {
        path: 'coupons',
        loadComponent: () =>
          import('./features/coupons/coupons.component').then((m) => m.CouponsComponent),
      },
      {
        path: 'loyalty',
        loadComponent: () =>
          import('./features/loyalty/loyalty.component').then((m) => m.LoyaltyComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics.component').then((m) => m.AnalyticsComponent),
      },
      {
        path: 'staff',
        loadComponent: () =>
          import('./features/staff/staff.component').then((m) => m.StaffComponent),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/billing/billing.component').then((m) => m.BillingComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/payments.component').then((m) => m.PaymentsComponent),
      },
      {
        path: 'reservations',
        loadComponent: () =>
          import('./features/reservations/reservations.component').then(
            (m) => m.ReservationsComponent,
          ),
      },
    ],
  },
  {
    path: 'kds',
    loadComponent: () =>
      import('./features/kds/kds.component').then((m) => m.KdsComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
