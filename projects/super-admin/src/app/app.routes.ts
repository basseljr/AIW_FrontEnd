import { Routes } from '@angular/router';

import { superAdminAuthGuard } from './core/guards/super-admin-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/super-admin-login.component').then(
        (m) => m.SuperAdminLoginComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/shell/layout/super-admin-layout.component').then(
        (m) => m.SuperAdminLayoutComponent,
      ),
    canActivate: [superAdminAuthGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/overview/overview.component').then((m) => m.OverviewComponent),
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./features/leads/leads.component').then((m) => m.LeadsComponent),
      },
      {
        path: 'leads/:id',
        loadComponent: () =>
          import('./features/leads/lead-detail/lead-detail.component').then(
            (m) => m.LeadDetailComponent,
          ),
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./features/tenants/tenants.component').then((m) => m.TenantsComponent),
      },
      {
        path: 'tenants/:id',
        loadComponent: () =>
          import('./features/tenants/tenant-detail/tenant-detail.component').then(
            (m) => m.TenantDetailComponent,
          ),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./features/subscriptions/subscriptions.component').then(
            (m) => m.SubscriptionsComponent,
          ),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/billing/billing.component').then((m) => m.BillingComponent),
      },
      {
        path: 'commission',
        loadComponent: () =>
          import('./features/commission/commission.component').then((m) => m.CommissionComponent),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoices.component').then((m) => m.InvoicesComponent),
      },
      {
        path: 'feature-flags',
        loadComponent: () =>
          import('./features/feature-flags/feature-flags.component').then(
            (m) => m.FeatureFlagsComponent,
          ),
      },
      {
        path: 'templates',
        loadComponent: () =>
          import('./features/templates/templates.component').then((m) => m.TemplatesComponent),
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/plans/plans.component').then((m) => m.PlansComponent),
      },
      {
        path: 'delivery-providers',
        loadComponent: () =>
          import('./features/delivery-providers/delivery-providers.component').then(
            (m) => m.DeliveryProvidersComponent,
          ),
      },
      {
        path: 'payment-gateways',
        loadComponent: () =>
          import('./features/payment-gateways/payment-gateways.component').then(
            (m) => m.PaymentGatewaysComponent,
          ),
      },
      {
        path: 'comms-providers',
        loadComponent: () =>
          import('./features/comms-providers/comms-providers.component').then(
            (m) => m.CommsProvidersComponent,
          ),
      },
      {
        path: 'health',
        loadComponent: () =>
          import('./features/health/health.component').then((m) => m.HealthComponent),
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./features/audit-log/audit-log.component').then((m) => m.AuditLogComponent),
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./features/jobs/jobs.component').then((m) => m.JobsComponent),
      },
      {
        path: 'errors',
        loadComponent: () =>
          import('./features/errors/errors.component').then((m) => m.ErrorsComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
