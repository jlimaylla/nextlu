# Guía — Entorno Firebase para probar accesos por rol (modo dev)

Guía específica para dejar el proyecto Firebase real `nextlu-platform` listo y poder
iniciar sesión como cada uno de los 3 roles (`SUPER_ADMIN`, `COMPANY_ADMIN`, `PARTICIPANT`)
y verificar que los guards y las reglas de seguridad bloquean/permiten lo correcto.

No reemplaza a `GuiaFirebase.md` (setup completo del proyecto) — la complementa con el
flujo concreto de **datos de prueba + verificación de accesos**.

---

## 0. Qué ya existe en el código (punto de partida)

Al analizar el repo, esto ya está construido y solo falta "encender":

- `src/environments/environment.ts` ya apunta al proyecto real `nextlu-platform` y ya trae
  un arreglo `devCredentials` con 3 usuarios de prueba predefinidos.
- `LoginComponent` (`features/auth/login`) ya tiene 3 botones de **dev login** que llaman
  `AuthService.login()` directo con esas credenciales cuando `!environment.production`.
- `AuthService.loadProfile()` arma el `AuthUser` leyendo `users/{uid}` en Firestore
  (`role`, `companyId`, `isActive`).
- `roleGuard` en `app.routes.ts` ya restringe cada sección por rol (tabla abajo).

Lo que **falta** y es el objetivo de esta guía:

1. Los 3 usuarios de dev no existen ni en Auth ni en Firestore todavía.
2. El proyecto no tiene reglas de seguridad desplegadas (Firestore en "modo producción"
   deniega todo por defecto sin reglas explícitas).
3. No hay una empresa (`companies/*`) de prueba a la que asociar al `COMPANY_ADMIN`
   y al `PARTICIPANT`.

Ya creé en `nextlu-platform/` los archivos que faltaban para desplegar reglas:
`firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`,
y un script opcional `scripts/seed-dev-users.mjs`.

---

## 1. Habilitar Authentication (una sola vez)

