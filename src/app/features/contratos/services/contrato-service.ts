import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AnularRequest } from '../../../core/models/anulacion.model';
import { PaginaResponse } from '../../../core/models/pagina-response';
import {
  Contrato,
  ContratoRequest,
  FiltroContratos,
  RenovarContratoRequest,
  SimulacionContrato,
  SimularContratoRequest,
} from '../models/contrato.model';

@Injectable({ providedIn: 'root' })
export class ContratoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/contratos`;

  buscar(filtro: FiltroContratos, pagina: number, tamanio: number): Observable<PaginaResponse<Contrato>> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio)
      .set('ordenarPor', 'id')
      .set('direccion', 'desc');

    if (filtro.dni) params = params.set('dni', filtro.dni);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    if (filtro.localId) params = params.set('localId', filtro.localId);

    return this.http.get<PaginaResponse<Contrato>>(this.url, { params });
  }

  obtener(id: number): Observable<Contrato> {
    return this.http.get<Contrato>(`${this.url}/${id}`);
  }

  simular(dto: SimularContratoRequest): Observable<SimulacionContrato> {
    return this.http.post<SimulacionContrato>(`${this.url}/simular`, dto);
  }

  crear(dto: ContratoRequest): Observable<Contrato> {
    return this.http.post<Contrato>(this.url, dto);
  }

  renovar(id: number, dto: RenovarContratoRequest): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.url}/${id}/renovar`, dto);
  }

  anular(id: number, dto: AnularRequest): Observable<Contrato> {
    return this.http.patch<Contrato>(`${this.url}/${id}/anular`, dto);
  }
}
