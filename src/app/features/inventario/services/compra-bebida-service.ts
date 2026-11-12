import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CompraBebida, CompraBebidaRequest, FiltroCompras } from '../models/compra-bebida.model';

@Injectable({ providedIn: 'root' })
export class CompraBebidaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/compras-bebidas`;

  listar(filtro: FiltroCompras): Observable<CompraBebida[]> {
    let params = new HttpParams();
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    if (filtro.localId) params = params.set('localId', filtro.localId);
    return this.http.get<CompraBebida[]>(this.url, { params });
  }

  obtener(id: number): Observable<CompraBebida> {
    return this.http.get<CompraBebida>(`${this.url}/${id}`);
  }

  // Suma presentaciones × unidades al stock del local y registra movimientos COMPRA.
  registrar(dto: CompraBebidaRequest): Observable<CompraBebida> {
    return this.http.post<CompraBebida>(this.url, dto);
  }
}
