import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class CompanyContextService {
  private readonly auth = inject(AuthService);

  readonly companyId = computed(() => this.auth.currentUser()?.companyId ?? null);
  readonly isSuperAdmin = computed(() => this.auth.currentUser()?.role === 'SUPER_ADMIN');
  readonly isCompanyAdmin = computed(() => this.auth.currentUser()?.role === 'COMPANY_ADMIN');
  readonly isParticipant = computed(() => this.auth.currentUser()?.role === 'PARTICIPANT');
}
