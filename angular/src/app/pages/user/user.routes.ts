import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { AuthGuard } from '../../guard/auth.guard';
import { EntryComponent } from './entry/entry.component';
import { onlyClient } from '../../guard/roles';

export const USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./user.component').then((m) => m.UserComponent),
    canMatch: onlyClient,
    children: [
      {
        path: 'submission/:id',
        loadComponent: () =>
          import('./entry/submission/submission.component').then((m) => m.SubmissionComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'employees',
        component: EntryComponent,
        canActivate: [AuthGuard],
      },

      { path: '', redirectTo: 'employees', pathMatch: 'full' },
    ],
  },
];
