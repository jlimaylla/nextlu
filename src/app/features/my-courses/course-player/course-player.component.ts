import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Reproduciendo Curso" />
    <!-- TODO: sidebar con módulos + área principal con material (video, PDF, etc.) -->
    <!-- Registrar inicio/fin de módulo y tiempo invertido en progress collection -->
  `,
})
export class CoursePlayerComponent {}
