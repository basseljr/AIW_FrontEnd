import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { DashboardAuthService } from '../services/dashboard-auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(DashboardAuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
