import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Empresa" subtitle="Crear o editar empresa" />
    <!-- TODO: formulario reactivo con campos: name, ruc, email, phone, address, plan -->
  `,
})
export class CompanyFormComponent {}
