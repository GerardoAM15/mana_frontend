import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AsistenciaDiaria,
  ContratoPorVencer,
  FiltroReporte,
  GastoIngreso,
  IngresoPeriodo,
  PlatoConsumido,
} from '../models/reporte.model';

// agrupacion de gastos-vs-ingresos: el backend acepta DIA o MES.
export type Agrupacion = 'DIA' | 'MES';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  ingresosMensuales(filtro: FiltroReporte): Observable<IngresoPeriodo[]> {
    return this.http.get<IngresoPeriodo[]>(`${this.url}/ingresos-mensuales`, { params: this.params(filtro) });
  }

  ventasVsPensiones(filtro: FiltroReporte): Observable<IngresoPeriodo[]> {
    return this.http.get<IngresoPeriodo[]>(`${this.url}/ventas-vs-pensiones`, { params: this.params(filtro) });
  }

  platosMasConsumidos(filtro: FiltroReporte, servicio: string | null): Observable<PlatoConsumido[]> {
    let params = this.params(filtro);
    if (servicio) params = params.set('servicio', servicio);
    return this.http.get<PlatoConsumido[]>(`${this.url}/platos-mas-consumidos`, { params });
  }

  asistenciaDiaria(filtro: FiltroReporte): Observable<AsistenciaDiaria[]> {
    return this.http.get<AsistenciaDiaria[]>(`${this.url}/asistencia-diaria`, { params: this.params(filtro) });
  }

  gastosVsIngresos(filtro: FiltroReporte, agrupacion: Agrupacion): Observable<GastoIngreso[]> {
    return this.http.get<GastoIngreso[]>(`${this.url}/gastos-vs-ingresos`, { params: this.params(filtro).set('agrupacion', agrupacion) });
  }

  // desde/hasta son opcionales en este reporte; dias por defecto es 3.
  contratosPorVencer(dias: number, desde: string | null = null, hasta: string | null = null, localId: number | null = null): Observable<ContratoPorVencer[]> {
    let params = new HttpParams().set('dias', dias);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    if (localId) params = params.set('localId', localId);
    return this.http.get<ContratoPorVencer[]>(`${this.url}/contratos-por-vencer`, { params });
  }

  private params(filtro: FiltroReporte): HttpParams {
    let params = new HttpParams().set('desde', filtro.desde).set('hasta', filtro.hasta);
    if (filtro.localId) params = params.set('localId', filtro.localId);
    return params;
  }
}
