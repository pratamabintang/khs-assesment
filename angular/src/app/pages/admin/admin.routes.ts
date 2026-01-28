import { Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth.guard';
import { onlyAdmin } from '../../guard/roles';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin').then((m) => m.AdminComponent),
    canMatch: onlyAdmin,
    children: [
      {
        path: 'manage',
        loadComponent: () =>
          import('./manage/admin-outsourcing').then((m) => m.AdminOutsourcingComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'submission',
        loadComponent: () =>
          import('./submission/admin-submission').then((m) => m.AdminSubmissionListComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'submission/:id',
        loadComponent: () =>
          import('./submission/survey-readonly').then((m) => m.AdminSurveyViewPageComponent),
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
