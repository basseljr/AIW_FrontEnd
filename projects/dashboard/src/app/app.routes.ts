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
