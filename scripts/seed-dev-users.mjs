// scripts/seed-dev-users.mjs
//
// Siembra (idempotente) la empresa demo y los 3 usuarios de prueba en el
// proyecto REAL de Firebase (Auth + Firestore) para poder probar los 3
// niveles de acceso (SUPER_ADMIN, COMPANY_ADMIN, PARTICIPANT) en modo dev.
//
// Requiere una service account key descargada desde:
//   Firebase Console → Configuración del proyecto → Cuentas de servicio
//   → Generar nueva clave privada
//
// NUNCA subas ese archivo a git. Guárdalo fuera del repo o en la raíz con
// el nombre serviceAccountKey.json (ya está en .gitignore).
//
// Uso:
//   GOOGLE_APPLICATION_CREDENTIALS="../serviceAccountKey.json" node scripts/seed-dev-users.mjs
//   // o, en PowerShell:
//   $env:GOOGLE_APPLICATION_CREDENTIALS="../serviceAccountKey.json"; node scripts/seed-dev-users.mjs

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';

const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '../serviceAccountKey.json';

const app = existsSync(KEY_PATH)
  ? initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) })
  : initializeApp({ credential: applicationDefault() });

const auth = getAuth(app);
const db = getFirestore(app);

const DEMO_COMPANY_ID = 'demo-company';
const PASSWORD = 'Dev123456!';

const DEV_USERS = [
  {
    email: 'superadmin@dev.local',
    displayName: 'Super Admin (dev)',
    role: 'SUPER_ADMIN',
    companyId: null,
  },
  {
    email: 'admin@dev.local',
    displayName: 'Admin Empresa (dev)',
    role: 'COMPANY_ADMIN',
    companyId: DEMO_COMPANY_ID,
  },
  {
    email: 'participante@dev.local',
    displayName: 'Participante (dev)',
    role: 'PARTICIPANT',
    companyId: DEMO_COMPANY_ID,
  },
];

async function upsertAuthUser({ email, displayName }) {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password: PASSWORD, displayName });
    console.log(`  ↺ Auth: ${email} ya existía, password/nombre actualizados (uid=${existing.uid})`);
    return existing.uid;
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    const created = await auth.createUser({ email, password: PASSWORD, displayName, emailVerified: true });
    console.log(`  ✓ Auth: ${email} creado (uid=${created.uid})`);
    return created.uid;
  }
}

async function seedCompany() {
  const ref = db.collection('companies').doc(DEMO_COMPANY_ID);
  await ref.set(
    {
      name: 'Empresa Demo',
      ruc: '00000000000',
      email: 'contacto@empresademo.dev',
      phone: '+51 999 999 999',
      address: 'Av. Demo 123, Lima',
      logoUrl: '',
      status: 'ACTIVE',
      plan: 'DEMO',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log(`✓ Firestore: companies/${DEMO_COMPANY_ID} listo`);
}

async function seedUserDoc(uid, u) {
  await db.collection('users').doc(uid).set(
    {
      uid,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      companyId: u.companyId,
      status: 'ACTIVE',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Custom claims — usados por storage.rules (request.auth.token.role / companyId)
  await auth.setCustomUserClaims(uid, { role: u.role, companyId: u.companyId });

  console.log(`✓ Firestore: users/${uid} (${u.role}) listo, claims aplicados`);
}

async function main() {
  console.log('Sembrando entorno de prueba de accesos en el proyecto real...\n');
  await seedCompany();
  for (const u of DEV_USERS) {
    const uid = await upsertAuthUser(u);
    await seedUserDoc(uid, u);
  }
  console.log('\nListo. Los 3 usuarios de dev pueden iniciar sesión con password:', PASSWORD);
  console.log('(los botones de "dev login" de la pantalla de login ya usan estas credenciales)');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error sembrando datos de dev:', err);
  process.exit(1);
});