1. [Firebase Console](https://console.firebase.google.com) → proyecto **nextlu-platform**.
2. **Authentication → Sign-in method** → activar **Correo electrónico/contraseña**.

---

## 2. Desplegar las reglas de seguridad

Sin esto, **todas** las lecturas/escrituras a Firestore fallarán con `permission-denied`,
incluso con un usuario válido — es indispensable antes de probar accesos.

```bash
npm install -g firebase-tools   # si no lo tienes
firebase login
cd nextlu-platform
firebase deploy --only firestore:rules,firestore:indexes
```

Verifica en **Firestore → Reglas** que se hayan actualizado. Con esto ya alcanza para todo
el checklist de accesos de esta guía (Auth + Firestore) — **Storage no es necesario todavía**,
ver nota abajo.

> `firestore.rules` en este repo es el mismo que documenta `GuiaFirebase.md` §5.4 — ya
> filtra cada colección por `companyId` y por rol.

### Storage — opcional, pospuesto

Google exige el **plan Blaze** (pago por uso) para habilitar Cloud Storage, incluso si no vas
a gastar nada — Spark (el plan gratuito) ya no lo permite. Storage solo se usa para subir
logos, materiales de curso y PDFs de certificados, nada de eso está en el checklist de
accesos, así que **no hace falta para probar roles ahora**.

Cuando llegue el momento de implementar subida de archivos:

1. Actualiza el proyecto a Blaze: `https://console.firebase.google.com/project/nextlu-platform/usage/details`
   (tiene capa gratuita — 5 GB almacenados, 1 GB/día de descarga — normalmente no se paga
   nada en dev, pero sí pide vincular una tarjeta).
2. Recién ahí: `Storage → Comenzar` en la consola, y luego `firebase deploy --only storage`.

Alternativa sin tarjeta: usar el **Storage Emulator** local (`firebase emulators:start`) solo
para esa parte, sin tocar el proyecto real — pero es un cambio de enfoque aparte del que
sigue esta guía (que usa el proyecto real para Auth/Firestore).

---

## 3. Crear la empresa demo y los 3 usuarios de dev

Elige **una** de las dos opciones. Ambas dejan exactamente estas credenciales
(coinciden con `environment.ts → devCredentials`, contraseña para las tres: `Dev123456!`):

| Rol | Email | companyId |
|---|---|---|
| `SUPER_ADMIN` | `superadmin@dev.local` | `null` |
| `COMPANY_ADMIN` | `admin@dev.local` | `demo-company` |
| `PARTICIPANT` | `participante@dev.local` | `demo-company` |

### Opción A — Manual por consola (más simple, sin secretos)

1. **Firestore → Iniciar colección** `companies`, ID del documento `demo-company`:
   ```json
   { "name": "Empresa Demo", "ruc": "00000000000", "email": "contacto@empresademo.dev",
     "phone": "+51 999 999 999", "address": "Av. Demo 123, Lima", "logoUrl": "",
     "status": "ACTIVE", "plan": "DEMO" }
   ```
2. **Authentication → Users → Agregar usuario** — crea los 3 emails de la tabla con
   password `Dev123456!`. Copia el **UID** de cada uno.
3. **Firestore → colección `users`** → un documento por usuario, **ID del documento = UID
   copiado** (no un ID autogenerado):
   ```json
   {
     "uid": "<uid>",
     "displayName": "Super Admin (dev)",
     "email": "superadmin@dev.local",
     "role": "SUPER_ADMIN",
     "companyId": null,
     "status": "ACTIVE"
   }
   ```
   Repite para `admin@dev.local` (`role: "COMPANY_ADMIN"`, `companyId: "demo-company"`) y
   `participante@dev.local` (`role: "PARTICIPANT"`, `companyId: "demo-company"`).

### Opción B — Script automático (`scripts/seed-dev-users.mjs`)

Crea/actualiza todo de un golpe con el Admin SDK. Requiere una **service account key**:

1. **Project Settings → Cuentas de servicio → Generar nueva clave privada** → descarga el JSON.
2. Guárdalo **fuera del repo** (o en la raíz de `nextlu-platform/` como
   `serviceAccountKey.json` — ya está en `.gitignore`, nunca lo subas a git).
3. Ejecuta:
   ```bash
   cd nextlu-platform
   # PowerShell:
   $env:GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json"; npm run seed:dev
   # bash:
   GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json" npm run seed:dev
   ```

El script es **idempotente**: puedes correrlo de nuevo en cualquier momento para
resetear password/rol/companyId de los 3 usuarios de dev. También aplica *custom claims*
(`role`, `companyId`) usados por `storage.rules`.

---

## 4. Levantar la app y probar

```bash
cd nextlu-platform
npm start
```

Abre `http://localhost:4200/auth/login`. En dev (`environment.production === false`) verás
3 botones de acceso rápido — uno por rol — que loguean directo sin escribir credenciales.

---

## 5. Checklist de verificación de accesos

Matriz real de `app.routes.ts` (`roleGuard`) — cualquier ruta fuera de la lista permitida
para un rol debe redirigir automáticamente a `/dashboard`:

| Ruta | SUPER_ADMIN | COMPANY_ADMIN | PARTICIPANT |
|---|:---:|:---:|:---:|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/companies` | ✅ | ❌ | ❌ |
| `/users` | ✅ | ✅ | ❌ |
| `/courses` | ❌ | ✅ | ❌ |
| `/enrollments` | ❌ | ✅ | ❌ |
| `/evaluations` | ❌ | ✅ | ❌ |
| `/certificates` | ❌ | ✅ | ❌ |
| `/reports` | ❌ | ✅ | ❌ |
| `/my-courses` | ❌ | ❌ | ✅ |
| `/my-certificates` | ❌ | ❌ | ✅ |
| `/verify/:code` | ✅ (público, sin login) | ✅ | ✅ |

Prueba con cada uno de los 3 botones de dev login:

1. **Navegación bloqueada por guard** — entra manualmente a una ruta no permitida
   (ej. como `PARTICIPANT`, ve a `/companies`) → debe rebotar a `/dashboard`, no mostrar error.
2. **Datos filtrados por Firestore rules, no solo por UI** — abre la consola del navegador
   y confirma que no hay `permission-denied` en las rutas permitidas, y que sí lo hay
   (esperado) si fuerzas una consulta fuera de tu `companyId` (ej. cambiando el `companyId`
   a mano en devtools antes de una query).
3. **`SUPER_ADMIN` sin `companyId`** — confirma que puede leer/escribir `companies/*` y
   `users/*` de cualquier empresa.
4. **Aislamiento entre empresas (multi-tenant)** — crea una segunda empresa + un
   `COMPANY_ADMIN` de esa empresa y confirma que ninguno ve datos de `demo-company`.
5. **Certificados** — `/verify/:code` debe funcionar **sin sesión iniciada** (regla
   `allow read: if true` en `certificates`).

---

## 6. Troubleshooting

| Síntoma | Causa probable |
|---|---|
| `Missing or insufficient permissions` en cualquier pantalla | Reglas no desplegadas (paso 2), o el doc `users/{uid}` no existe/tiene mal el `companyId` |
| Botón de dev login dice "Usuario de dev no encontrado" | El usuario no existe en Authentication todavía (paso 3) |
| Login funciona pero cae siempre a rutas vacías / redirige a `/dashboard` en todo | El doc `users/{uid}` no tiene `role` válido, o el **ID del documento no es el UID** |
| `PARTICIPANT`/`COMPANY_ADMIN` ven datos de otra empresa | `companyId` mal escrito en el doc de `users` — revisa que coincida exactamente con el ID del doc en `companies` |
| `Firebase Storage has not been set up on project...` al hacer deploy | Esperado por ahora — Storage requiere plan Blaze, ver nota en el paso 2. No bloquea el resto de la guía |
| (más adelante) Reglas de Storage no filtran por rol | Storage rules dependen de *custom claims* (`request.auth.token.role`); solo la Opción B (script) los setea. Con la Opción A manual, Storage solo valida `isAuth()` |

---

## 7. Estado del usuario: `status`, no `isActive`

`AuthService.loadProfile()` ahora deriva `isActive` desde `status` (`data.status !== 'BLOCKED'`),
alineado con `AppUser.status: 'ACTIVE' | 'BLOCKED'` (`shared/models/user.model.ts`) — la única
fuente de verdad en Firestore es `status`. No sembrar/usar un campo `isActive` suelto en el
documento de `users/*`.
