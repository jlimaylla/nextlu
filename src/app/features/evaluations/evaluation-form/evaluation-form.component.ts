import { Component, inject, signal, effect, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EvaluationRepository } from '../../../shared/repositories/evaluation.repository';
import { CourseRepository } from '../../../shared/repositories/course.repository';
import { CompanyContextService } from '../../../core/services/company-context.service';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './evaluation-form.component.html',
  styleUrl: './evaluation-form.component.scss',
})
export class EvaluationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly repo = inject(EvaluationRepository);
  private readonly courseRepo = inject(CourseRepository);
  private readonly companyContext = inject(CompanyContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly evaluationId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.evaluationId;
  readonly isSaving = signal(false);

  // Cada curso puede tener como máximo una evaluación — al crear, solo se ofrecen
  // cursos que todavía no tienen una configurada.
  readonly availableCourses = computed(() => {
    const usedCourseIds = new Set(
      this.repo
        .all()
        .filter((e) => e.id !== this.evaluationId)
        .map((e) => e.courseId)
    );
    return this.courseRepo.all().filter((c) => !usedCourseIds.has(c.id));
  });

  readonly form = this.fb.nonNullable.group({
    courseId: [this.route.snapshot.queryParamMap.get('courseId') ?? '', Validators.required],
    title: ['', Validators.required],
    minPassScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
    timeLimitMinutes: [30, [Validators.required, Validators.min(1)]],
    maxAttempts: [3, [Validators.required, Validators.min(1)]],
  });

  private profileLoaded = false;

  constructor() {
    if (this.isEdit) {
      this.form.controls.courseId.disable();
      effect(() => {
        if (this.profileLoaded) return;
        const evaluation = this.repo.all().find((e) => e.id === this.evaluationId);
        if (!evaluation) return;
        this.profileLoaded = true;
        this.form.patchValue({
          courseId: evaluation.courseId,
          title: evaluation.title,
          minPassScore: evaluation.minPassScore,
          timeLimitMinutes: evaluation.timeLimitMinutes,
          maxAttempts: evaluation.maxAttempts,
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
      if (this.isEdit && this.evaluationId) {
        await this.repo.update(this.evaluationId, {
          title: value.title,
          minPassScore: value.minPassScore,
          timeLimitMinutes: value.timeLimitMinutes,
          maxAttempts: value.maxAttempts,
        });
        await this.router.navigate(['/evaluations', this.evaluationId]);
      } else {
        const companyId = this.companyContext.companyId();
        if (!companyId) throw new Error('No hay companyId en el contexto del usuario actual');
        const id = await this.repo.create({ ...value, companyId });
        await this.router.navigate(['/evaluations', id]);
      }
    } finally {
      this.isSaving.set(false);
    }
  }
}
