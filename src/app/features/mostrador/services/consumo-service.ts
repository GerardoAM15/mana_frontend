import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AnularRequest } from '../../../core/models/anulacion.model';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { Consumo, ConsumoRequest, FiltroConsumos } from '../../contratos/models/consumo.model';

@Injectable({ providedIn: 'root' })
export class ConsumoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/consumos`;

  registrar(dto: ConsumoRequest): Observable<Consumo> {
    return this.http.post<Consumo>(this.url, dto);
  }

  anular(id: number, dto: AnularRequest): Observable<Consumo> {
    return this.http.patch<Consumo>(`${this.url}/${id}/anular`, dto);
  }

  buscar(filtro: FiltroConsumos, pagina: number, tamanio: number): Observable<PaginaResponse<Consumo>> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio)
      .set('ordenarPor', 'id')
      .set('direccion', 'desc');

    if (filtro.contratoId) params = params.set('contratoId', filtro.contratoId);
    if (filtro.servicio) params = params.set('servicio', filtro.servicio);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    if (filtro.localId) params = params.set('localId', filtro.localId);

    return this.http.get<PaginaResponse<Consumo>>(this.url, { params });
  }
}
