import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyDG30PHcYTLGwBconEjxZpDZ9WuuvaEZCo",
    authDomain: "nextlu-platform.firebaseapp.com",
    projectId: "nextlu-platform",
    storageBucket: "nextlu-platform.firebasestorage.app",
    messagingSenderId: "912145309620",
    appId: "1:912145309620:web:519659cfc75ba45ce15ce1"
  },
  // Usuarios de prueba — créalos en Firebase Auth o en el emulador local
  devCredentials: [
    {
      role: 'SUPER_ADMIN',
      label: 'Super Admin',
      icon: 'admin_panel_settings',
      email: 'superadmin@dev.local',
      password: 'Dev123456!',
    },
    {
      role: 'COMPANY_ADMIN',
      label: 'Admin Empresa',
      icon: 'manage_accounts',
      email: 'admin@dev.local',
      password: 'Dev123456!',
    },
    {
      role: 'PARTICIPANT',
      label: 'Participante',
      icon: 'person',
      email: 'participante@dev.local',
      password: 'Dev123456!',
    },
  ],
};
