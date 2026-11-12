import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { hoy, primerDiaMes } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { EstadoBadge } from '../../../../shared/components/estado-badge/estado-badge';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { Comprobante, EstadoComprobante, TipoComprobante } from '../../models/comprobante.model';
import { ComprobanteService } from '../../services/comprobante-service';
import { guardarArchivo, mensajeErrorBlob, nombreTipo } from '../../utils/comprobante';

const TAMANIO = 20;

// Listado de boletas, facturas y notas de crédito (COMPROBANTE_GESTIONAR).
@Component({
  selector: 'app-comprobante-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, EstadoBadge, Paginador],
  templateUrl: './comprobante-list.html',
  styleUrl: './comprobante-list.css',
})
export class ComprobanteList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(ComprobanteService);

  protected readonly tipos: TipoComprobante[] = ['BOLETA', 'FACTURA', 'NOTA_CREDITO'];
  protected readonly estados: EstadoComprobante[] = ['PENDIENTE', 'ACEPTADO', 'OBSERVADO', 'RECHAZADO', 'ERROR', 'ANULADO'];
  protected readonly nombreTipo = nombreTipo;
  protected readonly resultado = signal<PaginaResponse<Comprobante> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly ocupado = signal<number | null>(null);
  protected readonly filtros = this.fb.group({
    desde: [primerDiaMes(hoy())],
    hasta: [hoy()],
    tipo: this.fb.control<TipoComprobante | ''>(''),
    estado: this.fb.control<EstadoComprobante | ''>(''),
  });

  ngOnInit(): void {
    this.buscar(0);
  }

  buscar(pagina = 0): void {
    const v = this.filtros.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.service
      .buscar({ desde: v.desde || null, hasta: v.hasta || null, tipo: v.tipo || null, estado: v.estado || null }, pagina, TAMANIO)
      .subscribe({
        next: r => {
          this.resultado.set(r);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  limpiar(): void {
    this.filtros.reset({ desde: '', hasta: '', tipo: '', estado: '' });
    this.buscar(0);
  }

  descargar(c: Comprobante, formato: 'pdf' | 'xml'): void {
    this.ocupado.set(c.id);
    this.error.set(null);
    (formato === 'pdf' ? this.service.pdf(c.id) : this.service.xml(c.id)).subscribe({
      next: blob => {
        this.ocupado.set(null);
        guardarArchivo(blob, `${c.serie}-${c.numero}.${formato}`);
      },
      error: async (err: HttpErrorResponse) => {
        this.ocupado.set(null);
        this.error.set(await mensajeErrorBlob(err));
      },
    });
  }

  reenviar(c: Comprobante): void {
    this.ocupado.set(c.id);
    this.error.set(null);
    this.mensaje.set(null);
    this.service.reenviar(c.id).subscribe({
      next: actualizado => {
        this.ocupado.set(null);
        this.mensaje.set(`${actualizado.numeroCompleto}: ${actualizado.estado}${actualizado.sunatMensaje ? ' · ' + actualizado.sunatMensaje : ''}`);
        this.resultado.update(r => r && { ...r, contenido: r.contenido.map(x => (x.id === c.id ? actualizado : x)) });
      },
      error: (err: HttpErrorResponse) => {
        this.ocupado.set(null);
        this.error.set(mensajeError(err));
      },
    });
  }

  protected puedeReenviar(c: Comprobante): boolean {
    return (c.estado === 'PENDIENTE' || c.estado === 'ERROR') && c.intentos < 5;
  }
}
