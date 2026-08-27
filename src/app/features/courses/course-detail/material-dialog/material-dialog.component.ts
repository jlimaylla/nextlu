import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import {
  CourseMaterial,
  MaterialType,
  MATERIAL_TYPE_LABELS,
} from '../../../../shared/models/course.model';

export interface MaterialDialogData {
  material?: CourseMaterial;
}

export interface MaterialDialogResult {
  type: MaterialType;
  title: string;
  url: string;
}

@Component({
  selector: 'app-material-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.material ? 'Editar material' : 'Nuevo material' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="flex flex-col gap-7 !pt-3">
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="type">
            @for (opt of typeOptions; track opt[0]) {
              <mat-option [value]="opt[0]">{{ opt[1] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Título</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>URL</mat-label>
          <input matInput formControlName="url" placeholder="https://..." />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          Guardar
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class MaterialDialogComponent {
  readonly data = inject<MaterialDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<MaterialDialogComponent, MaterialDialogResult>);
  private readonly fb = inject(FormBuilder);

  readonly typeOptions = Object.entries(MATERIAL_TYPE_LABELS) as [MaterialType, string][];

  readonly form = this.fb.group({
    type: [(this.data.material?.type ?? 'EXTERNAL_LINK') as MaterialType, Validators.required],
    title: [this.data.material?.title ?? '', Validators.required],
    url: [this.data.material?.url ?? '', Validators.required],
  });

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue() as MaterialDialogResult);
  }
}
