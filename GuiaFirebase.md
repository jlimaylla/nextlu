# Guía Firebase — Nextlu Platform

Guía paso a paso para configurar todos los servicios de Firebase requeridos por la plataforma.

> Para sembrar los 3 usuarios de prueba (uno por rol) y verificar accesos en modo dev,
> ver `GuiaFirebaseDev.md`.

---

## 1. Crear el proyecto Firebase

1. Ir a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Clic en **Agregar proyecto**
3. Nombre del proyecto: `nextlu-platform` (o el nombre que prefieras)
4. Deshabilitar Google Analytics (opcional para MVP)
5. Clic en **Crear proyecto**

---

## 2. Registrar la aplicación web

1. En la pantalla principal del proyecto, clic en el ícono **`</>`** (Web)
2. Alias de la app: `laus-web`
3. **No** marcar Firebase Hosting aún (se configura después)
4. Copiar el objeto `firebaseConfig` que aparece

### Pegar la config en Angular

Edita `src/environments/environment.ts` y `environment.prod.ts`:

```ts
firebase: {
  apiKey: 'AIzaSy...',
  authDomain: 'nextlu-platform.firebaseapp.com',
  projectId: 'nextlu-platform',
  storageBucket: 'nextlu-platform.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
},
```

---

## 3. Instalar dependencias

```bash
cd nextlu-platform
npm install
npm install @angular/fire firebase
```

> Verificar compatibilidad de versiones: `@angular/fire` debe coincidir con la versión de Angular
> (`npm info @angular/fire peerDependencies`).

---

## 4. Firebase Authentication

### 4.1 Activar proveedor Email/Contraseña

1. En la consola → **Authentication** → **Sign-in method**
2. Activar **Correo electrónico/contraseña**
3. Guardar

### 4.2 Crear el primer SUPER_ADMIN manualmente

1. **Authentication** → **Users** → **Agregar usuario**
2. Ingresar email y contraseña
3. Copiar el **UID** generado
4. Ir a Firestore y crear el documento manualmente (ver sección 5.3)

---

## 5. Cloud Firestore

### 5.1 Crear la base de datos

1. **Firestore Database** → **Crear base de datos**
2. Seleccionar **Modo de producción** (reglas restrictivas desde el inicio)
3. Ubicación: `us-central1` (o la más cercana)

### 5.2 Estructura de colecciones

Cada documento de colección de empresa lleva obligatoriamente el campo `companyId`.

| Colección | Propósito |
|---|---|
| `companies` | Empresas registradas |
| `users` | Usuarios (todos los roles) |
| `courses` | Catálogo de cursos |
| `course_modules` | Módulos por curso |
| `course_materials` | Materiales por módulo |
| `enrollments` | Inscripciones participante↔curso |
| `progress` | Progreso por módulo |
| `evaluations` | Configuración de evaluaciones |
| `questions` | Banco de preguntas |
| `exam_attempts` | Intentos de evaluación |
| `certificates` | Certificados emitidos |
| `notifications` | Log de notificaciones enviadas |
| `audit_logs` | Auditoría de acciones |

### 5.3 Crear el primer SUPER_ADMIN en Firestore

Ir a **Firestore** → **Iniciar colección** → `users` → agregar documento con ID = UID del usuario:

