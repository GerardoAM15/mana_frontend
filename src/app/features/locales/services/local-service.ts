import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Local, LocalRequest } from '../models/local.model';

@Injectable({ providedIn: 'root' })
export class LocalService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/locales`;

  listar(): Observable<Local[]> {
    return this.http.get<Local[]>(this.url);
  }

  obtener(id: number): Observable<Local> {
    return this.http.get<Local>(`${this.url}/${id}`);
  }

  crear(dto: LocalRequest): Observable<Local> {
    return this.http.post<Local>(this.url, dto);
  }

  actualizar(id: number, dto: LocalRequest): Observable<Local> {
    return this.http.put<Local>(`${this.url}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
