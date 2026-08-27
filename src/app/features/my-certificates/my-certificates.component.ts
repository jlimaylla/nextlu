import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-my-certificates',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Mis Certificados" subtitle="Certificados obtenidos" />
    <!-- TODO: lista de certificados con código, curso, fecha y botón de descarga PDF -->
  `,
})
export class MyCertificatesComponent {}
