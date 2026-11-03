import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReglaCobro, ReglaCobroRequest } from '../models/regla-cobro.model';

@Injectable({ providedIn: 'root' })
export class ReglaCobroService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reglas-cobro`;

  listar(): Observable<ReglaCobro[]> {
    return this.http.get<ReglaCobro[]>(this.url);
  }

  obtener(id: number): Observable<ReglaCobro> {
    return this.http.get<ReglaCobro>(`${this.url}/${id}`);
  }

  crear(dto: ReglaCobroRequest): Observable<ReglaCobro> {
    return this.http.post<ReglaCobro>(this.url, dto);
  }

  actualizar(id: number, dto: ReglaCobroRequest): Observable<ReglaCobro> {
    return this.http.put<ReglaCobro>(`${this.url}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
