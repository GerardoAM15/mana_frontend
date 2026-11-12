import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensajeError } from '../utils/http-error';

// GET /consultas/dni/{dni}. fuente = MANA (ya registrado) o RENIEC (APIsPERU).
export interface ConsultaDni {
  dni: string;
  nombre: string;
  apellido: string;
  fuente: 'MANA' | 'RENIEC';
  registrado: boolean;
}

// GET /consultas/ruc/{ruc}. estado y condicion son informativos (SUNAT).
export interface ConsultaRuc {
  ruc: string;
  razonSocial: string;
  direccion: string | null;
  telefono: string | null;
  estado: string | null;
  condicion: string | null;
}

// Autocompletado de formularios. El token de APIsPERU vive solo en el backend.
@Injectable({ providedIn: 'root' })
export class ConsultaDocumentoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/consultas`;

  dni(dni: string): Observable<ConsultaDni> {
    return this.http.get<ConsultaDni>(`${this.url}/dni/${encodeURIComponent(dni)}`);
  }

  ruc(ruc: string): Observable<ConsultaRuc> {
    return this.http.get<ConsultaRuc>(`${this.url}/ruc/${encodeURIComponent(ruc)}`);
  }
}

// Mensaje para el usuario cuando la consulta no completa el formulario.
// Nunca bloquea: siempre se puede escribir a mano.
export function mensajeConsulta(err: HttpErrorResponse): string {
  if (err.status === 404) return mensajeError(err);
  if (err.status === 429) return 'Demasiadas consultas seguidas; espere un minuto o escriba los datos.';
  if (err.status === 503 || err.status === 0) return 'La consulta no está disponible ahora; escriba los datos manualmente.';
  return mensajeError(err);
}
