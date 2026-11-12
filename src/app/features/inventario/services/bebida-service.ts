import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Bebida, BebidaRequest } from '../models/bebida.model';

@Injectable({ providedIn: 'root' })
export class BebidaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/bebidas`;

  listar(): Observable<Bebida[]> {
    return this.http.get<Bebida[]>(this.url);
  }

  obtener(id: number): Observable<Bebida> {
    return this.http.get<Bebida>(`${this.url}/${id}`);
  }

  crear(dto: BebidaRequest): Observable<Bebida> {
    return this.http.post<Bebida>(this.url, dto);
  }

  actualizar(id: number, dto: BebidaRequest): Observable<Bebida> {
    return this.http.put<Bebida>(`${this.url}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
