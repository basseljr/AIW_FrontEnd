import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SuperAdminAuthService } from '../services/super-admin-auth.service';

export const superAdminAuthGuard: CanActivateFn = () => {
  const auth = inject(SuperAdminAuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.enforceInactivityTimeout()) {
    return router.createUrlTree(['/login']);
  }
  return true;
};
