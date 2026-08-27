import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EnrollmentRepository } from '../../shared/repositories/enrollment.repository';
import { UserRepository } from '../../shared/repositories/user.repository';
import { CourseRepository } from '../../shared/repositories/course.repository';
import { Enrollment } from '../../shared/models/enrollment.model';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './enrollments.component.html',
})
export class EnrollmentsComponent {
  private readonly dialog = inject(MatDialog);
  private readonly enrollmentRepo = inject(EnrollmentRepository);
  private readonly userRepo = inject(UserRepository);
  private readonly courseRepo = inject(CourseRepository);

  readonly searchTerm = signal('');
  readonly courseFilter = signal<string>('ALL');

  readonly courses = computed(() => this.courseRepo.all());

  readonly rows = computed(() => {
    const users = new Map(this.userRepo.all().map((u) => [u.id, u]));
    const courses = new Map(this.courseRepo.all().map((c) => [c.id, c]));
    const term = this.searchTerm().trim().toLowerCase();
    const courseFilter = this.courseFilter();

    return this.enrollmentRepo
      .all()
      .map((e) => ({
        enrollment: e,
        userName: users.get(e.userId)?.displayName ?? '(usuario eliminado)',
        userEmail: users.get(e.userId)?.email ?? '',
        courseTitle: courses.get(e.courseId)?.title ?? '(capacitación eliminada)',
      }))
      .filter((r) => courseFilter === 'ALL' || r.enrollment.courseId === courseFilter)
      .filter(
        (r) =>
          !term ||
          r.userName.toLowerCase().includes(term) ||
          r.userEmail.toLowerCase().includes(term)
      )
      .sort(
        (a, b) =>
          (b.enrollment.createdAt?.toMillis?.() ?? 0) - (a.enrollment.createdAt?.toMillis?.() ?? 0)
      );
  });

  // Import dinámico: la librería xlsx pesa bastante y solo hace falta cuando el admin
  // realmente abre este diálogo, no cada vez que visita /enrollments.
  async openBulkImportDialog(): Promise<void> {
    const { BulkImportDialogComponent } = await import(
      './bulk-import-dialog/bulk-import-dialog.component'
    );
    this.dialog.open(BulkImportDialogComponent, { width: '560px' });
  }

  unenroll(enrollment: Enrollment): void {
    const data: ConfirmDialogData = {
      title: 'Desinscribir participante',
      message: '¿Quitar esta inscripción? El participante perderá el acceso a la capacitación.',
      confirmLabel: 'Desinscribir',
      danger: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.enrollmentRepo.delete(enrollment.id);
      });
  }
}
