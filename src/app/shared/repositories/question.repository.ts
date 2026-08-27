import { Injectable } from '@angular/core';
import { BaseFirestoreRepository } from './base-firestore.repository';
import { Question } from '../models/evaluation.model';

@Injectable({ providedIn: 'root' })
export class QuestionRepository extends BaseFirestoreRepository<Question> {
  protected readonly collectionPath = 'questions';
  readonly all = this.getAllSignal();

  async reorder(questions: Question[]): Promise<void> {
    await Promise.all(questions.map((q, index) => this.update(q.id, { order: index })));
  }
}
