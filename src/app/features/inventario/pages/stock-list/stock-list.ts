import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { mensajeError } from '../../../../core/utils/http-error';
import { InventarioTabs } from '../../components/inventario-tabs/inventario-tabs';
import { StockBebida } from '../../models/stock.model';
import { StockService } from '../../services/stock-service';

// Stock de bebidas del local; se considera bajo con 5 unidades o menos.
const STOCK_BAJO = 5;

@Component({
  selector: 'app-stock-list',
  imports: [RouterLink, InventarioTabs],
  templateUrl: './stock-list.html',
  styleUrl: './stock-list.css',
})
export class StockList implements OnInit {
  private readonly stockService = inject(StockService);
  protected readonly localNombre = inject(AuthService).usuario()?.localNombre ?? '';

  protected readonly stock = signal<StockBebida[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly bajo = STOCK_BAJO;
  protected readonly totalUnidades = computed(() => this.stock().reduce((t, s) => t + s.stock, 0));

  ngOnInit(): void {
    this.cargando.set(true);
    this.stockService.listar().subscribe({
      next: stock => {
        this.stock.set(stock.sort((a, b) => a.bebidaNombre.localeCompare(b.bebidaNombre)));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }
}
