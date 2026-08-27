import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CourseRepository } from '../../../shared/repositories/course.repository';
import { CompanyContextService } from '../../../core/services/company-context.service';
import { CourseCategory, COURSE_CATEGORY_LABELS } from '../../../shared/models/course.model';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.scss',
})
export class CourseFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly repo = inject(CourseRepository);
  private readonly companyContext = inject(CompanyContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly courseId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.courseId;
  readonly isSaving = signal(false);

  readonly categoryOptions = Object.entries(COURSE_CATEGORY_LABELS) as [CourseCategory, string][];

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    category: ['SEGURIDAD' as CourseCategory, [Validators.required]],
    coverUrl: [''],
    durationHours: [1, [Validators.required, Validators.min(1)]],
    validityMonths: [12, [Validators.required, Validators.min(0)]],
    isRequired: [false],
  });

  // Solo en edición: el listado de cursos es un signal en tiempo real (CourseRepository.all),
  // así que se espera a que el doc con este id aparezca ahí y se precarga el form una sola vez.
  private profileLoaded = false;

  constructor() {
    if (this.isEdit) {
      effect(() => {
        if (this.profileLoaded) return;
        const course = this.repo.all().find((c) => c.id === this.courseId);
        if (!course) return;
        this.profileLoaded = true;
        this.form.patchValue({
          title: course.title,
          description: course.description,
          category: course.category,
          coverUrl: course.coverUrl,
          durationHours: course.durationHours,
          validityMonths: course.validityMonths,
          isRequired: course.isRequired,
        });
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    try {
      const value = this.form.getRawValue();
      if (this.isEdit && this.courseId) {
        await this.repo.update(this.courseId, value);
      } else {
        const companyId = this.companyContext.companyId();
        if (!companyId) throw new Error('No hay companyId en el contexto del usuario actual');
        await this.repo.create({ ...value, companyId, status: 'DRAFT' });
      }
      await this.router.navigate(['/courses']);
    } finally {
      this.isSaving.set(false);
    }
  }
}
