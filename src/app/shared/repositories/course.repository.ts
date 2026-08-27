import { Injectable } from '@angular/core';
import { BaseFirestoreRepository } from './base-firestore.repository';
import { Course } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseRepository extends BaseFirestoreRepository<Course> {
  protected readonly collectionPath = 'courses';

  // Listener único, filtrado por companyId, compartido por toda la app (catálogo +
  // detalle). Se crea una sola vez al inyectar el repositorio por primera vez.
  readonly all = this.getAllSignal();

  publish(id: string): Promise<void> {
    return this.update(id, { status: 'PUBLISHED' });
  }

  unpublish(id: string): Promise<void> {
    return this.update(id, { status: 'DRAFT' });
  }

  finish(id: string): Promise<void> {
    return this.update(id, { status: 'FINISHED' });
  }

  duplicate(course: Course): Promise<string> {
    const { id, createdAt, updatedAt, ...rest } = course;
    return this.create({ ...rest, title: `${course.title} (copia)`, status: 'DRAFT' });
  }
}
