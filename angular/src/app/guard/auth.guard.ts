import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthStateService } from '../pages/auth/auth-state.service';
import { AuthService } from '../pages/auth/auth.service';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const state = inject(AuthStateService);
  const auth = inject(AuthService);

  if (state.getAccessToken()) return true;

  return auth.refresh().pipe(
    map(() => true),
    catchError(() => {
      return of(router.createUrlTree(['/auth', 'login']));
    }),
  );
};
