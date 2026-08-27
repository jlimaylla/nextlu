import { Injectable } from '@angular/core';
import { BaseFirestoreRepository } from './base-firestore.repository';
import { CourseModule } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseModuleRepository extends BaseFirestoreRepository<CourseModule> {
  protected readonly collectionPath = 'course_modules';

  // Un único listener por empresa (igual que CourseRepository). El filtro por curso
  // se hace en el componente con un computed() sobre este signal — evita crear un
  // listener de Firestore nuevo por cada curso que se abre, y evita tener que mantener
  // un índice compuesto (companyId + courseId + order) solo para catálogos chicos.
  readonly all = this.getAllSignal();

  async reorder(modules: CourseModule[]): Promise<void> {
    await Promise.all(modules.map((m, index) => this.update(m.id, { order: index })));
  }
}
