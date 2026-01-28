import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'user',
    loadChildren: () => import('./pages/user/user.routes').then((m) => m.USER_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/pages/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },

  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' },
];
