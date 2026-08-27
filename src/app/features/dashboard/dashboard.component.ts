import { Component, inject, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthService } from '../../core/auth/services/auth.service';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  // Fondo + texto del chip, con roles tonales del tema M3 (mat.define-theme).
  chipClass: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, PageHeaderComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);

  readonly user = computed(() => this.auth.currentUser());
  readonly greeting = computed(() => {
    const name = this.user()?.displayName || this.user()?.email || '';
    return `Bienvenido, ${name}`;
  });

  // Placeholder stats — se reemplazarán con datos reales de Firestore
  readonly stats: StatCard[] = [
    {
      label: 'Total Empresas',
      value: '—',
      icon: 'business',
      chipClass: 'bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)]',
    },
    {
      label: 'Total Usuarios',
      value: '—',
      icon: 'people',
      chipClass: 'bg-[var(--mat-sys-secondary-container)] text-[var(--mat-sys-on-secondary-container)]',
    },
    {
      label: 'Total Cursos',
      value: '—',
      icon: 'school',
      chipClass: 'bg-[var(--mat-sys-tertiary-container)] text-[var(--mat-sys-on-tertiary-container)]',
    },
    {
      label: 'Certificados Emitidos',
      value: '—',
      icon: 'workspace_premium',
      chipClass: 'bg-[var(--mat-sys-surface-container-highest)] text-[var(--mat-sys-on-surface)]',
    },
  ];
}
