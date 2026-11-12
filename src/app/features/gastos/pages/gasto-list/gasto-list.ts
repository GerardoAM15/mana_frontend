import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map, of } from 'rxjs';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { hoy, primerDiaMes } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { sumar } from '../../../../core/utils/numeros';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { FiltroGastos, Gasto } from '../../models/gasto.model';
import { GastoService } from '../../services/gasto-service';

const TAMANIO = 20;
// Límite de registros para calcular el total del periodo en una sola consulta.
const MAXIMO_TOTAL = 2000;

@Component({
  selector: 'app-gasto-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, Paginador, ConfirmarDialogo],
  templateUrl: './gasto-list.html',
  styleUrl: './gasto-list.css',
})
export class GastoList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly gastoService = inject(GastoService);

  protected readonly resultado = signal<PaginaResponse<Gasto> | null>(null);
  protected readonly totalPeriodo = signal<number | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly porDesactivar = signal<Gasto | null>(null);
  protected readonly desactivando = signal(false);
  protected readonly filtros = this.fb.group({ desde: [primerDiaMes(hoy())], hasta: [hoy()] });

  ngOnInit(): void {
    this.buscar(0);
  }

  buscar(pagina = 0): void {
    const filtro = this.filtro();
    this.cargando.set(true);
    this.error.set(null);
    this.gastoService.buscar(filtro, pagina, TAMANIO).subscribe({
      next: resultado => {
        this.resultado.set(resultado);
        this.cargando.set(false);
        if (pagina === 0) this.calcularTotal(filtro, resultado);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  confirmarDesactivar(): void {
    const gasto = this.porDesactivar();
    if (!gasto || this.desactivando()) return;

    this.desactivando.set(true);
    this.gastoService.eliminar(gasto.id).subscribe({
      next: () => {
        this.desactivando.set(false);
        this.porDesactivar.set(null);
        this.buscar(0);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.desactivando.set(false);
        this.porDesactivar.set(null);
      },
    });
  }

  private filtro(): FiltroGastos {
    const v = this.filtros.getRawValue();
    return { desde: v.desde || null, hasta: v.hasta || null, localId: null };
  }

  // Suma los gastos activos de todo el rango, no solo los de la página.
  private calcularTotal(filtro: FiltroGastos, primera: PaginaResponse<Gasto>): void {
    const sumaActivos = (gastos: Gasto[]) => sumar(gastos.filter(g => g.activo).map(g => g.monto));
    const todos$ = primera.ultima
      ? of(primera.contenido)
      : this.gastoService.buscar(filtro, 0, Math.min(primera.totalElementos, MAXIMO_TOTAL)).pipe(map(p => p.contenido));
    this.totalPeriodo.set(null);
    todos$.pipe(map(sumaActivos)).subscribe({
      next: total => this.totalPeriodo.set(total),
      error: () => this.totalPeriodo.set(null),
    });
  }
}