```json
{
  "uid": "<UID copiado de Authentication>",
  "displayName": "Super Administrador",
  "email": "admin@tudominio.com",
  "role": "SUPER_ADMIN",
  "companyId": null,
  "isActive": true,
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

### 5.4 Reglas de seguridad Firestore

Ir a **Firestore** → **Reglas** y pegar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Funciones auxiliares ───────────────────────────────────────────────
    function isAuth() {
      return request.auth != null;
    }

    function getUser() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isSuperAdmin() {
      return isAuth() && getUser().role == 'SUPER_ADMIN';
    }

    function isCompanyAdmin(companyId) {
      return isAuth()
        && getUser().role == 'COMPANY_ADMIN'
        && getUser().companyId == companyId;
    }

    function isParticipant(companyId) {
      return isAuth()
        && getUser().role == 'PARTICIPANT'
        && getUser().companyId == companyId;
    }

    function belongsToCompany(companyId) {
      return isAuth() && getUser().companyId == companyId;
    }

    // ── companies ──────────────────────────────────────────────────────────
    match /companies/{companyId} {
      allow read: if isSuperAdmin() || belongsToCompany(companyId);
      allow write: if isSuperAdmin();
    }

    // ── users ──────────────────────────────────────────────────────────────
    match /users/{userId} {
      allow read: if isAuth() && (
        isSuperAdmin() ||
        request.auth.uid == userId ||
        isCompanyAdmin(resource.data.companyId)
      );
      allow create: if isSuperAdmin() || isCompanyAdmin(request.resource.data.companyId);
      allow update: if isSuperAdmin() || isCompanyAdmin(resource.data.companyId);
      allow delete: if isSuperAdmin();
    }

    // ── courses ────────────────────────────────────────────────────────────
    match /courses/{courseId} {
      allow read: if isAuth() && (
        isSuperAdmin() ||
        isCompanyAdmin(resource.data.companyId) ||
        isParticipant(resource.data.companyId)
      );
      allow create, update: if isCompanyAdmin(request.resource.data.companyId) || isSuperAdmin();
      allow delete: if isCompanyAdmin(resource.data.companyId) || isSuperAdmin();
    }

    // ── course_modules y course_materials ──────────────────────────────────
    // Nota: create/update validan contra request.resource.data (doc propuesto) y delete
    // contra resource.data (doc existente) — en un delete, request.resource es null, así
    // que una sola regla de "write" combinada deniega TODOS los deletes silenciosamente.
    match /course_modules/{docId} {
      allow read: if isAuth() && (isSuperAdmin() || belongsToCompany(resource.data.companyId));
      allow create, update: if isAuth() && (isSuperAdmin() || isCompanyAdmin(request.resource.data.companyId));
      allow delete: if isAuth() && (isSuperAdmin() || isCompanyAdmin(resource.data.companyId));
    }

    match /course_materials/{docId} {
      allow read: if isAuth() && (isSuperAdmin() || belongsToCompany(resource.data.companyId));
      allow create, update: if isAuth() && (isSuperAdmin() || isCompanyAdmin(request.resource.data.companyId));
      allow delete: if isAuth() && (isSuperAdmin() || isCompanyAdmin(resource.data.companyId));
    }

    // ── enrollments ────────────────────────────────────────────────────────
    match /enrollments/{docId} {
      allow read: if isAuth() && (
        isSuperAdmin() ||
        isCompanyAdmin(resource.data.companyId) ||
        (isParticipant(resource.data.companyId) && resource.data.userId == request.auth.uid)
      );
      allow create, update: if isAuth() && (
        isSuperAdmin() ||
        isCompanyAdmin(request.resource.data.companyId)
      );
      allow delete: if isSuperAdmin() || isCompanyAdmin(resource.data.companyId);
    }

    // ── progress ───────────────────────────────────────────────────────────
    match /progress/{docId} {
      allow read: if isAuth() && (
        isSuperAdmin() ||
        isCompanyAdmin(resource.data.companyId) ||
        (belongsToCompany(resource.data.companyId) && resource.data.userId == request.auth.uid)
      );
      allow create, update: if isAuth() && (
        isSuperAdmin() ||
        isCompanyAdmin(request.resource.data.companyId) ||
        request.resource.data.userId == request.auth.uid
      );
    }

    // ── evaluations y questions ────────────────────────────────────────────
    match /evaluations/{docId} {
      allow read: if isAuth() && (isSuperAdmin() || belongsToCompany(resource.data.companyId));
      allow create, update: if isSuperAdmin() || isCompanyAdmin(request.resource.data.companyId);
      allow delete: if isSuperAdmin() || isCompanyAdmin(resource.data.companyId);
    }

    match /questions/{docId} {
      allow read: if isAuth() && (isSuperAdmin() || belongsToCompany(resource.data.companyId));
      allow create, update: if isSuperAdmin() || isCompanyAdmin(request.resource.data.companyId);
      allow delete: if isSuperAdmin() || isCompanyAdmin(resource.data.companyId);
    }

    // ── exam_attempts ──────────────────────────────────────────────────────
    match /exam_attempts/{docId} {
      allow read: if isAuth() && (
        isSuperAdmin() ||
        isCompanyAdmin(resource.data.companyId) ||
        (belongsToCompany(resource.data.companyId) && resource.data.userId == request.auth.uid)
      );
      allow create: if isAuth() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isSuperAdmin();
    }

    // ── certificates ───────────────────────────────────────────────────────
    match /certificates/{docId} {
      // Verificación pública por código (sin auth)
      allow read: if true;
      allow create, update: if isSuperAdmin() || isCompanyAdmin(request.resource.data.companyId);
      allow delete: if isSuperAdmin() || isCompanyAdmin(resource.data.companyId);
    }

    // ── notifications ──────────────────────────────────────────────────────
    match /notifications/{docId} {
      allow read: if isSuperAdmin() || isCompanyAdmin(resource.data.companyId);
      allow create, update: if isSuperAdmin() || isCompanyAdmin(request.resource.data.companyId);
      allow delete: if isSuperAdmin() || isCompanyAdmin(resource.data.companyId);
    }

    // ── audit_logs (solo lectura para admins, escritura interna) ──────────
    match /audit_logs/{docId} {
      allow read: if isSuperAdmin() || isCompanyAdmin(resource.data.companyId);
      allow create: if isAuth();
      allow update, delete: if false;
    }
  }
}
```

---

## 6. Firebase Storage

### 6.1 Activar Storage

1. **Storage** → **Comenzar**
2. Modo de producción → seleccionar ubicación → Listo

### 6.2 Estructura de carpetas sugerida

```
companies/{companyId}/logo.{ext}
courses/{companyId}/{courseId}/cover.{ext}
materials/{companyId}/{courseId}/{moduleId}/{fileName}
certificates/{companyId}/{userId}/{code}.pdf
```

