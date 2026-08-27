# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # Primera vez (instala todas las dependencias)
npm start                # Dev server en http://localhost:4200
npm run build            # Build de producción en dist/
npm test                 # Ejecutar tests (Karma + Jasmine)
npm run test:file -- --include=**/foo.spec.ts  # Un solo archivo de test

firebase emulators:start # Emuladores locales (Auth 9099, Firestore 8080, Storage 9199)
firebase deploy          # Deploy a Firebase Hosting + reglas
```

## Architecture

### Folder structure

```
src/app/
├── core/                  # Singleton services, guards — importados UNA vez en app.config.ts
│   ├── auth/
│   │   ├── guards/        # authGuard (funcional), roleGuard (factory funcional)
│   │   ├── models/        # AuthUser, UserRole
│   │   └── services/      # AuthService — signal-based, wraps Firebase Auth
│   └── services/
│       ├── theme.service.ts          # ThemeService — toggle light/dark, persiste en localStorage
│       └── company-context.service.ts # CompanyContextService — companyId desde AuthUser
│
├── shared/                # Reutilizable en cualquier feature
│   ├── components/        # ConfirmDialogComponent, LoadingSpinnerComponent,
│   │   │                  # PageHeaderComponent, StatusBadgeComponent
│   ├── directives/        # HasRoleDirective (*appHasRole="'COMPANY_ADMIN'")
│   ├── models/            # Interfaces de dominio: Company, AppUser, Course, Enrollment,
│   │   │                  # Certificate, Evaluation, Question, ExamAttempt, BaseEntity
│   └── repositories/      # BaseFirestoreRepository<T> — abstracción CRUD + filtro automático
│                          # por companyId (inyecta CompanyContextService)
│
├── layout/                # Shell de la app
│   ├── admin-layout/      # mat-sidenav responsive — modo 'over' en mobile, 'side' en desktop
│   ├── auth-layout/       # Tarjeta centrada para login/recuperación
│   ├── header/            # Barra superior: menú, theme toggle, perfil
│   ├── sidebar/           # nav-list filtrado por rol; config en sidebar-nav.config.ts
│   └── theme-toggle/      # Botón icono que llama ThemeService.toggle()
│
└── features/              # Lazy-loaded, uno por sprint
    ├── auth/              # login, forgot-password (IMPLEMENTADO)
    ├── dashboard/         # Tarjetas KPI por rol (placeholder)
    ├── companies/         # SUPER_ADMIN: CRUD empresas
    ├── users/             # SUPER_ADMIN + COMPANY_ADMIN: CRUD usuarios
    ├── courses/           # COMPANY_ADMIN: catálogo + detalle con módulos
    ├── enrollments/       # COMPANY_ADMIN: inscripciones individuales y masivas
    ├── evaluations/       # COMPANY_ADMIN: banco de preguntas + configuración
    ├── certificates/      # COMPANY_ADMIN: lista; certificate-verify/ es PÚBLICA (sin auth)
    ├── reports/           # COMPANY_ADMIN: métricas + exportación
    ├── my-courses/        # PARTICIPANT: cursos asignados + course-player
    └── my-certificates/   # PARTICIPANT: certificados propios
```

### Key patterns

**State management:** Angular Signals throughout — `signal()`, `computed()`, `effect()`. Use `toSignal()` from `@angular/core/rxjs-interop` to bridge RxJS observables.

**Component inputs/outputs:** Use `input()` and `output()` functions (Angular 20 style), not `@Input()`/`@Output()` decorators.

**Dependency injection:** Always use `inject()` function inside class body — no constructor injection.

**Control flow:** Use `@if`, `@for`, `@switch` — never `*ngIf`, `*ngFor`.

**Repositories:** Extend `BaseFirestoreRepository<T>` for each Firestore collection. The base class automatically prepends `where('companyId', '==', companyId)` to every `getAll()` call when a user is logged in.

**Subscription lifecycle — regla obligatoria:**
Los Observables de Firestore son infinitos. NUNCA hagas `.subscribe()` sin cleanup.
Hay dos patrones válidos:

```ts
// ✅ Patrón A — Signal (recomendado, declarativo)
// Llamar en inicializador de campo o constructor (injection context activo).
// toSignal() internamente usa inject(DestroyRef) → auto-cleanup al destruir el componente.
readonly courses = inject(CourseRepository).getAllSignal();
readonly course  = inject(CourseRepository).getByIdSignal(this.id);

// ✅ Patrón B — takeUntilDestroyed (para lógica imperativa)
private readonly destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this.repo.getAll()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(items => this.items.set(items));
}

// ❌ NUNCA — memory leak: el listener Firestore vive tras destruir el componente
ngOnInit(): void {
  this.repo.getAll().subscribe(items => this.items.set(items));
}
```

Para listeners nativos de Firebase (como `onAuthStateChanged`) usar `inject(DestroyRef).onDestroy(unsubscribeFn)`.

### Multi-tenant security rule

Every Firestore document MUST include `companyId`. Every write must set it. The `BaseFirestoreRepository` handles read-side filtering; write-side validation is in Firestore Security Rules (see `GuiaFirebase.md`).

### Routing

- `/auth/*` → `AuthLayoutComponent` (public)
- `/verify/:code` → `CertificateVerifyComponent` (public, no auth)
- All other routes → `AdminLayoutComponent` behind `authGuard`
- Role-specific routes additionally protected by `roleGuard(['ROLE'])`

### Theme system

`ThemeService` toggles `.dark` class on `<html>`. The Angular Material M3 dark theme is applied via `.dark { @include mat.all-component-color-themes($dark-theme); }` in `styles.scss`. Tailwind uses `darkMode: 'class'` so `dark:` variants respond to the same class. A small inline script in `index.html` reads `localStorage` before first paint to prevent flash.

## Tech Stack

- **Angular 20** — standalone components, signals, new control flow
- **Angular Material 20** — M3 theme, `mat.$azure-palette`
- **TailwindCSS 3** — utility classes, `dark:` variant via `.dark` class, Preflight disabled
- **@angular/fire 19** — `provideFirebaseApp`, `provideAuth`, `provideFirestore`, `provideStorage`
- **Firebase** — Auth (email/password), Firestore, Storage, Hosting

## Firebase setup

See `../GuiaFirebase.md` for full Firebase project setup, security rules, emulators, and deployment commands.

See `../GuiaFirebaseDev.md` for seeding the 3 dev test users (one per role) against the real
project and checking role-based access end to end. `firebase.json`, `firestore.rules`,
`storage.rules` and `scripts/seed-dev-users.mjs` live in this folder.

Fill in `src/environments/environment.ts` with the Firebase config before running.
