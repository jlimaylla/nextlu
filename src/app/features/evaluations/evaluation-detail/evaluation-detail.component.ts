import { Component, inject, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EvaluationRepository } from '../../../shared/repositories/evaluation.repository';
import { QuestionRepository } from '../../../shared/repositories/question.repository';
import { ExamAttemptRepository } from '../../../shared/repositories/exam-attempt.repository';
import { UserRepository } from '../../../shared/repositories/user.repository';
import { CourseRepository } from '../../../shared/repositories/course.repository';
import { Question } from '../../../shared/models/evaluation.model';

@Component({
  selector: 'app-evaluation-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './evaluation-detail.component.html',
})
export class EvaluationDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly evaluationRepo = inject(EvaluationRepository);
  private readonly questionRepo = inject(QuestionRepository);
  private readonly attemptRepo = inject(ExamAttemptRepository);
  private readonly userRepo = inject(UserRepository);
  private readonly courseRepo = inject(CourseRepository);

  readonly evaluationId = this.route.snapshot.paramMap.get('id')!;

  readonly evaluation = computed(() =>
    this.evaluationRepo.all().find((e) => e.id === this.evaluationId)
  );

  readonly courseTitle = computed(() => {
    const e = this.evaluation();
    if (!e) return '';
    return this.courseRepo.all().find((c) => c.id === e.courseId)?.title ?? '(capacitación eliminada)';
  });

  readonly questions = computed(() =>
    this.questionRepo
      .all()
      .filter((q) => q.evaluationId === this.evaluationId)
      .sort((a, b) => a.order - b.order)
  );

  readonly attempts = computed(() => {
    const users = new Map(this.userRepo.all().map((u) => [u.id, u]));
    return this.attemptRepo
      .all()
      .filter((a) => a.evaluationId === this.evaluationId)
      .map((a) => ({
        attempt: a,
        userName: users.get(a.userId)?.displayName ?? '(usuario eliminado)',
      }))
      .sort((a, b) => (b.attempt.createdAt?.toMillis?.() ?? 0) - (a.attempt.createdAt?.toMillis?.() ?? 0));
  });

  readonly averageScore = computed(() => {
    const list = this.attempts();
    if (!list.length) return null;
    return Math.round(list.reduce((sum, r) => sum + r.attempt.score, 0) / list.length);
  });

  readonly passRate = computed(() => {
    const list = this.attempts();
    if (!list.length) return null;
    const passed = list.filter((r) => r.attempt.status === 'PASSED').length;
    return Math.round((passed / list.length) * 100);
  });

  // ── Preguntas ────────────────────────────────────────────────────────────

  moveQuestion(question: Question, direction: -1 | 1): void {
    const list = [...this.questions()];
    const index = list.findIndex((q) => q.id === question.id);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= list.length) return;
    [list[index], list[swapWith]] = [list[swapWith], list[index]];
    this.questionRepo.reorder(list);
  }

  removeQuestion(question: Question): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar pregunta',
      message: '¿Eliminar esta pregunta del banco de preguntas?',
      confirmLabel: 'Eliminar',
      danger: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.questionRepo.delete(question.id);
      });
  }
}