### 6.3 Reglas de Storage

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuth() {
      return request.auth != null;
    }

    // Logos de empresa — solo COMPANY_ADMIN o SUPER_ADMIN
    match /companies/{companyId}/{allPaths=**} {
      allow read: if isAuth();
      allow write: if isAuth() && (
        request.auth.token.role == 'SUPER_ADMIN' ||
        (request.auth.token.role == 'COMPANY_ADMIN' &&
         request.auth.token.companyId == companyId)
      );
    }

    // Materiales de cursos
    match /courses/{companyId}/{allPaths=**} {
      allow read: if isAuth();
      allow write: if isAuth() && (
        request.auth.token.role == 'SUPER_ADMIN' ||
        (request.auth.token.role == 'COMPANY_ADMIN' &&
         request.auth.token.companyId == companyId)
      );
    }

    // Certificados PDF — lectura pública para descarga
    match /certificates/{companyId}/{allPaths=**} {
      allow read: if true;
      allow write: if isAuth() && (
        request.auth.token.role == 'SUPER_ADMIN' ||
        (request.auth.token.role == 'COMPANY_ADMIN' &&
         request.auth.token.companyId == companyId)
      );
    }
  }
}
```

> **Nota:** Para que las reglas de Storage lean el `role` y `companyId` del token, se necesitan
> **Custom Claims** en Firebase Authentication. Esto requiere Firebase Functions o Admin SDK
> en el backend. Para el MVP, puedes simplificar las reglas de Storage solo con `isAuth()`.

---

## 7. Firebase Hosting

### 7.1 Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 7.2 Inicializar Hosting en el proyecto Angular

```bash
cd nextlu-platform
firebase init hosting
```

Respuestas durante la inicialización:
- **¿Qué proyecto de Firebase deseas usar?** → Seleccionar `nextlu-platform`
- **¿Directorio público?** → `dist/nextlu-platform/browser`
- **¿Configurar como SPA?** → **Sí**
- **¿Sobrescribir index.html?** → **No**

### 7.3 Archivo `firebase.json` resultante

```json
{
  "hosting": {
    "public": "dist/nextlu-platform/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }]
      }
    ]
  }
}
```

### 7.4 Comandos de despliegue

```bash
# Build para producción
npm run build

# Desplegar solo Hosting
firebase deploy --only hosting

# Desplegar todo (Hosting + Firestore rules + Storage rules)
firebase deploy

# Vista previa antes de publicar
firebase hosting:channel:deploy preview --expires 1d
```

---

## 8. Emuladores para desarrollo local

Permite desarrollar sin conexión a Firebase real.

### 8.1 Inicializar emuladores

```bash
firebase init emulators
```

Seleccionar: **Authentication**, **Firestore**, **Storage**

### 8.2 Iniciar emuladores

```bash
firebase emulators:start
```

URLs por defecto:
- Auth Emulator: `http://localhost:9099`
- Firestore Emulator: `http://localhost:8080`
- Storage Emulator: `http://localhost:9199`
- Emulator UI: `http://localhost:4000`

### 8.3 Conectar Angular a los emuladores

En `app.config.ts`, agregar los emuladores condicionalmente:

```ts
import { connectAuthEmulator } from '@angular/fire/auth';
import { connectFirestoreEmulator } from '@angular/fire/firestore';
import { connectStorageEmulator } from '@angular/fire/storage';
import { environment } from '../environments/environment';

// Dentro de providers, SOLO en desarrollo:
...(environment.production ? [] : [
  {
    provide: APP_INITIALIZER,
    useFactory: (auth: Auth, firestore: Firestore, storage: Storage) => () => {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(firestore, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
    },
    deps: [Auth, Firestore, Storage],
    multi: true,
  }
])
```

---

## 9. Índices Firestore requeridos

Firestore requiere índices compuestos para queries con múltiples campos ordenados.
Crearlos en **Firestore** → **Índices** → **Agregar índice**:

| Colección | Campos | Orden |
|---|---|---|
| `courses` | `companyId` ASC, `status` ASC, `createdAt` DESC | — |
| `enrollments` | `companyId` ASC, `userId` ASC, `completedAt` DESC | — |
| `enrollments` | `companyId` ASC, `courseId` ASC | — |
| `certificates` | `companyId` ASC, `issuedAt` DESC | — |
| `exam_attempts` | `companyId` ASC, `userId` ASC, `evaluationId` ASC | — |
| `audit_logs` | `companyId` ASC, `createdAt` DESC | — |

> Al ejecutar queries en desarrollo, la consola de Firebase mostrará un enlace directo para crear
> cada índice faltante.

---

## 10. Variables de entorno en CI/CD

Para GitHub Actions u otro CI, usar secretos de repositorio con los valores de `firebaseConfig`:

```yaml
# .github/workflows/deploy.yml
- name: Build
  env:
    FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
    FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
  run: npm run build
```

Y en `angular.json`, definir las variables de entorno durante el build usando `define` del builder.
