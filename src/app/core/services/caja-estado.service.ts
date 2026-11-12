import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Caja } from '../../features/caja/models/caja.model';

// Caja abierta del usuario (GET /cajas/actual). Un 404 significa que no tiene caja abierta.
// Se carga al entrar al layout y se refresca al abrir o cerrar caja.
@Injectable({ providedIn: 'root' })
export class CajaEstadoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/cajas/actual`;

  private readonly actual = signal<Caja | null>(null);
  private readonly consultada = signal(false);

  readonly caja = this.actual.asReadonly();
  readonly abierta = computed(() => this.actual() !== null);
  // false mientras no se sabe si hay caja: evita mostrar "Abra su caja" antes de tiempo.
  readonly cargada = this.consultada.asReadonly();

  refrescar(): Observable<Caja | null> {
    return this.http.get<Caja>(this.url).pipe(
      catchError((err: HttpErrorResponse) => (err.status === 404 ? of(null) : throwError(() => err))),
      tap(caja => this.establecer(caja)),
    );
  }

  establecer(caja: Caja | null): void {
    this.actual.set(caja);
    this.consultada.set(true);
  }

  limpiar(): void {
    this.actual.set(null);
    this.consultada.set(false);
  }
}
