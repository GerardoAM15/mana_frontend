import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { hoy } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarAnulacion } from '../../../../shared/components/confirmar-anulacion/confirmar-anulacion';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Consumo } from '../../../contratos/models/consumo.model';
import { ContratoService } from '../../../contratos/services/contrato-service';
import { ConsumoService } from '../../services/consumo-service';

const TAMANIO = 10;

// Consumos registrados hoy en el local, con anulación (CONSUMO_ANULAR).
@Component({
  selector: 'app-consumos-hoy',
  imports: [CurrencyPipe, DatePipe, Paginador, ConfirmarAnulacion, SiPermiso],
  templateUrl: './consumos-hoy.html',
  styleUrl: './consumos-hoy.css',
})
export class ConsumosHoy implements OnInit {
  private readonly consumoService = inject(ConsumoService);
  private readonly contratoService = inject(ContratoService);
  protected readonly catalogos = inject(CatalogoService);

  // contratoId -> nombre conocido por el mostrador; los que falten se consultan una vez.
  readonly nombres = input<Record<number, string>>({});
  readonly anulado = output<number>();

  protected readonly resultado = signal<PaginaResponse<Consumo> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly porAnular = signal<Consumo | null>(null);
  protected readonly anulando = signal(false);
  protected readonly errorAnulacion = signal<string | null>(null);
  private readonly consultados = signal<Record<number, string>>({});

  ngOnInit(): void {
    this.cargar(0);
  }

  cargar(pagina = this.resultado()?.pagina ?? 0): void {
    const fecha = hoy();
    this.cargando.set(true);
    this.consumoService
      .buscar({ contratoId: null, servicio: null, desde: fecha, hasta: fecha, localId: null }, pagina, TAMANIO)
      .subscribe({
        next: resultado => {
          this.resultado.set(resultado);
          this.cargando.set(false);
          this.error.set(null);
          this.completarNombres(resultado.contenido);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  protected cliente(contratoId: number): string {
    return this.nombres()[contratoId] ?? this.consultados()[contratoId] ?? `Contrato #${contratoId}`;
  }

  anular(motivo: string): void {
    const consumo = this.porAnular();
    if (!consumo) return;

    this.anulando.set(true);
    this.errorAnulacion.set(null);
    this.consumoService.anular(consumo.id, { motivo }).subscribe({
      next: () => {
        this.anulando.set(false);
        this.porAnular.set(null);
        this.anulado.emit(consumo.contratoId);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.anulando.set(false);
        this.errorAnulacion.set(mensajeError(err));
      },
    });
  }

  cerrarAnulacion(): void {
    this.porAnular.set(null);
    this.errorAnulacion.set(null);
  }

  private completarNombres(consumos: Consumo[]): void {
    const faltan = [...new Set(consumos.map(c => c.contratoId))].filter(
      id => !this.nombres()[id] && !this.consultados()[id],
    );
    faltan.forEach(id =>
      this.contratoService.obtener(id).subscribe({
        next: contrato => this.consultados.update(n => ({ ...n, [id]: contrato.clienteNombre })),
        error: () => undefined,
      }),
    );
  }
}
