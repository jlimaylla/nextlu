import { BaseEntity } from './base-entity.model';
import { UserRole } from '../../core/auth/models/auth-user.model';

export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface AppUser extends BaseEntity {
  companyId: string;
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  area?: string;
  position?: string;
  sede?: string;
  photoUrl?: string;
}
