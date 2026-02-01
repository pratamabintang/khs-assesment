import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthStateService } from '../pages/auth/auth-state.service';
import { AuthService } from '../pages/auth/auth.service';

export const PublicAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authState = inject(AuthStateService);
  const authService = inject(AuthService);

  if (authState.getAccessToken() && authState.getRole()) {
    return router.createUrlTree([authService.ROLE_HOME[authState.getRole()!]!]);
  }

  return authService.refresh().pipe(
    map(() => {
      return router.createUrlTree([authService.ROLE_HOME[authState.getRole()!]!]);
    }),
    catchError(() => {
      return of(true);
    }),
  );
};
