import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Proveedor, ProveedorRequest } from '../models/proveedor.model';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/proveedores`;

  listar(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.url);
  }

  obtener(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.url}/${id}`);
  }

  crear(dto: ProveedorRequest): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.url, dto);
  }

  actualizar(id: number, dto: ProveedorRequest): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.url}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
