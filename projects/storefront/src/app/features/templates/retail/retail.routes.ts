import { Routes } from '@angular/router';

export const retailRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/retail-home.component').then(
        (m) => m.RetailHomeComponent,
      ),
  },
  {
    path: 'shop',
    loadComponent: () =>
      import('./pages/catalog/retail-catalog.component').then(
        (m) => m.RetailCatalogComponent,
      ),
  },
  {
    path: 'shop/:categorySlug',
    loadComponent: () =>
      import('./pages/catalog/retail-catalog.component').then(
        (m) => m.RetailCatalogComponent,
      ),
  },
  {
    path: 'shop/:categorySlug/:productSlug',
    loadComponent: () =>
      import('./pages/product-detail/retail-product-detail.component').then(
        (m) => m.RetailProductDetailComponent,
      ),
  },
];
