import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { CajaEstadoService } from '../../../../core/services/caja-estado.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { hoy } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { sumar } from '../../../../core/utils/numeros';
import { AvisoCaja } from '../../../../shared/components/aviso-caja/aviso-caja';
import { ConfirmarAnulacion } from '../../../../shared/components/confirmar-anulacion/confirmar-anulacion';
import { EstadoBadge } from '../../../../shared/components/estado-badge/estado-badge';
import { Contrato } from '../../models/contrato.model';
import { ContratoService } from '../../services/contrato-service';
import { esRenovable } from '../../utils/renovacion';

@Component({
  selector: 'app-contrato-detalle',
  imports: [RouterLink, CurrencyPipe, DatePipe, EstadoBadge, ConfirmarAnulacion, AvisoCaja],
  templateUrl: './contrato-detalle.html',
  styleUrl: './contrato-detalle.css',
})
export class ContratoDetalle implements OnInit {
  private readonly contratoService = inject(ContratoService);
  private readonly auth = inject(AuthService);
  protected readonly cajaEstado = inject(CajaEstadoService);
  protected readonly catalogos = inject(CatalogoService);

  readonly id = input.required<string>();
  protected readonly hoy = hoy();
  protected readonly contrato = signal<Contrato | null>(null);
  // Renovación de este contrato (el que tiene anteriorId = este id).
  protected readonly siguiente = signal<Contrato | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly anulando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly errorAnulacion = signal<string | null>(null);

  protected readonly puedeRenovar = computed(() => {
    const c = this.contrato();
    return !!c && this.auth.tienePermiso('CONTRATO_REGISTRAR') && esRenovable(c, this.hoy) && !this.siguiente();
  });
  // Solo sin consumos (ni siquiera anulados) y en estado PROGRAMADO o ACTIVO.
  protected readonly puedeAnular = computed(() => {
    const c = this.contrato();
    return !!c && this.auth.tienePermiso('CONTRATO_ANULAR') &&
      (c.estado === 'PROGRAMADO' || c.estado === 'ACTIVO') && c.consumos.length === 0;
  });
  protected readonly totalCobrado = computed(() =>
    sumar((this.contrato()?.pagos ?? []).filter(p => p.tipo === 'COBRO').map(p => p.monto)),
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.contratoService.obtener(Number(this.id())).subscribe({
      next: contrato => {
        this.contrato.set(contrato);
        this.buscarSiguiente(contrato);
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  anular(motivo: string): void {
    const contrato = this.contrato();
    if (!contrato) return;

    this.procesando.set(true);
    this.errorAnulacion.set(null);
    this.contratoService.anular(contrato.id, { motivo }).subscribe({
      next: anulado => {
        this.contrato.set(anulado);
        this.procesando.set(false);
        this.anulando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorAnulacion.set(mensajeError(err));
        this.procesando.set(false);
      },
    });
  }

  imprimir(): void {
    window.print();
  }

  private buscarSiguiente(contrato: Contrato): void {
    this.contratoService
      .buscar({ dni: contrato.dni, estado: null, desde: null, hasta: null, localId: null }, 0, 50)
      .subscribe({
        // Una renovación ANULADA no cuenta: el contrato se puede volver a renovar.
        next: pagina =>
          this.siguiente.set(pagina.contenido.find(c => c.anteriorId === contrato.id && c.estado !== 'ANULADO') ?? null),
        error: () => undefined,
      });
  }
}
