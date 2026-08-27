import { Timestamp } from '@angular/fire/firestore';
import { BaseEntity } from './base-entity.model';

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'FINISHED';
export type CourseCategory = 'SEGURIDAD' | 'CALIDAD' | 'RRHH' | 'OPERACIONES';

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  FINISHED: 'Finalizado',
};

// Variant de app-status-badge por estado.
export const COURSE_STATUS_VARIANT: Record<CourseStatus, 'warning' | 'success' | 'info'> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  FINISHED: 'info',
};

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  SEGURIDAD: 'Seguridad',
  CALIDAD: 'Calidad',
  RRHH: 'RRHH',
  OPERACIONES: 'Operaciones',
};

export interface Course extends BaseEntity {
  companyId: string;
  title: string;
  description: string;
  category: CourseCategory;
  coverUrl: string;
  durationHours: number;
  validityMonths: number;
  status: CourseStatus;
  isRequired: boolean;
}

export interface CourseModule extends BaseEntity {
  companyId: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
}

export type MaterialType = 'VIDEO_YOUTUBE' | 'PDF' | 'IMAGE' | 'DOWNLOAD' | 'EXTERNAL_LINK';

export interface CourseMaterial extends BaseEntity {
  companyId: string;
  courseId: string;
  moduleId: string;
  type: MaterialType;
  title: string;
  url: string;
  order: number;
}

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  VIDEO_YOUTUBE: 'Video de YouTube',
  PDF: 'PDF',
  IMAGE: 'Imagen',
  DOWNLOAD: 'Archivo descargable',
  EXTERNAL_LINK: 'Enlace externo',
};

export const MATERIAL_TYPE_ICONS: Record<MaterialType, string> = {
  VIDEO_YOUTUBE: 'smart_display',
  PDF: 'picture_as_pdf',
  IMAGE: 'image',
  DOWNLOAD: 'download',
  EXTERNAL_LINK: 'link',
};
