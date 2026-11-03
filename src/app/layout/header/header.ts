import { Component, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CajaEstadoService } from '../../core/services/caja-estado.service';
import { CatalogoService } from '../../core/services/catalogo-service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly cajaEstado = inject(CajaEstadoService);
  protected readonly catalogos = inject(CatalogoService);

  readonly toggleMenu = output<void>();
}
