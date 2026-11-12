import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { Contrato } from '../../contratos/models/contrato.model';
import { Cliente, ClienteRequest } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clientes`;

  // q: DNI exacto o parte del nombre/apellido.
  buscar(q: string, pagina: number, tamanio: number): Observable<PaginaResponse<Cliente>> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio)
      .set('ordenarPor', 'id')
      .set('direccion', 'desc');
    if (q.trim()) params = params.set('q', q.trim());

    return this.http.get<PaginaResponse<Cliente>>(this.url, { params });
  }

  obtener(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.url}/${id}`);
  }

  crear(dto: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.url, dto);
  }

  actualizar(id: number, dto: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.url}/${id}`, dto);
  }

  // El backend lo desactiva (baja lógica).
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  contratoVigente(id: number): Observable<Contrato> {
    return this.http.get<Contrato>(`${this.url}/${id}/contrato-vigente`);
  }
}
