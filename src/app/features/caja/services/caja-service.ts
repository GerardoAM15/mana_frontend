import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { AbrirCajaRequest, Caja, CerrarCajaRequest, FiltroCajas, ResumenCaja } from '../models/caja.model';

// GET /cajas/actual vive en CajaEstadoService (estado global de la caja abierta).
@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/cajas`;

  abrir(dto: AbrirCajaRequest): Observable<Caja> {
    return this.http.post<Caja>(`${this.url}/abrir`, dto);
  }

  resumen(id: number): Observable<ResumenCaja> {
    return this.http.get<ResumenCaja>(`${this.url}/${id}/resumen`);
  }

  cerrar(id: number, dto: CerrarCajaRequest): Observable<Caja> {
    return this.http.post<Caja>(`${this.url}/${id}/cerrar`, dto);
  }

  buscar(filtro: FiltroCajas, pagina: number, tamanio: number): Observable<PaginaResponse<Caja>> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio)
      .set('ordenarPor', 'id')
      .set('direccion', 'desc');

    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    if (filtro.usuarioId) params = params.set('usuarioId', filtro.usuarioId);
    if (filtro.localId) params = params.set('localId', filtro.localId);

    return this.http.get<PaginaResponse<Caja>>(this.url, { params });
  }
}
