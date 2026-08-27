import { Component, inject, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
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
import { ModuleDialogComponent, ModuleDialogData } from './module-dialog/module-dialog.component';
import {
  MaterialDialogComponent,
  MaterialDialogData,
} from './material-dialog/material-dialog.component';
import { CourseRepository } from '../../../shared/repositories/course.repository';
import { CourseModuleRepository } from '../../../shared/repositories/course-module.repository';
import { CourseMaterialRepository } from '../../../shared/repositories/course-material.repository';
import { EvaluationRepository } from '../../../shared/repositories/evaluation.repository';
import { CompanyContextService } from '../../../core/services/company-context.service';
import {
  CourseModule,
  CourseMaterial,
  COURSE_STATUS_LABELS,
  COURSE_STATUS_VARIANT,
  COURSE_CATEGORY_LABELS,
  MATERIAL_TYPE_ICONS,
} from '../../../shared/models/course.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatTabsModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './course-detail.component.html',
})
export class CourseDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly companyContext = inject(CompanyContextService);
  private readonly courseRepo = inject(CourseRepository);
  private readonly moduleRepo = inject(CourseModuleRepository);
  private readonly materialRepo = inject(CourseMaterialRepository);
  private readonly evaluationRepo = inject(EvaluationRepository);

  readonly courseId = this.route.snapshot.paramMap.get('id')!;

  readonly statusLabels = COURSE_STATUS_LABELS;
  readonly statusVariant = COURSE_STATUS_VARIANT;
  readonly categoryLabels = COURSE_CATEGORY_LABELS;
  readonly materialIcons = MATERIAL_TYPE_ICONS;

  readonly course = computed(() => this.courseRepo.all().find((c) => c.id === this.courseId));

  readonly modules = computed(() =>
    this.moduleRepo
      .all()
      .filter((m) => m.courseId === this.courseId)
      .sort((a, b) => a.order - b.order)
  );

  readonly materialsByModule = computed(() => {
    const map = new Map<string, CourseMaterial[]>();
    for (const material of this.materialRepo.all()) {
      if (material.courseId !== this.courseId) continue;
      const list = map.get(material.moduleId) ?? [];
      list.push(material);
      map.set(material.moduleId, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.order - b.order);
    return map;
  });

  materialsOf(moduleId: string): CourseMaterial[] {
    return this.materialsByModule().get(moduleId) ?? [];
  }

  readonly evaluation = computed(() =>
    this.evaluationRepo.all().find((e) => e.courseId === this.courseId)
  );

  // ── Módulos ──────────────────────────────────────────────────────────────

  addModule(): void {
    const data: ModuleDialogData = {};
    this.dialog
      .open(ModuleDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        const companyId = this.companyContext.companyId();
        if (!companyId) return;
        this.moduleRepo.create({
          companyId,
          courseId: this.courseId,
          title: result.title,
          description: result.description,
          order: this.modules().length,
        });
      });
  }

  editModule(module: CourseModule): void {
    const data: ModuleDialogData = { module };
    this.dialog
      .open(ModuleDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.moduleRepo.update(module.id, result);
      });
  }

  moveModule(module: CourseModule, direction: -1 | 1): void {
    const list = [...this.modules()];
    const index = list.findIndex((m) => m.id === module.id);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= list.length) return;
    [list[index], list[swapWith]] = [list[swapWith], list[index]];
    this.moduleRepo.reorder(list);
  }

  removeModule(module: CourseModule): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar módulo',
      message: `¿Eliminar "${module.title}" y todos sus materiales? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        for (const material of this.materialsOf(module.id)) {
          this.materialRepo.delete(material.id);
        }
        this.moduleRepo.delete(module.id);
      });
  }

  // ── Materiales ───────────────────────────────────────────────────────────

  addMaterial(module: CourseModule): void {
    const data: MaterialDialogData = {};
    this.dialog
      .open(MaterialDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        const companyId = this.companyContext.companyId();
        if (!companyId) return;
        this.materialRepo.create({
          companyId,
          courseId: this.courseId,
          moduleId: module.id,
          type: result.type,
          title: result.title,
          url: result.url,
          order: this.materialsOf(module.id).length,
        });
      });
  }

  editMaterial(material: CourseMaterial): void {
    const data: MaterialDialogData = { material };
    this.dialog
      .open(MaterialDialogComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.materialRepo.update(material.id, result);
      });
  }

  removeMaterial(material: CourseMaterial): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar material',
      message: `¿Eliminar "${material.title}"?`,
      confirmLabel: 'Eliminar',
      danger: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.materialRepo.delete(material.id);
      });
  }
}
