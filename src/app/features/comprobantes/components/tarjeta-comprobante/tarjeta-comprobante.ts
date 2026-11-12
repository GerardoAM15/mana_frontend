import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/auth/auth.service';
import { mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { EstadoBadge } from '../../../../shared/components/estado-badge/estado-badge';
import { Comprobante } from '../../models/comprobante.model';
import { ComprobanteService } from '../../services/comprobante-service';
import { EMAIL, EstadoComprobanteSolicitud, guardarArchivo, mensajeErrorBlob, nombreTipo } from '../../utils/comprobante';
import { DatosComprobante } from '../datos-comprobante/datos-comprobante';

// Comprobante electrónico de una venta o un contrato: estado SUNAT, descargas, reenvío y emisión posterior.
// Uso: <app-tarjeta-comprobante [ventaId]="v.id" [total]="v.total" [puedeEmitir]="v.estado === 'PAGADA'" (cargado)="comprobante.set($event)" />
@Component({
  selector: 'app-tarjeta-comprobante',
  imports: [CurrencyPipe, DatePipe, EstadoBadge, ConfirmarDialogo, DatosComprobante],
  templateUrl: './tarjeta-comprobante.html',
  styleUrl: './tarjeta-comprobante.css',
})
export class TarjetaComprobante {
  private readonly service = inject(ComprobanteService);
  private readonly auth = inject(AuthService);

  readonly ventaId = input<number | null>(null);
  readonly contratoId = input<number | null>(null);
  readonly total = input(0);
  // false si la venta no está pagada o el contrato está anulado.
  readonly puedeEmitir = input(true);
  readonly documentoInicial = input('');
  readonly nombreInicial = input('');
  // Cambiarlo vuelve a consultar (p. ej. después de cobrar).
  readonly version = input(0);
  readonly cargado = output<Comprobante | null>();

  protected readonly configuracion = toSignal(this.service.configuracion(), { initialValue: null });
  protected readonly comprobante = signal<Comprobante | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly emitiendo = signal(false);
  protected readonly solicitud = signal<EstadoComprobanteSolicitud | null>(null);
  protected readonly errorEmision = signal<string | null>(null);
  protected readonly nombreTipo = nombreTipo;

  // Envío por correo (PDF + XML), solo de comprobantes aceptados por SUNAT.
  protected readonly enviandoCorreo = signal(false);
  protected readonly correoDestino = signal('');
  protected readonly errorCorreo = signal<string | null>(null);
  protected readonly avisoCorreo = signal<string | null>(null);
  protected readonly correoValido = computed(() => EMAIL.test(this.correoDestino().trim()));
  protected readonly puedeEnviarCorreo = computed(() => {
    const c = this.comprobante();
    return !!c && (c.estado === 'ACEPTADO' || c.estado === 'OBSERVADO') && this.auth.tienePermiso('COMPROBANTE_EMITIR');
  });

  protected readonly puedeGestionar = computed(() => this.auth.tienePermiso('COMPROBANTE_GESTIONAR'));
  // Sin comprobante, o con uno RECHAZADO (el backend lo anula y emite otro).
  protected readonly mostrarEmitir = computed(() => {
    const c = this.comprobante();
    return (
      !!this.configuracion()?.habilitada &&
      this.auth.tienePermiso('COMPROBANTE_EMITIR') &&
      this.puedeEmitir() &&
      (!c || c.estado === 'RECHAZADO')
    );
  });
  protected readonly visible = computed(() => !!this.comprobante() || this.mostrarEmitir() || !!this.error());

  constructor() {
    effect(() => {
      this.ventaId();
      this.contratoId();
      this.version();
      untracked(() => this.cargar());
    });
  }

  cargar(): void {
    const ventaId = this.ventaId();
    const contratoId = this.contratoId();
    if (!ventaId && !contratoId) return;
    if (!this.auth.tienePermiso('COMPROBANTE_VER')) {
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    (ventaId ? this.service.deVenta(ventaId) : this.service.deContrato(contratoId!)).subscribe({
      next: c => this.mostrar(c),
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(mensajeError(err));
      },
    });
  }

  reenviar(): void {
    const c = this.comprobante();
    if (!c) return;
    this.ocupado.set(true);
    this.error.set(null);
    this.service.reenviar(c.id).subscribe({
      next: actualizado => {
        this.ocupado.set(false);
        this.mostrar(actualizado);
      },
      error: (err: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.error.set(mensajeError(err));
      },
    });
  }

  descargar(formato: 'pdf' | 'xml'): void {
    const c = this.comprobante();
    if (!c) return;
    this.ocupado.set(true);
    this.error.set(null);
    (formato === 'pdf' ? this.service.pdf(c.id) : this.service.xml(c.id)).subscribe({
      next: blob => {
        this.ocupado.set(false);
        guardarArchivo(blob, `${c.serie}-${c.numero}.${formato}`);
      },
      error: async (err: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.error.set(await mensajeErrorBlob(err));
      },
    });
  }

  abrirCorreo(): void {
    this.correoDestino.set(this.comprobante()?.receptorEmail ?? '');
    this.errorCorreo.set(null);
    this.enviandoCorreo.set(true);
  }

  enviarCorreo(): void {
    const c = this.comprobante();
    const email = this.correoDestino().trim().toLowerCase();
    if (!c || !this.correoValido()) return;
    this.ocupado.set(true);
    this.errorCorreo.set(null);
    this.service.enviarCorreo(c.id, email).subscribe({
      next: actualizado => {
        this.ocupado.set(false);
        this.enviandoCorreo.set(false);
        this.avisoCorreo.set(`Comprobante enviado a ${email}.`);
        this.mostrar(actualizado);
      },
      error: (err: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.errorCorreo.set(mensajeError(err));
      },
    });
  }

  abrirEmision(): void {
    this.solicitud.set(null);
    this.errorEmision.set(null);
    this.emitiendo.set(true);
  }

  emitir(): void {
    const s = this.solicitud();
    if (!s?.valido || !s.solicitud) return;
    const ventaId = this.ventaId();
    const peticion = ventaId
      ? this.service.emitirVenta(ventaId, s.solicitud)
      : this.service.emitirContrato(this.contratoId()!, s.solicitud);
    this.ocupado.set(true);
    this.errorEmision.set(null);
    peticion.subscribe({
      next: c => {
        this.ocupado.set(false);
        this.emitiendo.set(false);
        this.mostrar(c);
      },
      error: (err: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.errorEmision.set(mensajeError(err));
      },
    });
  }

  private mostrar(c: Comprobante | null): void {
    this.cargando.set(false);
    this.comprobante.set(c);
    this.cargado.emit(c);
  }
}
