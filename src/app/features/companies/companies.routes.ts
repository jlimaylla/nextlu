import { Routes } from '@angular/router';

export const COMPANIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./companies.component').then((m) => m.CompaniesComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./company-form/company-form.component').then((m) => m.CompanyFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./company-form/company-form.component').then((m) => m.CompanyFormComponent),
  },
];
