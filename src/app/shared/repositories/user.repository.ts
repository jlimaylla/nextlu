import { Injectable } from '@angular/core';
import { BaseFirestoreRepository } from './base-firestore.repository';
import { AppUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserRepository extends BaseFirestoreRepository<AppUser> {
  protected readonly collectionPath = 'users';

  // Para SUPER_ADMIN (companyId null) esto trae usuarios de TODAS las empresas — es el
  // comportamiento esperado de BaseFirestoreRepository.getAll() (solo filtra por
  // companyId cuando el usuario actual tiene uno).
  readonly all = this.getAllSignal();

  // No hay create() propio acá: el doc de un usuario DEBE tener como ID el uid de
  // Authentication, y BaseFirestoreRepository.create() usa addDoc (ID autogenerado).
  // Ver UserProvisioningService.createUser().

  block(id: string): Promise<void> {
    return this.update(id, { status: 'BLOCKED' });
  }

  unblock(id: string): Promise<void> {
    return this.update(id, { status: 'ACTIVE' });
  }
}
