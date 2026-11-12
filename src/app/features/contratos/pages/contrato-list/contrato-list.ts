import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { EstadoBadge } from '../../../../shared/components/estado-badge/estado-badge';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Contrato, EstadoContrato, FiltroContratos } from '../../models/contrato.model';
import { ContratoService } from '../../services/contrato-service';

const TAMANIO = 20;

@Component({
  selector: 'app-contrato-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, EstadoBadge, Paginador, SiPermiso],
  templateUrl: './contrato-list.html',
  styleUrl: './contrato-list.css',
})
export class ContratoList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly contratoService = inject(ContratoService);

  protected readonly estados: EstadoContrato[] = ['PROGRAMADO', 'ACTIVO', 'FINALIZADO', 'ANULADO'];
  protected readonly resultado = signal<PaginaResponse<Contrato> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtros = this.fb.group({
    dni: [''],
    estado: this.fb.control<EstadoContrato | ''>(''),
    desde: [''],
    hasta: [''],
  });

  ngOnInit(): void {
    this.buscar(0);
  }

  buscar(pagina = 0): void {
    const valores = this.filtros.getRawValue();
    const filtro: FiltroContratos = {
      dni: valores.dni.trim() || null,
      estado: valores.estado || null,
      desde: valores.desde || null,
      hasta: valores.hasta || null,
      localId: null,
    };

    this.cargando.set(true);
    this.error.set(null);
    this.contratoService.buscar(filtro, pagina, TAMANIO).subscribe({
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
    this.filtros.reset();
    this.buscar(0);
  }
}
