import { CurrencyPipe, PercentPipe } from '@angular/common';
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

// Comparativo de ingresos: venta directa frente a pensiones, con su participación.
@Component({
  selector: 'app-reporte-ventas-pensiones',
  imports: [RouterLink, CurrencyPipe, PercentPipe, Barras, FiltrosReporte],
  templateUrl: './reporte-ventas-pensiones.html',
  styleUrl: './reporte-ventas-pensiones.css',
})
export class ReporteVentasPensiones {
  private readonly reporteService = inject(ReporteService);

  protected readonly datos = signal<IngresoPeriodo[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly rango = signal<ValoresFiltro | null>(null);
  protected readonly etiqueta = etiquetaPeriodo;

  protected readonly series: Serie[] = [
    { nombre: 'Pensiones', tono: 'primario' },
    { nombre: 'Ventas directas', tono: 'acento' },
  ];
  protected readonly filas = computed<FilaBarras[]>(() =>
    this.datos().map(d => ({ etiqueta: etiquetaPeriodo(d.periodo), valores: [d.contratos, d.ventas] })),
  );
  protected readonly totales = computed(() => {
    const contratos = sumar(this.datos().map(d => d.contratos));
    const ventas = sumar(this.datos().map(d => d.ventas));
    const total = sumar(this.datos().map(d => d.total));
    return { contratos, ventas, total, partePensiones: total ? contratos / total : 0, parteVentas: total ? ventas / total : 0 };
  });

  protected parte(valor: number, total: number): number {
    return total ? valor / total : 0;
  }

  buscar(filtro: ValoresFiltro): void {
    this.rango.set(filtro);
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.ventasVsPensiones({ desde: filtro.desde, hasta: filtro.hasta, localId: null }).subscribe({
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
