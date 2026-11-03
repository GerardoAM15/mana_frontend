import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { redondear } from '../../../../core/utils/numeros';
import { EstadoBadge } from '../../../../shared/components/estado-badge/estado-badge';
import { LineaVenta, Venta } from '../../models/venta.model';

// Ticket imprimible de una venta (número V-000123, líneas, total, pagos y devoluciones).
@Component({
  selector: 'app-ticket-venta',
  imports: [CurrencyPipe, DatePipe, EstadoBadge],
  templateUrl: './ticket-venta.html',
  styleUrl: './ticket-venta.css',
})
export class TicketVenta {
  protected readonly catalogos = inject(CatalogoService);
  protected readonly localNombre = inject(AuthService).usuario()?.localNombre ?? '';

  readonly venta = input.required<Venta>();

  // El recargo de la línea solo cuenta si la venta es para llevar.
  protected recargo(linea: LineaVenta): number {
    return this.venta().paraLlevar ? linea.recargoUnitario : 0;
  }

  protected importe(linea: LineaVenta): number {
    return redondear(linea.cantidad * (linea.precioUnitario + this.recargo(linea)));
  }
}
