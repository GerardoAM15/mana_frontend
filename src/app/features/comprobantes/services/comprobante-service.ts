import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, shareReplay, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import {
  Comprobante,
  ComprobanteRequest,
  ConfiguracionComprobantes,
  FiltroComprobantes,
} from '../models/comprobante.model';

// Sin facturación (error de red, 403 o backend antiguo): el selector solo ofrece Ticket.
const SIN_FACTURACION: ConfiguracionComprobantes = {
  habilitada: false,
  ambiente: 'BETA',
  igvPorcentaje: 18,
  boletaMontoIdentificacion: 700,
  rucEmisor: '',
  razonSocialEmisor: '',
};

@Injectable({ providedIn: 'root' })
export class ComprobanteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/comprobantes`;
  private configuracion$?: Observable<ConfiguracionComprobantes>;

  // Se pide una sola vez por sesión del navegador.
  configuracion(): Observable<ConfiguracionComprobantes> {
    this.configuracion$ ??= this.http.get<ConfiguracionComprobantes>(`${this.url}/configuracion`).pipe(
      catchError(() => of(SIN_FACTURACION)),
      shareReplay(1),
    );
    return this.configuracion$;
  }

  buscar(filtro: FiltroComprobantes, pagina: number, tamanio: number): Observable<PaginaResponse<Comprobante>> {
    let params = new HttpParams().set('pagina', pagina).set('tamanio', tamanio);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    if (filtro.tipo) params = params.set('tipo', filtro.tipo);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    return this.http.get<PaginaResponse<Comprobante>>(this.url, { params });
  }

  obtener(id: number): Observable<Comprobante> {
    return this.http.get<Comprobante>(`${this.url}/${id}`);
  }

  // 404 = la venta o el contrato no tiene comprobante vigente: no es un error.
  deVenta(ventaId: number): Observable<Comprobante | null> {
    return this.http.get<Comprobante>(`${this.url}/ventas/${ventaId}`).pipe(catchError(sinComprobante));
  }

  deContrato(contratoId: number): Observable<Comprobante | null> {
    return this.http.get<Comprobante>(`${this.url}/contratos/${contratoId}`).pipe(catchError(sinComprobante));
  }

  emitirVenta(ventaId: number, dto: ComprobanteRequest): Observable<Comprobante> {
    return this.http.post<Comprobante>(`${this.url}/ventas/${ventaId}`, dto);
  }

  emitirContrato(contratoId: number, dto: ComprobanteRequest): Observable<Comprobante> {
    return this.http.post<Comprobante>(`${this.url}/contratos/${contratoId}`, dto);
  }

  reenviar(id: number): Observable<Comprobante> {
    return this.http.post<Comprobante>(`${this.url}/${id}/reenviar`, {});
  }

  // Envía el PDF y el XML por correo. Sin email usa el guardado en el comprobante.
  enviarCorreo(id: number, email?: string): Observable<Comprobante> {
    return this.http.post<Comprobante>(`${this.url}/${id}/correo`, email ? { email } : {});
  }

  pdf(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/pdf`, { responseType: 'blob' });
  }

  xml(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/xml`, { responseType: 'blob' });
  }
}

function sinComprobante(err: HttpErrorResponse): Observable<null> {
  return err.status === 404 ? of(null) : throwError(() => err);
}
