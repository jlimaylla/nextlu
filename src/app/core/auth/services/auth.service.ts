import {
  Injectable,
  inject,
  signal,
  computed,
  DestroyRef,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AuthUser } from '../models/auth-user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  readonly currentUser = signal<AuthUser | null>(null);
  readonly isLoading = signal(true);
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    const unsubscribe = onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Si login() ya cargó el perfil de este mismo uid, no lo releamos de Firestore.
        if (this.currentUser()?.uid !== firebaseUser.uid) {
          this.currentUser.set(await this.loadProfile(firebaseUser));
        }
      } else {
        this.currentUser.set(null);
      }
      this.isLoading.set(false);
    });

    // Firebase onAuthStateChanged devuelve una función para cancelar el listener.
    // DestroyRef la llama automáticamente cuando el servicio es destruido.
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  async login(email: string, password: string): Promise<void> {
    // login()/logout()/sendPasswordReset() los dispara un (click) del template — eso
    // tampoco es contexto de inyección, así que cada llamada a la API de Firebase se
    // envuelve en runInInjectionContext (mismo motivo que en loadProfile()).
    const credential = await runInInjectionContext(this.injector, () =>
      signInWithEmailAndPassword(this.auth, email, password)
    );
    // No basta esperar el sign-in: authGuard revisa currentUser, y ese lo llena
    // onAuthStateChanged de forma asíncrona (incluye un getDoc a Firestore). Si
    // navegamos antes de que resuelva, el guard todavía ve sesión no autenticada
    // y rebota a /auth/login — de ahí el "hay que darle 2 veces click". Por eso
    // cargamos el perfil acá mismo antes de navegar.
    this.currentUser.set(await this.loadProfile(credential.user));
    await this.router.navigate(['/dashboard']);
  }

  async logout(): Promise<void> {
    await runInInjectionContext(this.injector, () => signOut(this.auth));
    await this.router.navigate(['/auth/login']);
  }

  async sendPasswordReset(email: string): Promise<void> {
    await runInInjectionContext(this.injector, () =>
      sendPasswordResetEmail(this.auth, email)
    );
  }

  private async loadProfile(user: User): Promise<AuthUser> {
    // onAuthStateChanged dispara este callback de forma asíncrona, fuera del contexto
    // de inyección del constructor. runInInjectionContext se lo restituye a getDoc()
    // para que AngularFire pueda enganchar NgZone correctamente (evita el warning de
    // "Calling Firebase APIs outside of an Injection context").
    const snap = await runInInjectionContext(this.injector, () =>
      getDoc(doc(this.firestore, 'users', user.uid))
    );
    const data = snap.data();
    // Firestore guarda el estado como `status: 'ACTIVE' | 'BLOCKED'` (ver AppUser en
    // shared/models/user.model.ts) — es la única fuente de verdad, no hay campo `isActive`.
    return {
      uid: user.uid,
      email: user.email!,
      displayName: data?.['displayName'] ?? user.displayName ?? '',
      role: data?.['role'] ?? 'PARTICIPANT',
      companyId: data?.['companyId'] ?? null,
      isActive: (data?.['status'] ?? 'ACTIVE') !== 'BLOCKED',
    };
  }
}
