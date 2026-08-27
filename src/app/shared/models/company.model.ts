import { BaseEntity } from './base-entity.model';

export type CompanyStatus = 'ACTIVE' | 'INACTIVE';

export interface Company extends BaseEntity {
  name: string;
  ruc: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string;
  status: CompanyStatus;
  plan: string;
}
