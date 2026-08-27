import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./user-form/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./user-form/user-form.component').then((m) => m.UserFormComponent),
  },
];
