import { Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth.guard';

export const SURVEY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./survey.component').then((m) => m.SurveyComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'builder',
    loadComponent: () =>
      import('./survey-builder-form.component').then((m) => m.SurveyBuilderPageComponent),
    canActivate: [AuthGuard],
  },
  // {
  //   path: 'builder/:id',
  //   loadComponent: () => import('./survey-builder-form').then((m) => m.SurveyBuilderPageComponent),
  //   canActivate: [AuthGuard],
  // },
];
