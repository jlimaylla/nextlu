import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { CourseRepository } from '../../shared/repositories/course.repository';
import {
  Course,
  CourseStatus,
  COURSE_STATUS_LABELS,
  COURSE_STATUS_VARIANT,
  COURSE_CATEGORY_LABELS,
} from '../../shared/models/course.model';

type StatusFilter = CourseStatus | 'ALL';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss',
})
export class CoursesComponent {
  private readonly repo = inject(CourseRepository);
  private readonly dialog = inject(MatDialog);

  readonly statusLabels = COURSE_STATUS_LABELS;
  readonly statusVariant = COURSE_STATUS_VARIANT;
  readonly categoryLabels = COURSE_CATEGORY_LABELS;

  readonly searchTerm = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');

  readonly filteredCourses = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    return this.repo
      .all()
      .filter((c) => status === 'ALL' || c.status === status)
      .filter((c) => !term || c.title.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.() || 0);
  });

  duplicate(course: Course): void {
    this.repo.duplicate(course);
  }

  publish(course: Course): void {
    this.repo.publish(course.id);
  }

  unpublish(course: Course): void {
    this.repo.unpublish(course.id);
  }

  remove(course: Course): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar capacitación',
      message: `¿Eliminar "${course.title}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.repo.delete(course.id);
      });
  }
}
