import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { noAuthGuard } from './core/auth/guards/no-auth.guard';
import { roleGuard } from './core/auth/guards/role.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Auth routes — redirige al dashboard si ya hay sesión activa
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [noAuthGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // Public certificate verification
  {
    path: 'verify/:code',
    loadComponent: () =>
      import(
        './features/certificates/certificate-verify/certificate-verify.component'
      ).then((m) => m.CertificateVerifyComponent),
  },

  // Protected routes (sidebar layout)
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'companies',
        canActivate: [roleGuard(['SUPER_ADMIN'])],
        loadChildren: () =>
          import('./features/companies/companies.routes').then((m) => m.COMPANIES_ROUTES),
      },
      {
        path: 'users',
        canActivate: [roleGuard(['SUPER_ADMIN', 'COMPANY_ADMIN'])],
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
      },
      {
        path: 'courses',
        canActivate: [roleGuard(['COMPANY_ADMIN'])],
        loadChildren: () =>
          import('./features/courses/courses.routes').then((m) => m.COURSES_ROUTES),
      },
      {
        path: 'enrollments',
        canActivate: [roleGuard(['COMPANY_ADMIN'])],
        loadChildren: () =>
          import('./features/enrollments/enrollments.routes').then((m) => m.ENROLLMENTS_ROUTES),
      },
      {
        path: 'evaluations',
        canActivate: [roleGuard(['COMPANY_ADMIN'])],
        loadChildren: () =>
          import('./features/evaluations/evaluations.routes').then((m) => m.EVALUATIONS_ROUTES),
      },
      {
        path: 'certificates',
        canActivate: [roleGuard(['COMPANY_ADMIN'])],
        loadChildren: () =>
          import('./features/certificates/certificates.routes').then(
            (m) => m.CERTIFICATES_ROUTES
          ),
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['COMPANY_ADMIN'])],
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'my-courses',
        canActivate: [roleGuard(['PARTICIPANT'])],
        loadChildren: () =>
          import('./features/my-courses/my-courses.routes').then((m) => m.MY_COURSES_ROUTES),
      },
      {
        path: 'my-certificates',
        canActivate: [roleGuard(['PARTICIPANT'])],
        loadComponent: () =>
          import('./features/my-certificates/my-certificates.component').then(
            (m) => m.MyCertificatesComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
