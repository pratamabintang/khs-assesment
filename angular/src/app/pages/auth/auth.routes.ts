import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { PublicAuthGuard } from '../../guard/public-auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth.component').then((m) => m.AuthComponent),
    canActivate: [PublicAuthGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'forget-password',
        loadComponent: () =>
          import('./forget-password/forget-password.component').then(
            (m) => m.ForgetPasswordComponent,
          ),
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
        loadComponent: () =>
          import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
      },

      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
];
