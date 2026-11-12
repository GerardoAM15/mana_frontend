import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CajaEstadoService } from '../services/caja-estado.service';
import { CatalogoService } from '../services/catalogo-service';
import {
  LoginRequest,
  LoginResponse,
  MensajeResponse,
  RecuperarClaveRequest,
  RestablecerClaveRequest,
  Sesion,
} from './auth.models';

const CLAVE = 'mana.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly catalogos = inject(CatalogoService);
  private readonly cajaEstado = inject(CajaEstadoService);
  private readonly url = `${environment.apiUrl}/auth`;

  // Estado de la sesión como signal: el menú, el header y los botones se recalculan solos al cambiar.
  private readonly sesion = signal<Sesion | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;

  readonly usuario = computed(() => this.sesion());
  readonly autenticado = computed(() => this.sesion() !== null);
  readonly permisos = computed(() => new Set(this.sesion()?.permisos ?? []));

  constructor() {
    this.restaurar();
  }

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/login`, datos).pipe(
      tap(r => this.iniciar({
        token: r.token,
        usuarioId: r.usuarioId,
        nombreCompleto: r.nombreCompleto,
        rol: r.rol,
        localId: r.localId,
        localNombre: r.localNombre,
        permisos: r.permisos,
        expiraEn: Date.now() + r.expiraEnSegundos * 1000,
      })),
    );
  }

  recuperar(datos: RecuperarClaveRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/recuperar`, datos);
  }

  restablecer(datos: RestablecerClaveRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/restablecer`, datos);
  }

  cerrarSesion(returnUrl?: string): void {
    clearTimeout(this.temporizador);
    sessionStorage.removeItem(CLAVE);
    this.sesion.set(null);
    this.catalogos.limpiar();
    this.cajaEstado.limpiar();
    this.router.navigate(['/login'], { queryParams: returnUrl ? { returnUrl } : {} });
  }

  // Se lee de sessionStorage en cada petición: si alguien altera el token, el backend responde 401.
  token(): string | null {
    const guardada = this.leer();
    return guardada && guardada.expiraEn > Date.now() ? guardada.token : null;
  }

  tienePermiso(permiso?: string): boolean {
    return !permiso || this.permisos().has(permiso);
  }

  private iniciar(sesion: Sesion): void {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    this.sesion.set(sesion);
    this.programarCierre(sesion.expiraEn);
  }

  private restaurar(): void {
    const guardada = this.leer();
    if (!guardada || guardada.expiraEn <= Date.now()) {
      sessionStorage.removeItem(CLAVE);
      return;
    }
    this.sesion.set(guardada);
    this.programarCierre(guardada.expiraEn);
  }

  // Cierre automático cuando vence el token (expiraEnSegundos).
  private programarCierre(expiraEn: number): void {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.cerrarSesion(this.router.url), expiraEn - Date.now());
  }

  private leer(): Sesion | null {
    try {
      return JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null') as Sesion | null;
    } catch {
      return null;
    }
  }
}
