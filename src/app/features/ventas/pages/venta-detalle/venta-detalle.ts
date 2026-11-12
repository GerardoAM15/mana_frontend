import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { CajaEstadoService } from '../../../../core/services/caja-estado.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { EstadoPagos } from '../../../../core/utils/pagos';
import { AvisoCaja } from '../../../../shared/components/aviso-caja/aviso-caja';
import { ConfirmarAnulacion } from '../../../../shared/components/confirmar-anulacion/confirmar-anulacion';
import { SelectorPagos } from '../../../../shared/components/selector-pagos/selector-pagos';
import { DatosComprobante } from '../../../comprobantes/components/datos-comprobante/datos-comprobante';
import { TarjetaComprobante } from '../../../comprobantes/components/tarjeta-comprobante/tarjeta-comprobante';
import { Comprobante } from '../../../comprobantes/models/comprobante.model';
import { EstadoComprobanteSolicitud } from '../../../comprobantes/utils/comprobante';
import { TicketVenta } from '../../components/ticket-venta/ticket-venta';
import { Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

@Component({
  selector: 'app-venta-detalle',
  imports: [RouterLink, CurrencyPipe, TicketVenta, SelectorPagos, ConfirmarAnulacion, AvisoCaja, DatosComprobante, TarjetaComprobante],
  templateUrl: './venta-detalle.html',
  styleUrl: './venta-detalle.css',
})
export class VentaDetalle implements OnInit {
  private readonly ventaService = inject(VentaService);
  private readonly auth = inject(AuthService);
  protected readonly cajaEstado = inject(CajaEstadoService);
  protected readonly catalogos = inject(CatalogoService);

  readonly id = input.required<string>();
  protected readonly venta = signal<Venta | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly pagos = signal<EstadoPagos | null>(null);
  protected readonly cobrando = signal(false);
  protected readonly errorCobro = signal<string | null>(null);
  protected readonly anulando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly errorAnulacion = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  // Comprobante electrónico: lo que se pide al cobrar y el vigente de la venta.
  protected readonly solicitudComprobante = signal<EstadoComprobanteSolicitud | null>(null);
  protected readonly comprobante = signal<Comprobante | null>(null);
  protected readonly versionComprobante = signal(0);

  protected readonly pendiente = computed(() => this.venta()?.estado === 'PENDIENTE');
  protected readonly puedeAnular = computed(
    () => !!this.venta() && this.venta()!.estado !== 'ANULADA' && this.auth.tienePermiso('VENTA_ANULAR'),
  );

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.ventaService.obtener(Number(this.id())).subscribe({
      next: venta => this.venta.set(venta),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  // POST /ventas/{id}/pagos: solo PENDIENTE y mientras su caja siga abierta.
  cobrar(): void {
    const venta = this.venta();
    const pagos = this.pagos();
    const comprobante = this.solicitudComprobante();
    if (!venta || !pagos?.valido || comprobante?.valido === false) return;

    this.cobrando.set(true);
    this.errorCobro.set(null);
    this.ventaService
      .cobrar(venta.id, { pagos: pagos.pagos, ...(comprobante?.solicitud ? { comprobante: comprobante.solicitud } : {}) })
      .subscribe({
      next: cobrada => {
        this.venta.set(cobrada);
        this.cobrando.set(false);
        // El comprobante se envía a SUNAT después del cobro: un PENDIENTE no es un error de la venta.
        this.mensaje.set(
          `Venta ${cobrada.numero} cobrada.` +
            (comprobante?.solicitud ? ' El comprobante se enviará a SUNAT en unos minutos.' : ''),
        );
        this.versionComprobante.update(v => v + 1);
      },
      error: (err: HttpErrorResponse) => {
        this.cobrando.set(false);
        this.errorCobro.set(mensajeError(err));
      },
    });
  }

  anular(motivo: string): void {
    const venta = this.venta();
    if (!venta) return;

    this.procesando.set(true);
    this.errorAnulacion.set(null);
    this.ventaService.anular(venta.id, { motivo }).subscribe({
      next: anulada => {
        this.venta.set(anulada);
        this.procesando.set(false);
        this.anulando.set(false);
        this.mensaje.set(`Venta ${anulada.numero} anulada.`);
        // El backend anula el comprobante (y emite nota de crédito si estaba aceptado).
        this.versionComprobante.update(v => v + 1);
      },
      error: (err: HttpErrorResponse) => {
        this.procesando.set(false);
        this.errorAnulacion.set(mensajeError(err));
      },
    });
  }

  cerrarAnulacion(): void {
    this.anulando.set(false);
    this.errorAnulacion.set(null);
  }

  imprimir(): void {
    window.print();
  }
}
