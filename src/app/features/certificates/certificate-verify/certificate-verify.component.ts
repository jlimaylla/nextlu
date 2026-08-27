import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-certificate-verify',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <mat-card class="w-full max-w-lg">
        <mat-card-content class="!p-8 text-center">
          <mat-icon class="!text-6xl text-primary-600 mb-4">workspace_premium</mat-icon>
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">Verificación de Certificado</h1>
          <p class="text-gray-500 mt-2">Código: {{ code() }}</p>
          <!-- TODO: consultar Firestore por el código y mostrar datos del certificado -->
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class CertificateVerifyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly code = signal('');

  ngOnInit(): void {
    this.code.set(this.route.snapshot.paramMap.get('code') ?? '');
  }
}
