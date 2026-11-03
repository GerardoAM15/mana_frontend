import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PrecioSuelto, PrecioSueltoRequest } from '../models/precio-suelto.model';

// La clave de un precio suelto es (servicio, categoria).
@Injectable({ providedIn: 'root' })
export class PrecioSueltoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/precios-sueltos`;

  listar(): Observable<PrecioSuelto[]> {
    return this.http.get<PrecioSuelto[]>(this.url);
  }

  crear(dto: PrecioSueltoRequest): Observable<PrecioSuelto> {
    return this.http.post<PrecioSuelto>(this.url, dto);
  }

  actualizar(servicio: string, categoria: string, dto: PrecioSueltoRequest): Observable<PrecioSuelto> {
    return this.http.put<PrecioSuelto>(`${this.url}/${servicio}/${categoria}`, dto);
  }

  eliminar(servicio: string, categoria: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${servicio}/${categoria}`);
  }
}
