import { Injectable } from '@angular/core';
import { BaseFirestoreRepository } from './base-firestore.repository';
import { Evaluation } from '../models/evaluation.model';

@Injectable({ providedIn: 'root' })
export class EvaluationRepository extends BaseFirestoreRepository<Evaluation> {
  protected readonly collectionPath = 'evaluations';
  readonly all = this.getAllSignal();
}
