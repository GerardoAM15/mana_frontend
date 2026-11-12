import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AnularRequest } from '../../../core/models/anulacion.model';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { FiltroVentas, PagosVentaRequest, Venta, VentaRequest } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ventas`;

  registrar(dto: VentaRequest): Observable<Venta> {
    return this.http.post<Venta>(this.url, dto);
  }

  obtener(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.url}/${id}`);
  }

  cobrar(id: number, dto: PagosVentaRequest): Observable<Venta> {
    return this.http.post<Venta>(`${this.url}/${id}/pagos`, dto);
  }

  anular(id: number, dto: AnularRequest): Observable<Venta> {
    return this.http.patch<Venta>(`${this.url}/${id}/anular`, dto);
  }

  buscar(filtro: FiltroVentas, pagina: number, tamanio: number): Observable<PaginaResponse<Venta>> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio)
      .set('ordenarPor', 'id')
      .set('direccion', 'desc');

    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.cajaId) params = params.set('cajaId', filtro.cajaId);
    if (filtro.localId) params = params.set('localId', filtro.localId);

    return this.http.get<PaginaResponse<Venta>>(this.url, { params });
  }
}
