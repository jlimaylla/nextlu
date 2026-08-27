import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EvaluationRepository } from '../../shared/repositories/evaluation.repository';
import { QuestionRepository } from '../../shared/repositories/question.repository';
import { CourseRepository } from '../../shared/repositories/course.repository';
import { Evaluation } from '../../shared/models/evaluation.model';

@Component({
  selector: 'app-evaluations',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule, PageHeaderComponent],
  templateUrl: './evaluations.component.html',
})
export class EvaluationsComponent {
  private readonly dialog = inject(MatDialog);
  private readonly evaluationRepo = inject(EvaluationRepository);
  private readonly questionRepo = inject(QuestionRepository);
  private readonly courseRepo = inject(CourseRepository);

  readonly rows = computed(() => {
    const courses = new Map(this.courseRepo.all().map((c) => [c.id, c]));
    const questionCounts = new Map<string, number>();
    for (const q of this.questionRepo.all()) {
      questionCounts.set(q.evaluationId, (questionCounts.get(q.evaluationId) ?? 0) + 1);
    }
    return this.evaluationRepo.all().map((e) => ({
      evaluation: e,
      courseTitle: courses.get(e.courseId)?.title ?? '(capacitación eliminada)',
      questionCount: questionCounts.get(e.id) ?? 0,
    }));
  });

  remove(evaluation: Evaluation): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar evaluación',
      message: `¿Eliminar la evaluación de "${evaluation.title}"? También se eliminan sus preguntas. Los resultados ya rendidos quedan como historial.`,
      confirmLabel: 'Eliminar',
      danger: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (!confirmed) return;
        const questions = this.questionRepo.all().filter((q) => q.evaluationId === evaluation.id);
        await Promise.all(questions.map((q) => this.questionRepo.delete(q.id)));
        await this.evaluationRepo.delete(evaluation.id);
      });
  }
}
