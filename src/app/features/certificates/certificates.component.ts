import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Certificados" subtitle="Certificados emitidos — código CERT-YYYY-NNNNNN" />
    <!-- TODO: tabla de certificados con código, participante, curso, fecha, descarga PDF -->
  `,
})
export class CertificatesComponent {}
