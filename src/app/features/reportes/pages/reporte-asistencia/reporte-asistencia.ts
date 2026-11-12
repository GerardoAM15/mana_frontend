import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { Barras, FilaBarras, Serie } from '../../components/barras/barras';
import { FiltrosReporte, ValoresFiltro } from '../../components/filtros-reporte/filtros-reporte';
import { AsistenciaDiaria } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte-service';
import { etiquetaPeriodo } from '../../utils/periodos';

const SERVICIOS = ['D', 'A', 'C'];
const TONOS: Record<string, string> = { D: 'acento', A: 'primario', C: 'info' };

interface FilaDia {
  fecha: string;
  porServicio: Record<string, number>;
  total: number;
}

// Consumos de pensionistas (no anulados) por día y servicio.
@Component({
  selector: 'app-reporte-asistencia',
  imports: [RouterLink, Barras, FiltrosReporte],
  templateUrl: './reporte-asistencia.html',
  styleUrl: './reporte-asistencia.css',
})
export class ReporteAsistencia {
  private readonly reporteService = inject(ReporteService);
  protected readonly catalogos = inject(CatalogoService);

  protected readonly servicios = SERVICIOS;
  protected readonly datos = signal<AsistenciaDiaria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly rango = signal<ValoresFiltro | null>(null);
  protected readonly etiqueta = etiquetaPeriodo;

  // Tabla pivote: una fila por fecha, una columna por servicio.
  protected readonly dias = computed<FilaDia[]>(() => {
    const porFecha = new Map<string, FilaDia>();
    for (const d of this.datos()) {
      const fila = porFecha.get(d.fecha) ?? { fecha: d.fecha, porServicio: {}, total: 0 };
      fila.porServicio[d.servicio] = (fila.porServicio[d.servicio] ?? 0) + d.consumos;
      fila.total += d.consumos;
      porFecha.set(d.fecha, fila);
    }
    return [...porFecha.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
  });
  protected readonly totales = computed(() => {
    const porServicio: Record<string, number> = {};
    this.datos().forEach(d => (porServicio[d.servicio] = (porServicio[d.servicio] ?? 0) + d.consumos));
    const total = Object.values(porServicio).reduce((t, v) => t + v, 0);
    return { porServicio, total, promedio: this.dias().length ? total / this.dias().length : 0 };
  });
  protected readonly series = computed<Serie[]>(() =>
    SERVICIOS.map(s => ({ nombre: this.catalogos.nombreServicio(s), tono: TONOS[s] })),
  );
  protected readonly filas = computed<FilaBarras[]>(() =>
    this.dias().map(d => ({ etiqueta: etiquetaPeriodo(d.fecha), valores: SERVICIOS.map(s => d.porServicio[s] ?? 0) })),
  );

  buscar(filtro: ValoresFiltro): void {
    this.rango.set(filtro);
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.asistenciaDiaria({ desde: filtro.desde, hasta: filtro.hasta, localId: null }).subscribe({
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
