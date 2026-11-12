import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { EstadoBadge } from '../../../../shared/components/estado-badge/estado-badge';
import { ResumenCaja } from '../../models/caja.model';
import { CajaService } from '../../services/caja-service';

// Arqueo de una caja (GET /cajas/{id}/resumen), con opción de imprimir.
@Component({
  selector: 'app-caja-detalle',
  imports: [RouterLink, CurrencyPipe, DatePipe, EstadoBadge],
  templateUrl: './caja-detalle.html',
  styleUrl: './caja-detalle.css',
})
export class CajaDetalle implements OnInit {
  private readonly cajaService = inject(CajaService);
  protected readonly catalogos = inject(CatalogoService);
  protected readonly supervisa = inject(AuthService).tienePermiso('CAJA_SUPERVISAR');

  readonly id = input.required<string>();
  protected readonly resumen = signal<ResumenCaja | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.cajaService.resumen(Number(this.id())).subscribe({
      next: resumen => {
        this.resumen.set(resumen);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  imprimir(): void {
    window.print();
  }
}
