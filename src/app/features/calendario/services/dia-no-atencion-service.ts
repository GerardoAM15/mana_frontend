import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DiaNoAtencion, DiaNoAtencionRequest, FiltroDiasNoAtencion } from '../models/dia-no-atencion.model';

@Injectable({ providedIn: 'root' })
export class DiaNoAtencionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/dias-no-atencion`;

  listar(filtro: FiltroDiasNoAtencion): Observable<DiaNoAtencion[]> {
    let params = new HttpParams();
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    if (filtro.localId) params = params.set('localId', filtro.localId);
    return this.http.get<DiaNoAtencion[]>(this.url, { params });
  }

  crear(dto: DiaNoAtencionRequest): Observable<DiaNoAtencion> {
    return this.http.post<DiaNoAtencion>(this.url, dto);
  }

  actualizar(id: number, dto: DiaNoAtencionRequest): Observable<DiaNoAtencion> {
    return this.http.put<DiaNoAtencion>(`${this.url}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
