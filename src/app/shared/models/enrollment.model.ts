import { Timestamp } from '@angular/fire/firestore';
import { BaseEntity } from './base-entity.model';

export type EnrollmentType = 'REQUIRED' | 'OPTIONAL';

export interface Enrollment extends BaseEntity {
  companyId: string;
  courseId: string;
  userId: string;
  type: EnrollmentType;
  progressPercent: number; // 0-100
  completedAt?: Timestamp;
  expiresAt?: Timestamp;
}

export interface Progress extends BaseEntity {
  companyId: string;
  enrollmentId: string;
  moduleId: string;
  userId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  timeSpentSeconds: number;
}
