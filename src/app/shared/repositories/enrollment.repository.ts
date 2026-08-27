import { Injectable } from '@angular/core';
import { BaseFirestoreRepository } from './base-firestore.repository';
import { Enrollment } from '../models/enrollment.model';

@Injectable({ providedIn: 'root' })
export class EnrollmentRepository extends BaseFirestoreRepository<Enrollment> {
  protected readonly collectionPath = 'enrollments';
  readonly all = this.getAllSignal();
}
