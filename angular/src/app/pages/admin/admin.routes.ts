import { Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth.guard';
import { onlyAdmin } from '../../guard/roles';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin.component').then((m) => m.AdminComponent),
    canMatch: onlyAdmin,
    children: [
      {
        path: 'manage',
        loadComponent: () => import('./manage/manage.component').then((m) => m.ManageComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'submission',
        loadComponent: () => import('./submission/entry.component').then((m) => m.EntryComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'submission/:id',
        loadComponent: () =>
          import('./submission/submission.component').then((m) => m.SubmissionComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'survey',
        loadChildren: () => import('../survey/survey.routes').then((m) => m.SURVEY_ROUTES),
      },

      { path: '', redirectTo: 'manage', pathMatch: 'full' },
    ],
  },
];
