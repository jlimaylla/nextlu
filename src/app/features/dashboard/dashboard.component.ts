import { Component, inject, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { CompanyContextService } from '../../core/services/company-context.service';
import { CompanyRepository } from '../../shared/repositories/company.repository';
import { UserRepository } from '../../shared/repositories/user.repository';
import { CourseRepository } from '../../shared/repositories/course.repository';
import { EnrollmentRepository } from '../../shared/repositories/enrollment.repository';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  // Fondo + texto del chip, con roles tonales del tema M3 (mat.define-theme).
  chipClass: string;
}

const CHIP_CLASSES = [
  'bg-[var(--mat-sys-primary-container)] text-[var(--mat-sys-on-primary-container)]',
  'bg-[var(--mat-sys-secondary-container)] text-[var(--mat-sys-on-secondary-container)]',
  'bg-[var(--mat-sys-tertiary-container)] text-[var(--mat-sys-on-tertiary-container)]',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, PageHeaderComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly companyRepo = inject(CompanyRepository);
  private readonly userRepo = inject(UserRepository);
  private readonly courseRepo = inject(CourseRepository);
  private readonly enrollmentRepo = inject(EnrollmentRepository);

  readonly user = computed(() => this.auth.currentUser());
  readonly greeting = computed(() => {
    const name = this.user()?.displayName || this.user()?.email || '';
    return `Bienvenido, ${name}`;
  });

  // Los indicadores cambian según el rol — no tiene sentido mostrarle "Total Empresas"
  // a un COMPANY_ADMIN, ni "Capacitaciones asignadas" a un SUPER_ADMIN.
  readonly stats = computed<StatCard[]>(() => {
    if (this.companyContext.isSuperAdmin()) {
      return [
        {
          label: 'Total Empresas',
          value: this.companyRepo.all().length,
          icon: 'business',
          chipClass: CHIP_CLASSES[0],
        },
        {
          label: 'Total Usuarios',
          value: this.userRepo.all().length,
          icon: 'people',
          chipClass: CHIP_CLASSES[1],
        },
        {
          label: 'Total Capacitaciones',
          value: this.courseRepo.all().length,
          icon: 'school',
          chipClass: CHIP_CLASSES[2],
        },
      ];
    }

    if (this.companyContext.isCompanyAdmin()) {
      return [
        {
          label: 'Total Participantes',
          value: this.userRepo.all().filter((u) => u.role === 'PARTICIPANT').length,
          icon: 'people',
          chipClass: CHIP_CLASSES[0],
        },
        {
          label: 'Capacitaciones publicadas',
          value: this.courseRepo.all().filter((c) => c.status === 'PUBLISHED').length,
          icon: 'school',
          chipClass: CHIP_CLASSES[1],
        },
        {
          label: 'Total Inscripciones',
          value: this.enrollmentRepo.all().length,
          icon: 'assignment_turned_in',
          chipClass: CHIP_CLASSES[2],
        },
      ];
    }

    // PARTICIPANT
    const myEnrollments = this.enrollmentRepo
      .all()
      .filter((e) => e.userId === this.user()?.uid);
    const isDone = (e: (typeof myEnrollments)[number]) =>
      !!e.completedAt || e.progressPercent >= 100;

    return [
      {
        label: 'Capacitaciones asignadas',
        value: myEnrollments.length,
        icon: 'school',
        chipClass: CHIP_CLASSES[0],
      },
      {
        label: 'Completadas',
        value: myEnrollments.filter(isDone).length,
        icon: 'task_alt',
        chipClass: CHIP_CLASSES[1],
      },
      {
        label: 'Pendientes',
        value: myEnrollments.filter((e) => !isDone(e)).length,
        icon: 'pending_actions',
        chipClass: CHIP_CLASSES[2],
      },
    ];
  });
}
