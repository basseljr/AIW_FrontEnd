import { Routes } from '@angular/router';
import { languageGuard } from './core/guards/language.guard';
import {
  isRestaurantTenant,
  isRetailTenant,
  isServiceTenant,
} from './core/guards/business-type.guard';
import { authGuard } from './core/guards/auth.guard';

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
      // Auth pages
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      // Customer account (guarded)
      {
        path: 'account',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/account-shell.component').then(
            (m) => m.AccountShellComponent,
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/account/overview/account-overview.component').then(
                (m) => m.AccountOverviewComponent,
              ),
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('./features/account/orders/account-orders.component').then(
                (m) => m.AccountOrdersComponent,
              ),
          },
          {
            path: 'addresses',
            loadComponent: () =>
              import('./features/account/addresses/account-addresses.component').then(
                (m) => m.AccountAddressesComponent,
              ),
          },
          {
            path: 'wishlist',
            loadComponent: () =>
              import('./features/account/wishlist/account-wishlist.component').then(
                (m) => m.AccountWishlistComponent,
              ),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./features/account/settings/account-settings.component').then(
                (m) => m.AccountSettingsComponent,
              ),
          },
          {
            path: 'loyalty',
            loadComponent: () =>
              import('./features/account/loyalty/account-loyalty.component').then(
                (m) => m.AccountLoyaltyComponent,
              ),
          },
          {
            path: 'returns',
            loadComponent: () =>
              import('./features/account/returns/account-returns.component').then(
                (m) => m.AccountReturnsComponent,
              ),
          },
          {
            path: 'data',
            loadComponent: () =>
              import('./features/account/data/account-data.component').then(
                (m) => m.AccountDataComponent,
              ),
          },
        ],
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/static-pages/about/about.component').then(
            (m) => m.AboutComponent,
          ),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/static-pages/contact/contact.component').then(
            (m) => m.ContactComponent,
          ),
      },
      {
        path: 'terms',
        loadComponent: () =>
          import('./features/static-pages/terms/terms.component').then(
            (m) => m.TermsComponent,
          ),
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./features/static-pages/privacy/privacy.component').then(
            (m) => m.PrivacyComponent,
          ),
      },
      // Fallback for unknown routes within a language
      { path: '**', redirectTo: '/404' },
    ],
  },

  // Catch-all
  { path: '**', redirectTo: '404' },
];
