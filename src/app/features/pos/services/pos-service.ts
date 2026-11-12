import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PosCatalogo } from '../models/pos-catalogo.model';

@Injectable({ providedIn: 'root' })
export class PosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pos`;

  // Lo que se puede vender hoy en ese servicio: menú del día, reglas, sueltos y bebidas con stock.
  catalogo(servicio: string): Observable<PosCatalogo> {
    return this.http.get<PosCatalogo>(`${this.url}/catalogo`, { params: new HttpParams().set('servicio', servicio) });
  }
}
