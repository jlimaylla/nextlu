import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Protege rutas que requieren sesión activa.
 *
 * Espera a que Firebase resuelva el estado de auth (isLoading = false) antes de
 * decidir. Sin esto, una recarga de página redirige al login mientras Firebase aún
 * está verificando el token — aunque el usuario tenga sesión válida.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si auth ya está resuelto (navegación post-login), responder sin crear observable
  if (!authService.isLoading()) {
    return authService.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
  }

  // Esperar a que Firebase resuelva el estado del token
  return toObservable(authService.isLoading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() =>
      authService.isAuthenticated() ? true : router.createUrlTree(['/auth/login'])
    )
  );
};
