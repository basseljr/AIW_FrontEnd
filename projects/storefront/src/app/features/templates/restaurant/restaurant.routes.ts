import { Routes } from '@angular/router';

export const restaurantRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/restaurant-home.component').then(
        (m) => m.RestaurantHomeComponent,
      ),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./pages/menu/restaurant-menu.component').then(
        (m) => m.RestaurantMenuComponent,
      ),
  },
  {
    path: 'menu/:categorySlug',
    loadComponent: () =>
      import('./pages/menu/restaurant-menu.component').then(
        (m) => m.RestaurantMenuComponent,
      ),
  },
  {
    path: 'menu/:categorySlug/:itemSlug',
    loadComponent: () =>
      import('./pages/item-detail/restaurant-item-detail.component').then(
        (m) => m.RestaurantItemDetailComponent,
      ),
  },
];
