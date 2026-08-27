import { Injectable } from '@angular/core';
import { BaseFirestoreRepository } from './base-firestore.repository';
import { ExamAttempt } from '../models/evaluation.model';

@Injectable({ providedIn: 'root' })
export class ExamAttemptRepository extends BaseFirestoreRepository<ExamAttempt> {
  protected readonly collectionPath = 'exam_attempts';

  // Solo lectura desde el panel de admin: las reglas de Firestore reservan
  // update/delete de exam_attempts a SUPER_ADMIN — un COMPANY_ADMIN puede ver
  // resultados pero no alterarlos (los intentos los genera el propio participante
  // al rendir el examen, todavía sin implementar).
  readonly all = this.getAllSignal();
}
