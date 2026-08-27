import { Routes } from '@angular/router';

export const EVALUATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./evaluations.component').then((m) => m.EvaluationsComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./evaluation-form/evaluation-form.component').then(
        (m) => m.EvaluationFormComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./evaluation-detail/evaluation-detail.component').then(
        (m) => m.EvaluationDetailComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./evaluation-form/evaluation-form.component').then(
        (m) => m.EvaluationFormComponent
      ),
  },
  {
    path: ':id/questions/new',
    loadComponent: () =>
      import('./evaluation-detail/question-form/question-form.component').then(
        (m) => m.QuestionFormComponent
      ),
  },
  {
    path: ':id/questions/:questionId/edit',
    loadComponent: () =>
      import('./evaluation-detail/question-form/question-form.component').then(
        (m) => m.QuestionFormComponent
      ),
  },
];
