import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { hoy, primerDiaMes } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { sumar } from '../../../../core/utils/numeros';
import { InventarioTabs } from '../../components/inventario-tabs/inventario-tabs';
import { CompraBebida } from '../../models/compra-bebida.model';
import { CompraBebidaService } from '../../services/compra-bebida-service';

@Component({
  selector: 'app-compra-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, InventarioTabs],
  templateUrl: './compra-list.html',
  styleUrl: './compra-list.css',
})
export class CompraList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly compraService = inject(CompraBebidaService);

  protected readonly compras = signal<CompraBebida[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly total = computed(() => sumar(this.compras().map(c => c.total)));
  protected readonly filtros = this.fb.group({ desde: [primerDiaMes(hoy())], hasta: [hoy()] });

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    const v = this.filtros.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.compraService.listar({ desde: v.desde || null, hasta: v.hasta || null, localId: null }).subscribe({
      next: compras => {
        this.compras.set(compras.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected unidades(compra: CompraBebida): number {
    return compra.detalles.reduce((t, d) => t + d.unidades, 0);
  }
}
