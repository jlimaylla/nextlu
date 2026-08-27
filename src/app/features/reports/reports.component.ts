import { Component, inject, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CourseRepository } from '../../shared/repositories/course.repository';
import { EnrollmentRepository } from '../../shared/repositories/enrollment.repository';
import { UserRepository } from '../../shared/repositories/user.repository';
import { EvaluationRepository } from '../../shared/repositories/evaluation.repository';
import { ExamAttemptRepository } from '../../shared/repositories/exam-attempt.repository';
import { Enrollment } from '../../shared/models/enrollment.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatTooltipModule, PageHeaderComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  private readonly courseRepo = inject(CourseRepository);
  private readonly enrollmentRepo = inject(EnrollmentRepository);
  private readonly userRepo = inject(UserRepository);
  private readonly evaluationRepo = inject(EvaluationRepository);
  private readonly attemptRepo = inject(ExamAttemptRepository);

  readonly isExporting = signal(false);

  // ── Datos base ───────────────────────────────────────────────────────────

  private readonly courses = computed(() => this.courseRepo.all());
  private readonly enrollments = computed(() => this.enrollmentRepo.all());

  // ── Indicadores de capacitación ──────────────────────────────────────────

  readonly kpis = computed(() => ({
    totalCourses: this.courses().filter((c) => c.status === 'PUBLISHED').length,
    totalParticipants: this.userRepo.all().filter((u) => u.role === 'PARTICIPANT').length,
    totalEnrollments: this.enrollments().length,
    totalEvaluations: this.evaluationRepo.all().length,
  }));

  // Una inscripción se considera completada si el participante terminó todos sus módulos
  // (completedAt) o llegó a 100% de progreso. Hoy ningún flujo todavía escribe esos campos
  // — se llenan cuando exista el reproductor de curso para el participante (my-courses) —
  // así que estos indicadores arrancan en 0 en un entorno recién sembrado, no es un bug.
  private isCompleted(e: Enrollment): boolean {
    return !!e.completedAt || e.progressPercent >= 100;
  }

  private isExpired(e: Enrollment): boolean {
    if (this.isCompleted(e)) return false;
    return (e.expiresAt?.toMillis() ?? Infinity) < Date.now();
  }

  readonly compliance = computed(() => {
    const list = this.enrollments();
    const completed = list.filter((e) => this.isCompleted(e)).length;
    const expired = list.filter((e) => this.isExpired(e)).length;
    return { completed, expired, pending: list.length - completed - expired, total: list.length };
  });

  readonly complianceRate = computed(() => {
    const c = this.compliance();
    return c.total ? Math.round((c.completed / c.total) * 100) : null;
  });

  readonly totalHours = computed(() => {
    const courses = new Map(this.courses().map((c) => [c.id, c]));
    return this.enrollments()
      .filter((e) => this.isCompleted(e))
      .reduce((sum, e) => sum + (courses.get(e.courseId)?.durationHours ?? 0), 0);
  });

  // ── Cumplimiento y horas por área ────────────────────────────────────────

  readonly areaBreakdown = computed(() => {
    const users = new Map(this.userRepo.all().map((u) => [u.id, u]));
    const courses = new Map(this.courses().map((c) => [c.id, c]));
    const map = new Map<string, { area: string; assigned: number; completed: number; hours: number }>();

    for (const e of this.enrollments()) {
      const area = users.get(e.userId)?.area || 'Sin área';
      const row = map.get(area) ?? { area, assigned: 0, completed: 0, hours: 0 };
      row.assigned++;
      if (this.isCompleted(e)) {
        row.completed++;
        row.hours += courses.get(e.courseId)?.durationHours ?? 0;
      }
      map.set(area, row);
    }
    return [...map.values()].sort((a, b) => b.assigned - a.assigned);
  });

  // ── Evaluaciones ─────────────────────────────────────────────────────────

  readonly evaluationStats = computed(() => {
    const list = this.attemptRepo.all();
    if (!list.length) return { averageScore: null as number | null, passRate: null as number | null, total: 0 };
    const averageScore = Math.round(list.reduce((sum, a) => sum + a.score, 0) / list.length);
    const passRate = Math.round(
      (list.filter((a) => a.status === 'PASSED').length / list.length) * 100
    );
    return { averageScore, passRate, total: list.length };
  });

  // ── Exportación ──────────────────────────────────────────────────────────

  // Import dinámico: xlsx solo hace falta cuando el admin realmente exporta.
  async exportExcel(): Promise<void> {
    this.isExporting.set(true);
    try {
      const { utils, writeFile } = await import('xlsx');
      const wb = utils.book_new();

      const k = this.kpis();
      const c = this.compliance();
      const evalStats = this.evaluationStats();

      utils.book_append_sheet(
        wb,
        utils.json_to_sheet([
          { Indicador: 'Total capacitaciones publicadas', Valor: k.totalCourses },
          { Indicador: 'Total participantes', Valor: k.totalParticipants },
          { Indicador: 'Total inscripciones', Valor: k.totalEnrollments },
          { Indicador: 'Evaluaciones configuradas', Valor: k.totalEvaluations },
          { Indicador: 'Inscripciones completadas', Valor: c.completed },
          { Indicador: 'Inscripciones pendientes', Valor: c.pending },
          { Indicador: 'Inscripciones vencidas', Valor: c.expired },
          { Indicador: 'Horas capacitadas (total)', Valor: this.totalHours() },
          { Indicador: 'Promedio de notas', Valor: evalStats.averageScore ?? '—' },
          { Indicador: 'Tasa de aprobación', Valor: evalStats.passRate ?? '—' },
        ]),
        'Resumen'
      );

      utils.book_append_sheet(
        wb,
        utils.json_to_sheet(
          this.areaBreakdown().map((r) => ({
            Área: r.area,
            Asignados: r.assigned,
            Completados: r.completed,
            'Cumplimiento %': r.assigned ? Math.round((r.completed / r.assigned) * 100) : 0,
            'Horas capacitadas': r.hours,
          }))
        ),
        'Cumplimiento por área'
      );

      const users = new Map(this.userRepo.all().map((u) => [u.id, u]));
      const courses = new Map(this.courses().map((co) => [co.id, co]));
      utils.book_append_sheet(
        wb,
        utils.json_to_sheet(
          this.enrollments().map((e) => ({
            Participante: users.get(e.userId)?.displayName ?? '(eliminado)',
            Correo: users.get(e.userId)?.email ?? '',
            Capacitación: courses.get(e.courseId)?.title ?? '(eliminada)',
            Tipo: e.type === 'REQUIRED' ? 'Obligatorio' : 'Opcional',
            Estado: this.isCompleted(e) ? 'Completado' : this.isExpired(e) ? 'Vencido' : 'Pendiente',
            'Progreso %': e.progressPercent,
          }))
        ),
        'Inscripciones'
      );

      writeFile(wb, `reporte-capacitaciones-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      this.isExporting.set(false);
    }
  }
}
