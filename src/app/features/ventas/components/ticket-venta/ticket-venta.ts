import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toDataURL } from 'qrcode';
import { AuthService } from '../../../../core/auth/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { redondear } from '../../../../core/utils/numeros';
import { EstadoBadge } from '../../../../shared/components/estado-badge/estado-badge';
import { Comprobante } from '../../../comprobantes/models/comprobante.model';
import { textoQr } from '../../../comprobantes/utils/comprobante';
import { LineaVenta, Venta } from '../../models/venta.model';

// Ticket imprimible de una venta (número V-000123, líneas, total, pagos y devoluciones).
// Con comprobante electrónico vigente muestra BOLETA/FACTURA ELECTRÓNICA, receptor, IGV y el QR de SUNAT.
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
  readonly comprobante = input<Comprobante | null>(null);

  // Solo boleta o factura vigente; una nota de crédito o un anulado no se imprime como comprobante.
  protected readonly electronico = computed(() => {
    const c = this.comprobante();
    return c && c.tipo !== 'NOTA_CREDITO' && c.estado !== 'ANULADO' && c.estado !== 'RECHAZADO' ? c : null;
  });
  protected readonly qr = signal<string | null>(null);

  constructor() {
    effect(onCleanup => {
      const c = this.electronico();
      const texto = c ? textoQr(c) : null;
      let vigente = true;
      onCleanup(() => (vigente = false));
      if (!texto) {
        this.qr.set(null);
        return;
      }
      toDataURL(texto, { margin: 1, width: 140, errorCorrectionLevel: 'M' })
        .then(url => vigente && this.qr.set(url))
        .catch(() => vigente && this.qr.set(null));
    });
  }

  // El recargo de la línea solo cuenta si la venta es para llevar.
  protected recargo(linea: LineaVenta): number {
    return this.venta().paraLlevar ? linea.recargoUnitario : 0;
  }

  protected importe(linea: LineaVenta): number {
    return redondear(linea.cantidad * (linea.precioUnitario + this.recargo(linea)));
  }
}
