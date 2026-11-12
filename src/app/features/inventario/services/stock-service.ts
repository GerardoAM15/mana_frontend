import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { FiltroMovimientos, MovimientoStock, StockBebida } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly urlStock = `${environment.apiUrl}/stock-bebidas`;
  private readonly urlMovimientos = `${environment.apiUrl}/movimientos-stock`;

  listar(localId: number | null = null): Observable<StockBebida[]> {
    const params = localId ? new HttpParams().set('localId', localId) : undefined;
    return this.http.get<StockBebida[]>(this.urlStock, { params });
  }

  // Kardex.
  movimientos(filtro: FiltroMovimientos, pagina: number, tamanio: number): Observable<PaginaResponse<MovimientoStock>> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio)
      .set('ordenarPor', 'id')
      .set('direccion', 'desc');

    if (filtro.bebidaId) params = params.set('bebidaId', filtro.bebidaId);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    if (filtro.localId) params = params.set('localId', filtro.localId);

    return this.http.get<PaginaResponse<MovimientoStock>>(this.urlMovimientos, { params });
  }
}
