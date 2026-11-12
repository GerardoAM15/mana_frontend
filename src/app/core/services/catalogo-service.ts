import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogoItem, Catalogos } from '../models/catalogo.model';

// GET /catalogos se pide una sola vez por sesión y se reutiliza en toda la app.
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/catalogos`;

  private readonly datos = signal<Catalogos | null>(null);
  private peticion$?: Observable<Catalogos>;

  readonly catalogos = this.datos.asReadonly();
  readonly servicios = computed(() => this.datos()?.servicios.filter(s => s.activo) ?? []);
  readonly metodosPago = computed(() => this.datos()?.metodosPago.filter(m => m.activo) ?? []);
  readonly categorias = computed(() => this.datos()?.categorias.filter(c => c.activo) ?? []);
  readonly roles = computed(() => this.datos()?.roles.filter(r => r.activo) ?? []);
  readonly diasAtencion = computed(() => this.datos()?.diasAtencion ?? []);

  cargar(): Observable<Catalogos> {
    const actuales = this.datos();
    if (actuales) return of(actuales);

    this.peticion$ ??= this.http.get<Catalogos>(this.url).pipe(
      tap({
        next: datos => this.datos.set(datos),
        error: () => (this.peticion$ = undefined),
      }),
      shareReplay(1),
    );
    return this.peticion$;
  }

  // Al cerrar sesión se descarta la caché.
  limpiar(): void {
    this.datos.set(null);
    this.peticion$ = undefined;
  }

  nombreServicio(codigo: string): string {
    return this.nombre(this.datos()?.servicios, codigo);
  }

  nombreMetodo(codigo: string): string {
    return this.nombre(this.datos()?.metodosPago, codigo);
  }

  nombreCategoria(codigo: string): string {
    return this.nombre(this.datos()?.categorias, codigo);
  }

  nombreRol(codigo: string): string {
    return this.nombre(this.datos()?.roles, codigo);
  }

  // diaSemana ISO (1 = lunes ... 7 = domingo).
  seAtiende(servicio: string, diaSemana: number): boolean {
    return this.diasAtencion().some(d => d.servicio === servicio && d.diaSemana === diaSemana);
  }

  private nombre(lista: CatalogoItem[] | undefined, codigo: string): string {
    return lista?.find(item => item.codigo === codigo)?.nombre ?? codigo;
  }
}
