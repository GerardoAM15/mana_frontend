import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { Barras, FilaBarras, Serie } from '../../components/barras/barras';
import { FiltrosReporte, ValoresFiltro } from '../../components/filtros-reporte/filtros-reporte';
import { PlatoConsumido } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte-service';
import { etiquetaPeriodo } from '../../utils/periodos';

// Top de platos en consumos de pensionistas no anulados.
@Component({
  selector: 'app-reporte-platos',
  imports: [RouterLink, Barras, FiltrosReporte],
  templateUrl: './reporte-platos.html',
  styleUrl: './reporte-platos.css',
})
export class ReportePlatos {
  private readonly reporteService = inject(ReporteService);
  protected readonly catalogos = inject(CatalogoService);

  protected readonly datos = signal<PlatoConsumido[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly rango = signal<ValoresFiltro | null>(null);
  protected readonly etiqueta = etiquetaPeriodo;

  protected readonly ordenados = computed(() =>
    [...this.datos()].sort((a, b) => b.cantidad - a.cantidad || a.platoNombre.localeCompare(b.platoNombre)),
  );
  protected readonly series: Serie[] = [{ nombre: 'Veces servido', tono: 'primario' }];
  protected readonly filas = computed<FilaBarras[]>(() =>
    this.ordenados().slice(0, 15).map(p => ({
      etiqueta: `${p.platoNombre} (${this.catalogos.nombreServicio(p.servicio)})`,
      valores: [p.cantidad],
    })),
  );
  protected readonly total = computed(() => this.datos().reduce((t, p) => t + p.cantidad, 0));

  buscar(filtro: ValoresFiltro): void {
    this.rango.set(filtro);
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.platosMasConsumidos({ desde: filtro.desde, hasta: filtro.hasta, localId: null }, filtro.servicio).subscribe({
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
