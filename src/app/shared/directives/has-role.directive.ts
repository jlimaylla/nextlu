import { Directive, inject, input, effect, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { UserRole } from '../../core/auth/models/auth-user.model';

/**
 * Structural directive that renders its template only when the authenticated
 * user has one of the specified roles.
 *
 * Usage: <div *appHasRole="'COMPANY_ADMIN'"> or *appHasRole="['SUPER_ADMIN', 'COMPANY_ADMIN']"
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  readonly appHasRole = input.required<UserRole | UserRole[]>();

  private readonly auth = inject(AuthService);
  private readonly template = inject(TemplateRef);
  private readonly view = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const allowed = Array.isArray(this.appHasRole())
        ? (this.appHasRole() as UserRole[])
        : [this.appHasRole() as UserRole];
      const user = this.auth.currentUser();

      this.view.clear();
      if (user && allowed.includes(user.role)) {
        this.view.createEmbeddedView(this.template);
      }
    });
  }
}
