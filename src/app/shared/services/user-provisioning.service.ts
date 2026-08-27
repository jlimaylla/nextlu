import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth as getSecondaryAuth,
  createUserWithEmailAndPassword,
  signOut as signOutSecondary,
} from 'firebase/auth';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';
import { UserRole } from '../../core/auth/models/auth-user.model';

export interface CreateUserInput {
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string | null;
  area?: string;
  position?: string;
  sede?: string;
}

/**
 * Crea cuentas de usuario (Authentication + doc de Firestore) desde la pantalla de
 * administración, sin backend propio ni Cloud Functions.
 *
 * El truco: `createUserWithEmailAndPassword` en la instancia PRINCIPAL de Auth firma
 * automáticamente como el usuario recién creado, lo que echaría al admin de su propia
 * sesión. Se crea una app de Firebase secundaria y desechable solo para el alta, y se
 * destruye apenas termina — la sesión del admin en la app principal nunca se toca.
 */
@Injectable({ providedIn: 'root' })
export class UserProvisioningService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly injector = inject(Injector);

  async createUser(input: CreateUserInput): Promise<string> {
    const uid = await this.createAuthAccount(input.email);

    await runInInjectionContext(this.injector, () =>
      setDoc(doc(this.firestore, 'users', uid), {
        uid,
        displayName: input.displayName,
        email: input.email,
        role: input.role,
        companyId: input.companyId,
        status: 'ACTIVE',
        area: input.area ?? '',
        position: input.position ?? '',
        sede: input.sede ?? '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // El usuario nunca ve ni comparte su password — configura la suya propia por correo.
    // Si el envío falla no se revierte el alta; el admin puede reenviarlo después.
    await runInInjectionContext(this.injector, () =>
      sendPasswordResetEmail(this.auth, input.email)
    ).catch(() => {});

    return uid;
  }

  private async createAuthAccount(email: string): Promise<string> {
    const tempPassword = crypto.randomUUID();
    const secondaryApp = initializeApp(environment.firebase, `provisioning-${Date.now()}`);
    const secondaryAuth = getSecondaryAuth(secondaryApp);
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);
      return credential.user.uid;
    } finally {
      await signOutSecondary(secondaryAuth).catch(() => {});
      await deleteApp(secondaryApp).catch(() => {});
    }
  }
}
