import { UserRole } from '../../core/auth/models/auth-user.model';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { label: 'Empresas', icon: 'business', route: '/companies', roles: ['SUPER_ADMIN'] },
  {
    label: 'Usuarios',
    icon: 'people',
    route: '/users',
    roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
  },
  { label: 'Capacitaciones', icon: 'school', route: '/courses', roles: ['COMPANY_ADMIN'] },
  { label: 'Participantes', icon: 'group', route: '/enrollments', roles: ['COMPANY_ADMIN'] },
  { label: 'Evaluaciones', icon: 'quiz', route: '/evaluations', roles: ['COMPANY_ADMIN'] },
  {
    label: 'Certificados',
    icon: 'workspace_premium',
    route: '/certificates',
    roles: ['COMPANY_ADMIN'],
  },
  { label: 'Reportes', icon: 'bar_chart', route: '/reports', roles: ['COMPANY_ADMIN'] },
  { label: 'Mis Cursos', icon: 'play_circle', route: '/my-courses', roles: ['PARTICIPANT'] },
  {
    label: 'Mis Certificados',
    icon: 'card_membership',
    route: '/my-certificates',
    roles: ['PARTICIPANT'],
  },
];
