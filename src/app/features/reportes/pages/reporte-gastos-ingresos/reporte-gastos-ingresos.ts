import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../../core/utils/http-error';
import { sumar } from '../../../../core/utils/numeros';
import { Barras, FilaBarras, Serie } from '../../components/barras/barras';
import { FiltrosReporte, ValoresFiltro } from '../../components/filtros-reporte/filtros-reporte';
import { GastoIngreso } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte-service';
import { etiquetaPeriodo } from '../../utils/periodos';

// Ingresos (pensiones + ventas) frente a gastos diarios activos, por día o por mes.
@Component({
  selector: 'app-reporte-gastos-ingresos',
  imports: [RouterLink, CurrencyPipe, Barras, FiltrosReporte],
  templateUrl: './reporte-gastos-ingresos.html',
  styleUrl: './reporte-gastos-ingresos.css',
})
export class ReporteGastosIngresos {
  private readonly reporteService = inject(ReporteService);

  protected readonly datos = signal<GastoIngreso[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly rango = signal<ValoresFiltro | null>(null);
  protected readonly etiqueta = etiquetaPeriodo;

  protected readonly series: Serie[] = [
    { nombre: 'Ingresos', tono: 'exito' },
    { nombre: 'Gastos', tono: 'peligro' },
  ];
  protected readonly filas = computed<FilaBarras[]>(() =>
    this.datos().map(d => ({ etiqueta: etiquetaPeriodo(d.periodo), valores: [d.ingresos, d.gastos] })),
  );
  protected readonly totales = computed(() => ({
    ingresos: sumar(this.datos().map(d => d.ingresos)),
    gastos: sumar(this.datos().map(d => d.gastos)),
    diferencia: sumar(this.datos().map(d => d.diferencia)),
  }));

  buscar(filtro: ValoresFiltro): void {
    this.rango.set(filtro);
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.gastosVsIngresos({ desde: filtro.desde, hasta: filtro.hasta, localId: null }, filtro.agrupacion).subscribe({
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
