import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { InventarioTabs } from '../../components/inventario-tabs/inventario-tabs';
import { Bebida } from '../../models/bebida.model';
import { Proveedor } from '../../models/proveedor.model';
import { BebidaService } from '../../services/bebida-service';
import { ProveedorService } from '../../services/proveedor-service';

@Component({
  selector: 'app-proveedor-list',
  imports: [RouterLink, ConfirmarDialogo, InventarioTabs],
  templateUrl: './proveedor-list.html',
  styleUrl: './proveedor-list.css',
})
export class ProveedorList implements OnInit {
  private readonly proveedorService = inject(ProveedorService);
  private readonly bebidaService = inject(BebidaService);

  protected readonly proveedores = signal<Proveedor[]>([]);
  private readonly bebidas = signal<Bebida[]>([]);
  private readonly nombres = computed(() => new Map(this.bebidas().map(b => [b.id, b.nombre])));
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly porEliminar = signal<Proveedor | null>(null);
  protected readonly eliminando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    forkJoin([this.proveedorService.listar(), this.bebidaService.listar()]).subscribe({
      next: ([proveedores, bebidas]) => {
        this.proveedores.set(proveedores.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial)));
        this.bebidas.set(bebidas);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected nombresBebidas(proveedor: Proveedor): string {
    return proveedor.bebidaIds.map(id => this.nombres().get(id) ?? `#${id}`).join(', ') || '-';
  }

  confirmarEliminar(): void {
    const proveedor = this.porEliminar();
    if (!proveedor || this.eliminando()) return;

    this.eliminando.set(true);
    this.proveedorService.eliminar(proveedor.id).subscribe({
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
