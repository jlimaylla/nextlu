import { Timestamp } from '@angular/fire/firestore';
import { BaseEntity } from './base-entity.model';

export interface Certificate extends BaseEntity {
  companyId: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  code: string; // Format: CERT-YYYY-000001
  userDisplayName: string;
  courseName: string;
  durationHours: number;
  issuedAt: Timestamp;
  pdfUrl: string;
}
