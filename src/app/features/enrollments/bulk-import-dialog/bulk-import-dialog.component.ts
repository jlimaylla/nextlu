import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { read, utils } from 'xlsx';
import { UserRepository } from '../../../shared/repositories/user.repository';
import { CourseRepository } from '../../../shared/repositories/course.repository';
import { EnrollmentRepository } from '../../../shared/repositories/enrollment.repository';
import { CompanyContextService } from '../../../core/services/company-context.service';
import { EnrollmentType } from '../../../shared/models/enrollment.model';

interface PreviewRow {
  email: string;
  displayName?: string;
  userId?: string;
  status: 'matched' | 'not_found' | 'already_enrolled';
}

@Component({
  selector: 'app-bulk-import-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './bulk-import-dialog.component.html',
})
export class BulkImportDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<BulkImportDialogComponent, boolean>);
  private readonly userRepo = inject(UserRepository);
  private readonly courseRepo = inject(CourseRepository);
  private readonly enrollmentRepo = inject(EnrollmentRepository);
  private readonly companyContext = inject(CompanyContextService);

  readonly courses = computed(() => this.courseRepo.all().filter((c) => c.status === 'PUBLISHED'));

  readonly form = this.fb.nonNullable.group({
    courseId: ['', Validators.required],
    type: ['REQUIRED' as EnrollmentType, Validators.required],
  });

  readonly fileName = signal('');
  readonly rows = signal<PreviewRow[]>([]);
  readonly isParsing = signal(false);
  readonly isImporting = signal(false);
  readonly parseError = signal('');

  readonly matchedCount = computed(() => this.rows().filter((r) => r.status === 'matched').length);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fileName.set(file.name);
    this.parseError.set('');
    this.rows.set([]);
    this.isParsing.set(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = utils.sheet_to_json<Record<string, unknown>>(sheet);

      const emails = data
        .map((row) => {
          const key = Object.keys(row).find((k) => k.trim().toLowerCase() === 'email');
          return key ? String(row[key]).trim().toLowerCase() : '';
        })
        .filter(Boolean);

      if (emails.length === 0) {
        this.parseError.set('No se encontró una columna "email" con datos en el archivo.');
        return;
      }

      const courseId = this.form.getRawValue().courseId;
      const participantsByEmail = new Map(
        this.userRepo
          .all()
          .filter((u) => u.role === 'PARTICIPANT')
          .map((u) => [u.email.toLowerCase(), u])
      );
      const alreadyEnrolled = new Set(
        this.enrollmentRepo
          .all()
          .filter((e) => e.courseId === courseId)
          .map((e) => e.userId)
      );

      this.rows.set(
        emails.map((email) => {
          const user = participantsByEmail.get(email);
          if (!user) return { email, status: 'not_found' as const };
          if (alreadyEnrolled.has(user.id)) {
            return {
              email,
              displayName: user.displayName,
              userId: user.id,
              status: 'already_enrolled' as const,
            };
          }
          return { email, displayName: user.displayName, userId: user.id, status: 'matched' as const };
        })
      );
    } catch {
      this.parseError.set('No se pudo leer el archivo. Verifica que sea un .xlsx válido.');
    } finally {
      this.isParsing.set(false);
      input.value = '';
    }
  }

  async confirmImport(): Promise<void> {
    if (this.form.invalid || this.matchedCount() === 0) return;
    const { courseId, type } = this.form.getRawValue();
    const companyId = this.companyContext.companyId();
    if (!companyId) return;

    this.isImporting.set(true);
    try {
      const matched = this.rows().filter((r) => r.status === 'matched' && r.userId);
      await Promise.all(
        matched.map((r) =>
          this.enrollmentRepo.create({
            companyId,
            userId: r.userId!,
            courseId,
            type,
            progressPercent: 0,
          })
        )
      );
      this.dialogRef.close(true);
    } finally {
      this.isImporting.set(false);
    }
  }
}
