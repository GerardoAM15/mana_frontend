import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Pensionista } from '../models/pensionista.model';

@Injectable({ providedIn: 'root' })
export class PensionistaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pensionistas`;

  // Busca por DNI o nombre en el local del usuario: contrato vigente y saldo por servicio.
  buscar(q: string): Observable<Pensionista[]> {
    return this.http.get<Pensionista[]>(`${this.url}/buscar`, { params: new HttpParams().set('q', q.trim()) });
  }
}
