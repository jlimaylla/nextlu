import { BaseEntity } from './base-entity.model';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export type AttemptStatus = 'PASSED' | 'FAILED';

export interface Evaluation extends BaseEntity {
  companyId: string;
  courseId: string;
  title: string;
  minPassScore: number; // 0-100
  timeLimitMinutes: number;
  maxAttempts: number;
}

export interface Question extends BaseEntity {
  companyId: string;
  evaluationId: string;
  type: QuestionType;
  text: string;
  options: string[];
  correctOptionIndex: number;
  order: number;
}

export interface ExamAttempt extends BaseEntity {
  companyId: string;
  evaluationId: string;
  userId: string;
  score: number;
  status: AttemptStatus;
  answers: number[];
  attemptNumber: number;
}
