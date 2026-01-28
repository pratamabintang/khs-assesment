import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { PublicAuthGuard } from '../../guard/public-auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth').then((m) => m.Auth),
    canActivate: [PublicAuthGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./register/register').then((m) => m.Register),
      },
      {
        path: 'forget-password',
        loadComponent: () =>
          import('./forget-password/forget-password').then((m) => m.ForgetPassword),
      },
      {
        path: 'reset-password',
        canActivate: [
          (route) => {
            const router = inject(Router);

            const token = route.queryParamMap.get('token');
            const email = route.queryParamMap.get('email');

            if (!token || !email) {
              return router.createUrlTree(['/forget-password']);
            }

            return true;
          },
        ],
        loadComponent: () => import('./reset-password/reset-password').then((m) => m.ResetPassword),
      },

      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
];
