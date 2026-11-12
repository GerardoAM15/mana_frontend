import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { FiltroGastos, Gasto, GastoRequest } from '../models/gasto.model';

@Injectable({ providedIn: 'root' })
export class GastoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/gastos`;

  buscar(filtro: FiltroGastos, pagina: number, tamanio: number): Observable<PaginaResponse<Gasto>> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio)
      .set('ordenarPor', 'fecha')
      .set('direccion', 'desc');

    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    if (filtro.localId) params = params.set('localId', filtro.localId);

    return this.http.get<PaginaResponse<Gasto>>(this.url, { params });
  }

  obtener(id: number): Observable<Gasto> {
    return this.http.get<Gasto>(`${this.url}/${id}`);
  }

  crear(dto: GastoRequest): Observable<Gasto> {
    return this.http.post<Gasto>(this.url, dto);
  }

  actualizar(id: number, dto: GastoRequest): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.url}/${id}`, dto);
  }

  // Desactiva el gasto (baja lógica).
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
