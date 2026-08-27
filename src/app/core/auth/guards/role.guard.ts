import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth-user.model';

/**
 * Protege rutas según el rol del usuario autenticado.
 * Siempre se encadena después de authGuard, pero también espera por isLoading
 * para manejar el caso de recarga directa en una URL protegida por rol.
 */
export const roleGuard =
  (allowedRoles: UserRole[]): CanActivateFn =>
  () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const check = () => {
      const user = authService.currentUser();
      if (user && allowedRoles.includes(user.role)) return true;
      return router.createUrlTree(['/dashboard']);
    };

    if (!authService.isLoading()) return check();

    return toObservable(authService.isLoading).pipe(
      filter((loading) => !loading),
      take(1),
      map(check)
    );
  };
