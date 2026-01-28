import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthStateService } from '../pages/auth/auth-state.service';
import { AuthService } from '../pages/auth/auth.service';

export const PublicAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authState = inject(AuthStateService);
  const authService = inject(AuthService);

  if (authState.getAccessToken()) {
    return router.createUrlTree(['/user/employees']);
  }

  return authService.refresh().pipe(
    map(() => {
      return router.createUrlTree(['/user/employees']);
    }),
    catchError(() => {
      return of(true);
    }),
  );
};
