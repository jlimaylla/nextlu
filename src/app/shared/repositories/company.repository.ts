import { Injectable } from '@angular/core';
import { BaseFirestoreRepository } from './base-firestore.repository';
import { Company } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyRepository extends BaseFirestoreRepository<Company> {
  protected readonly collectionPath = 'companies';
  readonly all = this.getAllSignal();
}
