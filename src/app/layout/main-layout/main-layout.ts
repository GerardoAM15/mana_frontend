import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CajaEstadoService } from '../../core/services/caja-estado.service';
import { CatalogoService } from '../../core/services/catalogo-service';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly catalogos = inject(CatalogoService);
  private readonly cajaEstado = inject(CajaEstadoService);

  protected readonly menuColapsado = signal(false);

  // El layout solo se muestra con sesión: aquí se cargan los catálogos y el estado de la caja.
  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    if (this.auth.tienePermiso('CAJA_OPERAR')) {
      this.cajaEstado.refrescar().subscribe({ error: () => undefined });
    }
  }

  alternarMenu(): void {
    this.menuColapsado.update(valor => !valor);
  }
}
