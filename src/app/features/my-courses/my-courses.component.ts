import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Mis Cursos" subtitle="Capacitaciones asignadas" />
    <!-- TODO: tarjetas de cursos con progreso, fecha de vencimiento y botón para continuar -->
  `,
})
export class MyCoursesComponent {}
