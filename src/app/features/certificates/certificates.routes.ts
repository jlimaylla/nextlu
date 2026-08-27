import { Routes } from '@angular/router';

export const CERTIFICATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./certificates.component').then((m) => m.CertificatesComponent),
  },
];
