export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'PARTICIPANT';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string | null; // null only for SUPER_ADMIN
  isActive: boolean;
}
