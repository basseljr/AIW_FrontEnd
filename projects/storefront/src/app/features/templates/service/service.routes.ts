import { Routes } from '@angular/router';

export const serviceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/service-home.component').then(
        (m) => m.ServiceHomeComponent,
      ),
  },
  {
    path: 'services',
    loadComponent: () =>
      import('./pages/services/service-list.component').then(
        (m) => m.ServiceListComponent,
      ),
  },
  {
    path: 'services/:serviceSlug',
    loadComponent: () =>
      import('./pages/service-detail/service-detail.component').then(
        (m) => m.ServiceDetailComponent,
      ),
  },
];
