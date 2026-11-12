import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { GRUPO_POR_DEFECTO, grupoDeRuta, gruposVisibles, MENU_INICIO } from '../../core/config/menu';
import { Icono } from '../../shared/components/icono/icono';

// Grupos que el usuario dejó abiertos (preferencia de este navegador).
const CLAVE_ABIERTOS = 'mana.menu.abiertos';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icono],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly inicio = MENU_INICIO;
  // computed sobre el signal de la sesión: al cambiar de usuario el menú se recalcula sin recargar.
  protected readonly grupos = computed(() => gruposVisibles(permiso => this.auth.tienePermiso(permiso)));
  protected readonly abiertos = signal<Set<string>>(leerAbiertos());

  constructor() {
    this.abrirGrupoDe(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(e => this.abrirGrupoDe((e as NavigationEnd).urlAfterRedirects));
  }

  protected abierto(id: string): boolean {
    return this.abiertos().has(id);
  }

  alternar(id: string): void {
    this.abiertos.update(actual => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
    guardarAbiertos(this.abiertos());
  }

  // El grupo que contiene la ruta actual siempre queda abierto.
  private abrirGrupoDe(url: string): void {
    const id = grupoDeRuta(url);
    if (id && !this.abiertos().has(id)) this.abiertos.update(actual => new Set(actual).add(id));
  }
}

function leerAbiertos(): Set<string> {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_ABIERTOS) ?? 'null') as unknown;
    if (Array.isArray(guardado)) return new Set(guardado.filter((id): id is string => typeof id === 'string'));
  } catch {
    // Sin acceso a localStorage o valor dañado: se usan los grupos por defecto.
  }
  return new Set([GRUPO_POR_DEFECTO]);
}

function guardarAbiertos(abiertos: Set<string>): void {
  try {
    localStorage.setItem(CLAVE_ABIERTOS, JSON.stringify([...abiertos]));
  } catch {
    // Si no se puede guardar, el menú funciona igual en esta sesión.
  }
}
