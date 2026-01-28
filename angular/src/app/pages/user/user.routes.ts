import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile';
import { AuthGuard } from '../../guard/auth.guard';
import { EmployeesComponent } from './employees/employees';
import { onlyClient } from '../../guard/roles';

export const USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./user').then((m) => m.UserComponent),
    canMatch: onlyClient,
    children: [
      {
        path: 'submission/:id',
        loadComponent: () =>
          import('./employees/submission/survey-live').then((m) => m.SurveyLivePageComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'employees',
        component: EmployeesComponent,
        canActivate: [AuthGuard],
      },

      { path: '', redirectTo: 'employees', pathMatch: 'full' },
    ],
  },
];
