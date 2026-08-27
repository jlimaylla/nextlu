import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserRepository } from '../../shared/repositories/user.repository';
import { AppUser } from '../../shared/models/user.model';
import { UserRole } from '../../core/auth/models/auth-user.model';

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Admin de empresa',
  PARTICIPANT: 'Participante',
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './users.component.html',
})
export class UsersComponent {
  private readonly repo = inject(UserRepository);
  private readonly dialog = inject(MatDialog);

  readonly searchTerm = signal('');
  readonly displayedColumns = ['name', 'role', 'details', 'status', 'actions'];

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this.repo
      .all()
      .filter(
        (u) =>
          !term ||
          u.displayName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  });

  roleLabel(role: UserRole): string {
    return ROLE_LABELS[role];
  }

  details(user: AppUser): string {
    return [user.area, user.position, user.sede].filter(Boolean).join(' · ') || '—';
  }

  toggleStatus(user: AppUser): void {
    if (user.status === 'BLOCKED') {
      this.repo.unblock(user.id);
      return;
    }
    const data: ConfirmDialogData = {
      title: 'Bloquear usuario',
      message: `¿Bloquear a "${user.displayName}"? No podrá iniciar sesión hasta que lo desbloquees.`,
      confirmLabel: 'Bloquear',
      danger: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.repo.block(user.id);
      });
  }
}
