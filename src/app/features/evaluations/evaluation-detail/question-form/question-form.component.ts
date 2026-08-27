import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { QuestionRepository } from '../../../../shared/repositories/question.repository';
import { EvaluationRepository } from '../../../../shared/repositories/evaluation.repository';
import { QuestionType } from '../../../../shared/models/evaluation.model';

@Component({
  selector: 'app-question-form',
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
    MatRadioModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './question-form.component.html',
  styleUrl: './question-form.component.scss',
})
export class QuestionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly repo = inject(QuestionRepository);
  private readonly evaluationRepo = inject(EvaluationRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly evaluationId = this.route.snapshot.paramMap.get('id')!;
  readonly questionId = this.route.snapshot.paramMap.get('questionId');
  readonly isEdit = !!this.questionId;
  readonly isSaving = signal(false);

  readonly typeCtrl = new FormControl<QuestionType>('MULTIPLE_CHOICE', { nonNullable: true });

  readonly form = this.fb.nonNullable.group({
    text: ['', Validators.required],
    correctOptionIndex: [0, Validators.required],
  });

  readonly options = this.fb.array<FormControl<string>>([
    this.fb.nonNullable.control('', Validators.required),
    this.fb.nonNullable.control('', Validators.required),
  ]);

  get isMultipleChoice(): boolean {
    return this.typeCtrl.value === 'MULTIPLE_CHOICE';
  }

  private loaded = false;

  constructor() {
    if (this.isEdit) {
      effect(() => {
        if (this.loaded) return;
        const question = this.repo.all().find((q) => q.id === this.questionId);
        if (!question) return;
        this.loaded = true;
        this.typeCtrl.setValue(question.type);
        this.form.patchValue({
          text: question.text,
          correctOptionIndex: question.correctOptionIndex,
        });
        this.options.clear();
        for (const opt of question.options) {
          this.options.push(this.fb.nonNullable.control(opt, Validators.required));
        }
      });
    }
  }

  onTypeChange(type: QuestionType): void {
    this.typeCtrl.setValue(type);
    if (type === 'TRUE_FALSE') {
      this.options.clear();
      this.options.push(this.fb.nonNullable.control('Verdadero'));
      this.options.push(this.fb.nonNullable.control('Falso'));
      this.form.controls.correctOptionIndex.setValue(0);
    } else if (this.options.length < 2) {
      this.options.push(this.fb.nonNullable.control('', Validators.required));
      this.options.push(this.fb.nonNullable.control('', Validators.required));
    }
  }

  addOption(): void {
    this.options.push(this.fb.nonNullable.control('', Validators.required));
  }

  removeOption(index: number): void {
    if (this.options.length <= 2) return;
    this.options.removeAt(index);
    if (this.form.controls.correctOptionIndex.value >= this.options.length) {
      this.form.controls.correctOptionIndex.setValue(0);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.options.invalid) {
      this.form.markAllAsTouched();
      this.options.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    try {
      const value = this.form.getRawValue();
      const payload = {
        type: this.typeCtrl.value,
        text: value.text,
        options: this.options.getRawValue(),
        correctOptionIndex: value.correctOptionIndex,
      };

      if (this.isEdit && this.questionId) {
        await this.repo.update(this.questionId, payload);
      } else {
        const companyId = this.evaluationRepo
          .all()
          .find((e) => e.id === this.evaluationId)?.companyId;
        if (!companyId) throw new Error('No se encontró la evaluación');
        const order = this.repo.all().filter((q) => q.evaluationId === this.evaluationId).length;
        await this.repo.create({
          ...payload,
          companyId,
          evaluationId: this.evaluationId,
          order,
        });
      }
      await this.router.navigate(['/evaluations', this.evaluationId]);
    } finally {
      this.isSaving.set(false);
    }
  }
}
