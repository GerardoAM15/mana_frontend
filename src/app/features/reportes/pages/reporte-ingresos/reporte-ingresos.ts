import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../../core/utils/http-error';
import { sumar } from '../../../../core/utils/numeros';
import { Barras, FilaBarras, Serie } from '../../components/barras/barras';
import { FiltrosReporte, ValoresFiltro } from '../../components/filtros-reporte/filtros-reporte';
import { IngresoPeriodo } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte-service';
import { etiquetaPeriodo } from '../../utils/periodos';

// Cobros netos de contratos (cobros − devoluciones + recargos) y ventas pagadas netas, por mes.
@Component({
  selector: 'app-reporte-ingresos',
  imports: [RouterLink, CurrencyPipe, Barras, FiltrosReporte],
  templateUrl: './reporte-ingresos.html',
  styleUrl: './reporte-ingresos.css',
})
export class ReporteIngresos {
  private readonly reporteService = inject(ReporteService);

  protected readonly datos = signal<IngresoPeriodo[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly rango = signal<ValoresFiltro | null>(null);
  protected readonly etiqueta = etiquetaPeriodo;

  protected readonly series: Serie[] = [
    { nombre: 'Pensiones (contratos)', tono: 'primario' },
    { nombre: 'Ventas directas', tono: 'acento' },
  ];
  protected readonly filas = computed<FilaBarras[]>(() =>
    this.datos().map(d => ({ etiqueta: etiquetaPeriodo(d.periodo), valores: [d.contratos, d.ventas] })),
  );
  protected readonly totales = computed(() => ({
    contratos: sumar(this.datos().map(d => d.contratos)),
    ventas: sumar(this.datos().map(d => d.ventas)),
    total: sumar(this.datos().map(d => d.total)),
  }));

  buscar(filtro: ValoresFiltro): void {
    this.rango.set(filtro);
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.ingresosMensuales({ desde: filtro.desde, hasta: filtro.hasta, localId: null }).subscribe({
      next: datos => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }
}
