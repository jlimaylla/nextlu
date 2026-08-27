import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UserRepository } from '../../../shared/repositories/user.repository';
import { UserProvisioningService } from '../../../shared/services/user-provisioning.service';
import { CompanyContextService } from '../../../core/services/company-context.service';
import { UserRole } from '../../../core/auth/models/auth-user.model';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'PARTICIPANT', label: 'Participante' },
  { value: 'COMPANY_ADMIN', label: 'Admin de empresa' },
];

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly repo = inject(UserRepository);
  private readonly provisioning = inject(UserProvisioningService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly userId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.userId;
  readonly isSaving = signal(false);
  readonly roleOptions = ROLE_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    displayName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['PARTICIPANT' as UserRole, Validators.required],
    area: [''],
    position: [''],
    sede: [''],
  });

  // El correo identifica la cuenta de Authentication — no se puede cambiar desde acá.
  private profileLoaded = false;

  constructor() {
    if (this.isEdit) {
      this.form.controls.email.disable();
      effect(() => {
        if (this.profileLoaded) return;
        const user = this.repo.all().find((u) => u.id === this.userId);
        if (!user) return;
        this.profileLoaded = true;
        this.form.patchValue({
          displayName: user.displayName,
          email: user.email,
          role: user.role === 'SUPER_ADMIN' ? 'COMPANY_ADMIN' : user.role,
          area: user.area ?? '',
          position: user.position ?? '',
          sede: user.sede ?? '',
        });
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    try {
      const value = this.form.getRawValue();
      if (this.isEdit && this.userId) {
        await this.repo.update(this.userId, {
          displayName: value.displayName,
          role: value.role,
          area: value.area,
          position: value.position,
          sede: value.sede,
        });
      } else {
        const companyId = this.companyContext.companyId();
        if (!companyId) throw new Error('No hay companyId en el contexto del usuario actual');
        await this.provisioning.createUser({
          email: value.email,
          displayName: value.displayName,
          role: value.role,
          companyId,
          area: value.area,
          position: value.position,
          sede: value.sede,
        });
      }
      await this.router.navigate(['/users']);
    } finally {
      this.isSaving.set(false);
    }
  }
}
