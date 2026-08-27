import { UserRole } from '../app/core/auth/models/auth-user.model';

export interface DevCredential {
  role: UserRole;
  label: string;
  icon: string;
  email: string;
  password: string;
}

export interface Environment {
  production: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  // Usuarios de prueba para los botones de acceso rápido en /auth/login.
  // Vacío en environment.prod.ts — esos botones solo deben existir en dev.
  devCredentials: DevCredential[];
}
