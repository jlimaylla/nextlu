import { inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  QueryConstraint,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Signal } from '@angular/core';
import { CompanyContextService } from '../../core/services/company-context.service';
import { BaseEntity } from '../models/base-entity.model';

/**
 * Clase base para repositorios Firestore.
 *
 * ## Patrones de consumo en componentes
 *
 * ### Opción A — Signal (RECOMENDADO)
 * Llamar `getAllSignal()` o `getByIdSignal()` en el inicializador de campo del componente.
 * Angular detecta el injection context del componente y limpia la suscripción
 * automáticamente cuando el componente es destruido.
 *
 * ```ts
 * readonly courses = inject(CourseRepository).getAllSignal();
 * readonly course  = inject(CourseRepository).getByIdSignal(this.courseId);
 * ```
 *
 * ### Opción B — Observable con takeUntilDestroyed (para lógica imperativa)
 * Útil cuando necesitas transformar el stream o actuar como efecto secundario.
 *
 * ```ts
 * private readonly destroyRef = inject(DestroyRef);
 *
 * ngOnInit(): void {
 *   this.repo.getAll()
 *     .pipe(takeUntilDestroyed(this.destroyRef))
 *     .subscribe(items => this.items.set(items));
 * }
 * ```
 *
 * NUNCA hagas `.subscribe()` sin `takeUntilDestroyed` o `toSignal`.
 * Los observables de Firestore son infinitos; sin cleanup queda un listener activo
 * después de destruir el componente.
 */
export abstract class BaseFirestoreRepository<T extends BaseEntity> {
  protected readonly firestore = inject(Firestore);
  protected readonly companyContext = inject(CompanyContextService);
  // create/update/delete normalmente se llaman desde un (click) de formulario, fuera del
  // contexto de inyección — se captura acá para poder restituírselo a cada llamada (mismo
  // motivo que en AuthService, ver docs/AngularFire zones.md).
  private readonly injector = inject(Injector);

  protected abstract readonly collectionPath: string;

  protected get col() {
    return collection(this.firestore, this.collectionPath);
  }

  // ── Observables (capa de datos raw) ─────────────────────────────────────

  getAll(extra: QueryConstraint[] = []): Observable<T[]> {
    const companyId = this.companyContext.companyId();
    const constraints: QueryConstraint[] = companyId
      ? [where('companyId', '==', companyId), ...extra]
      : extra;
    return collectionData(query(this.col, ...constraints), { idField: 'id' }) as Observable<T[]>;
  }

  getById(id: string): Observable<T> {
    return docData(doc(this.firestore, this.collectionPath, id), {
      idField: 'id',
    }) as Observable<T>;
  }

  // ── Signals con auto-cleanup (llamar SOLO durante inicialización del componente) ──

  /**
   * Devuelve un Signal<T[]> vinculado al injection context del llamador.
   * La suscripción de Firestore se cancela cuando el componente es destruido.
   *
   * Debe llamarse en un inicializador de campo o en el constructor del componente.
   */
  getAllSignal(extra: QueryConstraint[] = []): Signal<T[]> {
    return toSignal(this.getAll(extra), { initialValue: [] as T[] });
  }

  /**
   * Devuelve un Signal<T | undefined> vinculado al injection context del llamador.
   * La suscripción de Firestore se cancela cuando el componente es destruido.
   */
  getByIdSignal(id: string): Signal<T | undefined> {
    return toSignal(this.getById(id));
  }

  // ── Escritura ────────────────────────────────────────────────────────────

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await runInInjectionContext(this.injector, () =>
      addDoc(this.col, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    return ref.id;
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    await runInInjectionContext(this.injector, () =>
      updateDoc(doc(this.firestore, this.collectionPath, id), {
        ...data,
        updatedAt: serverTimestamp(),
      })
    );
  }

  async delete(id: string): Promise<void> {
    await runInInjectionContext(this.injector, () =>
      deleteDoc(doc(this.firestore, this.collectionPath, id))
    );
  }
}
