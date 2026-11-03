import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CajaEstadoService } from '../../core/services/caja-estado.service';
import { CatalogoService } from '../../core/services/catalogo-service';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

// Debajo de 1024 px el menú lateral se oculta y se abre como panel con el botón ☰.
const PANTALLA_CHICA = '(max-width: 1023.98px)';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  host: { '(document:keydown.escape)': 'cerrarPanel()' },
})
export class MainLayout implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly catalogos = inject(CatalogoService);
  private readonly cajaEstado = inject(CajaEstadoService);

  // Pantalla grande: el ☰ pliega la columna. Pantalla chica: abre o cierra el panel.
  protected readonly pantallaChica = signal(false);
  protected readonly menuColapsado = signal(false);
  protected readonly panelAbierto = signal(false);

  constructor() {
    const consulta = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(PANTALLA_CHICA) : null;
    if (consulta) {
      this.pantallaChica.set(consulta.matches);
      const alCambiar = (e: MediaQueryListEvent) => {
        this.pantallaChica.set(e.matches);
        this.panelAbierto.set(false);
      };
      consulta.addEventListener('change', alCambiar);
      inject(DestroyRef).onDestroy(() => consulta.removeEventListener('change', alCambiar));
    }

    // En pantalla chica, elegir una opción cierra el panel.
    inject(Router).events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.panelAbierto.set(false));
  }

  // El layout solo se muestra con sesión: aquí se cargan los catálogos y el estado de la caja.
  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    if (this.auth.tienePermiso('CAJA_OPERAR')) {
      this.cajaEstado.refrescar().subscribe({ error: () => undefined });
    }
  }

  protected menuVisible(): boolean {
    return this.pantallaChica() ? this.panelAbierto() : !this.menuColapsado();
  }

  alternarMenu(): void {
    if (this.pantallaChica()) this.panelAbierto.update(valor => !valor);
    else this.menuColapsado.update(valor => !valor);
  }

  cerrarPanel(): void {
    if (this.pantallaChica()) this.panelAbierto.set(false);
  }
}
