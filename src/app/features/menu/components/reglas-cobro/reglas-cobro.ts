import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { ReglaCobro } from '../../models/regla-cobro.model';
import { ReglaCobroService } from '../../services/regla-cobro-service';

// Menús públicos (reglas de cobro): precio del combo, recargo para llevar y composición.
@Component({
  selector: 'app-reglas-cobro',
  imports: [RouterLink, CurrencyPipe, ConfirmarDialogo, SiPermiso],
  templateUrl: './reglas-cobro.html',
  styleUrl: './reglas-cobro.css',
})
export class ReglasCobro implements OnInit {
  private readonly reglaService = inject(ReglaCobroService);
  protected readonly catalogos = inject(CatalogoService);

  protected readonly reglas = signal<ReglaCobro[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly porEliminar = signal<ReglaCobro | null>(null);
  protected readonly eliminando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.reglaService.listar().subscribe({
      next: reglas => {
        this.reglas.set(reglas.sort((a, b) => a.servicio.localeCompare(b.servicio)));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  confirmarEliminar(): void {
    const regla = this.porEliminar();
    if (!regla || this.eliminando()) return;

    this.eliminando.set(true);
    this.reglaService.eliminar(regla.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.porEliminar.set(null);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.eliminando.set(false);
        this.porEliminar.set(null);
      },
    });
  }
}
