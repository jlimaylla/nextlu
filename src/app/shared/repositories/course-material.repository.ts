import { Injectable } from '@angular/core';
import { BaseFirestoreRepository } from './base-firestore.repository';
import { CourseMaterial } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseMaterialRepository extends BaseFirestoreRepository<CourseMaterial> {
  protected readonly collectionPath = 'course_materials';

  // Ver nota en CourseModuleRepository — mismo patrón: un listener por empresa,
  // filtrado por módulo en el componente.
  readonly all = this.getAllSignal();

  async reorder(materials: CourseMaterial[]): Promise<void> {
    await Promise.all(materials.map((m, index) => this.update(m.id, { order: index })));
  }
}
