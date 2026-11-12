import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClonarMenuRequest, CopiarCenaRequest, FiltroMenus, MenuDia, MenuRequest } from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/menus`;

  listar(filtro: FiltroMenus): Observable<MenuDia[]> {
    let params = new HttpParams();
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    if (filtro.servicio) params = params.set('servicio', filtro.servicio);
    if (filtro.localId) params = params.set('localId', filtro.localId);
    return this.http.get<MenuDia[]>(this.url, { params });
  }

  // Crea o reemplaza el menú de esa fecha y servicio.
  guardar(dto: MenuRequest): Observable<MenuDia> {
    return this.http.put<MenuDia>(this.url, dto);
  }

  clonar(dto: ClonarMenuRequest): Observable<MenuDia[]> {
    return this.http.post<MenuDia[]>(`${this.url}/clonar`, dto);
  }

  copiarACena(dto: CopiarCenaRequest): Observable<MenuDia> {
    return this.http.post<MenuDia>(`${this.url}/copiar-a-cena`, dto);
  }
}
