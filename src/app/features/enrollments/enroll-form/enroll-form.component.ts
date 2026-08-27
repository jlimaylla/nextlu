import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UserRepository } from '../../../shared/repositories/user.repository';
import { CourseRepository } from '../../../shared/repositories/course.repository';
import { EnrollmentRepository } from '../../../shared/repositories/enrollment.repository';
import { CompanyContextService } from '../../../core/services/company-context.service';
import { AppUser } from '../../../shared/models/user.model';
import { EnrollmentType } from '../../../shared/models/enrollment.model';

@Component({
  selector: 'app-enroll-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './enroll-form.component.html',
  styleUrl: './enroll-form.component.scss',
})
export class EnrollFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userRepo = inject(UserRepository);
  private readonly courseRepo = inject(CourseRepository);
  private readonly enrollmentRepo = inject(EnrollmentRepository);
  private readonly companyContext = inject(CompanyContextService);

  readonly participants = computed(() =>
    this.userRepo.all().filter((u) => u.role === 'PARTICIPANT' && u.status === 'ACTIVE')
  );
  readonly courses = computed(() => this.courseRepo.all().filter((c) => c.status === 'PUBLISHED'));

  // Autocomplete: el control visible guarda texto mientras se escribe y el AppUser
  // completo una vez elegido de la lista (displayParticipant formatea ambos casos).
  readonly participantSearchCtrl = new FormControl<string | AppUser>('', { nonNullable: true });
  private readonly participantSearchValue = toSignal(this.participantSearchCtrl.valueChanges, {
    initialValue: '' as string | AppUser,
  });

  readonly filteredParticipants = computed(() => {
    const value = this.participantSearchValue();
    const term = (
      typeof value === 'string' ? value : `${value.displayName} ${value.email}`
    ).toLowerCase();
    return this.participants().filter(
      (p) =>
        !term || p.displayName.toLowerCase().includes(term) || p.email.toLowerCase().includes(term)
    );
  });

  readonly isSaving = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    courseId: ['', Validators.required],
    type: ['REQUIRED' as EnrollmentType, Validators.required],
  });

  constructor() {
    // Si borra o cambia el texto después de haber elegido a alguien, invalida esa
    // selección en vez de dejar un userId "fantasma" que ya no corresponde al texto.
    this.participantSearchCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (typeof value === 'string') {
          this.form.controls.userId.setValue('');
        }
      });
  }

  displayParticipant = (user: AppUser | string | null): string => {
    if (!user) return '';
    return typeof user === 'string' ? user : `${user.displayName} — ${user.email}`;
  };

  onParticipantSelected(event: MatAutocompleteSelectedEvent): void {
    const user = event.option.value as AppUser;
    this.form.controls.userId.setValue(user.id);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set('');
    const { userId, courseId, type } = this.form.getRawValue();

    const alreadyEnrolled = this.enrollmentRepo
      .all()
      .some((e) => e.userId === userId && e.courseId === courseId);
    if (alreadyEnrolled) {
      this.errorMessage.set('Este participante ya está inscrito en esta capacitación.');
      return;
    }

    const companyId = this.companyContext.companyId();
    if (!companyId) return;

    this.isSaving.set(true);
    try {
      await this.enrollmentRepo.create({ companyId, userId, courseId, type, progressPercent: 0 });
      await this.router.navigate(['/enrollments']);
    } finally {
      this.isSaving.set(false);
    }
  }
}
