import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Plato, PlatoRequest } from '../models/plato.model';

@Injectable({ providedIn: 'root' })
export class PlatoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/platos`;

  listar(): Observable<Plato[]> {
    return this.http.get<Plato[]>(this.url);
  }

  obtener(id: number): Observable<Plato> {
    return this.http.get<Plato>(`${this.url}/${id}`);
  }

  crear(dto: PlatoRequest): Observable<Plato> {
    return this.http.post<Plato>(this.url, dto);
  }

  actualizar(id: number, dto: PlatoRequest): Observable<Plato> {
    return this.http.put<Plato>(`${this.url}/${id}`, dto);
  }

  // Baja lógica si el plato ya se usó en menús, ventas o consumos.
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
