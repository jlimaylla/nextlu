import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Protege rutas públicas (login, forgot-password) para que un usuario ya
 * autenticado no pueda acceder a ellas — lo redirige al dashboard.
 */
export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const check = () =>
    authService.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;

  if (!authService.isLoading()) return check();

  return toObservable(authService.isLoading).pipe(
    filter((loading) => !loading),
    take(1),
    map(check)
  );
};
