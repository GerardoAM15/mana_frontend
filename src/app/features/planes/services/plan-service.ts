import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Plan, PlanRequest } from '../models/plan.model';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/planes`;

  listar(): Observable<Plan[]> {
    return this.http.get<Plan[]>(this.url);
  }

  obtener(id: number): Observable<Plan> {
    return this.http.get<Plan>(`${this.url}/${id}`);
  }

  crear(dto: PlanRequest): Observable<Plan> {
    return this.http.post<Plan>(this.url, dto);
  }

  actualizar(id: number, dto: PlanRequest): Observable<Plan> {
    return this.http.put<Plan>(`${this.url}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
