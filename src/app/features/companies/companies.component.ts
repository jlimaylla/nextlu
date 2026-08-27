import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <app-page-header title="Empresas" subtitle="Administración de empresas registradas">
      <a mat-flat-button color="primary" routerLink="new">
        <mat-icon>add</mat-icon> Nueva empresa
      </a>
    </app-page-header>
    <!-- TODO: implementar tabla de empresas con CompanyRepository -->
  `,
})
export class CompaniesComponent {}
