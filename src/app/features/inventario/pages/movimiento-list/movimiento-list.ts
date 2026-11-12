import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { InventarioTabs } from '../../components/inventario-tabs/inventario-tabs';
import { Bebida } from '../../models/bebida.model';
import { MovimientoStock, TipoMovimientoStock } from '../../models/stock.model';
import { BebidaService } from '../../services/bebida-service';
import { StockService } from '../../services/stock-service';

const TAMANIO = 20;

const ETIQUETAS: Record<TipoMovimientoStock, string> = { COMPRA: 'Compra', VENTA: 'Venta', DEVOLUCION: 'Devolución' };

// Kardex: movimientos de stock por bebida y fecha.
@Component({
  selector: 'app-movimiento-list',
  imports: [ReactiveFormsModule, DatePipe, Paginador, InventarioTabs],
  templateUrl: './movimiento-list.html',
  styleUrl: './movimiento-list.css',
})
export class MovimientoList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly stockService = inject(StockService);
  private readonly bebidaService = inject(BebidaService);

  // ?bebidaId= desde la pantalla de stock.
  readonly bebidaId = input<string>();

  protected readonly etiquetas = ETIQUETAS;
  protected readonly bebidas = signal<Bebida[]>([]);
  protected readonly resultado = signal<PaginaResponse<MovimientoStock> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtros = this.fb.group({
    bebidaId: this.fb.control<number | null>(null),
    desde: [''],
    hasta: [''],
  });

  ngOnInit(): void {
    this.bebidaService.listar().subscribe({
      next: bebidas => this.bebidas.set(bebidas.sort((a, b) => a.nombre.localeCompare(b.nombre))),
      error: () => undefined,
    });
    const bebidaId = this.bebidaId();
    if (bebidaId) this.filtros.patchValue({ bebidaId: Number(bebidaId) });
    this.buscar(0);
  }

  buscar(pagina = 0): void {
    const v = this.filtros.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.stockService
      .movimientos({ bebidaId: v.bebidaId, desde: v.desde || null, hasta: v.hasta || null, localId: null }, pagina, TAMANIO)
      .subscribe({
        next: resultado => {
          this.resultado.set(resultado);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  limpiar(): void {
    this.filtros.reset({ bebidaId: null, desde: '', hasta: '' });
    this.buscar(0);
  }

  // Las salidas (ventas) restan; compras y devoluciones suman.
  protected signo(m: MovimientoStock): string {
    return m.tipo === 'VENTA' ? '−' : '+';
  }
}
