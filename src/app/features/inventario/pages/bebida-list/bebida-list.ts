import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { InventarioTabs } from '../../components/inventario-tabs/inventario-tabs';
import { Bebida } from '../../models/bebida.model';
import { BebidaService } from '../../services/bebida-service';

@Component({
  selector: 'app-bebida-list',
  imports: [RouterLink, CurrencyPipe, ConfirmarDialogo, InventarioTabs],
  templateUrl: './bebida-list.html',
  styleUrl: './bebida-list.css',
})
export class BebidaList implements OnInit {
  private readonly bebidaService = inject(BebidaService);

  protected readonly bebidas = signal<Bebida[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly porEliminar = signal<Bebida | null>(null);
  protected readonly eliminando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.bebidaService.listar().subscribe({
      next: bebidas => {
        this.bebidas.set(bebidas.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  confirmarEliminar(): void {
    const bebida = this.porEliminar();
    if (!bebida || this.eliminando()) return;

    this.eliminando.set(true);
    this.bebidaService.eliminar(bebida.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.porEliminar.set(null);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.eliminando.set(false);
        this.porEliminar.set(null);
      },
    });
  }
}
