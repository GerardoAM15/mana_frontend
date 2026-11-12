import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Tarifa, TarifaRequest } from '../models/tarifa.model';

// Precio por ración del pensionista. Cambiarlo no afecta contratos ya registrados.
@Injectable({ providedIn: 'root' })
export class TarifaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tarifas`;

  listar(): Observable<Tarifa[]> {
    return this.http.get<Tarifa[]>(this.url);
  }

  crear(dto: TarifaRequest): Observable<Tarifa> {
    return this.http.post<Tarifa>(this.url, dto);
  }

  actualizar(id: number, dto: TarifaRequest): Observable<Tarifa> {
    return this.http.put<Tarifa>(`${this.url}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
