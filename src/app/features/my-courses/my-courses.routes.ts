import { Routes } from '@angular/router';

export const MY_COURSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./my-courses.component').then((m) => m.MyCoursesComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./course-player/course-player.component').then((m) => m.CoursePlayerComponent),
  },
];
