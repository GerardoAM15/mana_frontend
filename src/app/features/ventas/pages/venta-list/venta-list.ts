import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { hoy } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { EstadoBadge } from '../../../../shared/components/estado-badge/estado-badge';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { EstadoVenta, FiltroVentas, Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

const TAMANIO = 20;

@Component({
  selector: 'app-venta-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, EstadoBadge, Paginador],
  templateUrl: './venta-list.html',
  styleUrl: './venta-list.css',
})
export class VentaList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ventaService = inject(VentaService);
  protected readonly catalogos = inject(CatalogoService);

  // ?estado=PENDIENTE&cajaId=... desde "Cerrar caja".
  readonly estado = input<string>();
  readonly cajaId = input<string>();

  protected readonly estados: EstadoVenta[] = ['PENDIENTE', 'PAGADA', 'ANULADA'];
  protected readonly resultado = signal<PaginaResponse<Venta> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtros = this.fb.group({
    desde: [''],
    hasta: [''],
    estado: this.fb.control<EstadoVenta | ''>(''),
    cajaId: [''],
  });

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    const estado = this.estado() as EstadoVenta | undefined;
    const cajaId = this.cajaId();
    if (estado || cajaId) {
      this.filtros.patchValue({ estado: estado && this.estados.includes(estado) ? estado : '', cajaId: cajaId ?? '' });
    } else {
      this.filtros.patchValue({ desde: hoy(), hasta: hoy() });
    }
    this.buscar(0);
  }

  buscar(pagina = 0): void {
    const v = this.filtros.getRawValue();
    const filtro: FiltroVentas = {
      desde: v.desde || null,
      hasta: v.hasta || null,
      estado: v.estado || null,
      cajaId: v.cajaId ? Number(v.cajaId) : null,
      localId: null,
    };

    this.cargando.set(true);
    this.error.set(null);
    this.ventaService.buscar(filtro, pagina, TAMANIO).subscribe({
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
    this.filtros.reset({ desde: '', hasta: '', estado: '', cajaId: '' });
    this.buscar(0);
  }
}
