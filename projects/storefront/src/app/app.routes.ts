import { Routes } from '@angular/router';
import { languageGuard } from './core/guards/language.guard';
import {
  isRestaurantTenant,
  isRetailTenant,
  isServiceTenant,
} from './core/guards/business-type.guard';

/**
 * M33 routing — template-dispatched routes under /:lang.
 *
 * The `:lang` shell activates the StorefrontShellComponent which wraps all
 * content pages with header + footer.  Business-type guards (canMatch) ensure
 * only the matching template chunk is loaded — separate lazy bundles for
 * restaurant / retail / service.
 *
 * The shared `/search` route is available for all business types.
 */
export const routes: Routes = [
  // Root redirect: / → /en/
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'en',
  },

  // 404 must appear BEFORE :lang so /404 never hits the param guard
  {
    path: '404',
    loadComponent: () =>
      import('./features/error-pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },

  // Language shell: /en/ and /ar/
  {
    path: ':lang',
    canActivate: [languageGuard],
    loadComponent: () =>
      import('./features/shell/storefront-shell.component').then(
        (m) => m.StorefrontShellComponent,
      ),
    children: [
      // Restaurant template (loaded only when businessType === 'restaurant')
      {
        path: '',
        canMatch: [isRestaurantTenant],
        loadChildren: () =>
          import('./features/templates/restaurant/restaurant.routes').then(
            (m) => m.restaurantRoutes,
          ),
      },
      // Retail template (loaded only when businessType === 'retail')
      {
        path: '',
        canMatch: [isRetailTenant],
        loadChildren: () =>
          import('./features/templates/retail/retail.routes').then(
            (m) => m.retailRoutes,
          ),
      },
      // Service template (loaded only when businessType === 'service')
      {
        path: '',
        canMatch: [isServiceTenant],
        loadChildren: () =>
          import('./features/templates/service/service.routes').then(
            (m) => m.serviceRoutes,
          ),
      },
      // Search page (all business types)
      {
        path: 'search',
        loadComponent: () =>
          import(
            './features/shared-catalog/search-results/search-results.component'
          ).then((m) => m.SearchResultsComponent),
      },
      // Cart (shared across all business types)
      {
        path: 'cart',
        loadComponent: () =>
          import('./features/cart/cart-page.component').then(
            (m) => m.CartPageComponent,
          ),
      },
      // Checkout flow
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout-page.component').then(
            (m) => m.CheckoutPageComponent,
          ),
      },
      // Order confirmation (after payment)
      {
        path: 'order-confirmation/:orderId',
        loadComponent: () =>
          import('./features/checkout/order-confirmation/order-confirmation.component').then(
            (m) => m.OrderConfirmationComponent,
          ),
      },
      // Order tracking (real-time SignalR)
      {
        path: 'order-tracking/:orderId',
        loadComponent: () =>
          import('./features/order-tracking/order-tracking.component').then(
            (m) => m.OrderTrackingComponent,
          ),
      },
      // Maintenance route — rendered by SSR server for suspended tenants
      {
        path: 'maintenance',
        loadComponent: () =>
          import(
            './features/error-pages/maintenance/maintenance.component'
          ).then((m) => m.MaintenanceComponent),
      },
      // Placeholder routes — redirect to home until full pages are built
      { path: 'login', redirectTo: '' },
      { path: 'account', redirectTo: '' },
      { path: 'privacy', redirectTo: '' },
      { path: 'terms', redirectTo: '' },
      // Fallback for unknown routes within a language
      { path: '**', redirectTo: '/404' },
    ],
  },

  // Catch-all
  { path: '**', redirectTo: '404' },
];
