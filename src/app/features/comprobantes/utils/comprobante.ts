import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../../../core/models/error-response';
import { Comprobante, ComprobanteRequest, TipoSolicitudComprobante } from '../models/comprobante.model';

// Lo que el usuario llenó en "Datos del comprobante".
export interface DatosReceptor {
  tipo: TipoSolicitudComprobante;
  numDoc: string;
  nombre: string;
  direccion: string;
  // Opcional; vacío = no se envía por correo.
  email?: string;
}

// Lo que emite el selector: si se puede enviar y el bloque `comprobante` (null = ticket, sin comprobante SUNAT).
export interface EstadoComprobanteSolicitud {
  valido: boolean;
  solicitud: ComprobanteRequest | null;
  error: string | null;
}

export const DNI = /^\d{8}$/;
export const RUC = /^(10|15|17|20)\d{9}$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mismas reglas que ValidadorReceptorComprobante del backend.
export function estadoSolicitud(d: DatosReceptor, total: number, umbralBoleta: number): EstadoComprobanteSolicitud {
  const numDoc = d.numDoc.trim();
  const nombre = d.nombre.trim();
  const direccion = d.direccion.trim();
  const invalido = (error: string): EstadoComprobanteSolicitud => ({ valido: false, solicitud: null, error });

  if (d.tipo === 'TICKET') return { valido: true, solicitud: null, error: null };

  const email = (d.email ?? '').trim().toLowerCase();
  if (email && (!EMAIL.test(email) || email.length > 120)) return invalido('Ingrese un correo válido o déjelo vacío.');
  const extra = { ...(direccion ? { receptorDireccion: direccion } : {}), ...(email ? { receptorEmail: email } : {}) };

  if (d.tipo === 'FACTURA') {
    if (!RUC.test(numDoc)) return invalido('La factura requiere un RUC de 11 dígitos que empiece con 10, 15, 17 o 20.');
    if (!nombre) return invalido('Ingrese la razón social.');
    return valido({ tipo: 'FACTURA', receptorTipoDoc: '6', receptorNumDoc: numDoc, receptorNombre: nombre, ...extra });
  }

  // Boleta.
  if (!numDoc) {
    if (total >= umbralBoleta) return invalido(`Desde S/ ${umbralBoleta.toFixed(2)} la boleta requiere DNI o RUC del cliente.`);
    return valido({ tipo: 'BOLETA', receptorTipoDoc: '0', ...extra });
  }
  const tipoDoc = DNI.test(numDoc) ? '1' : RUC.test(numDoc) ? '6' : null;
  if (!tipoDoc) return invalido('Ingrese un DNI de 8 dígitos o un RUC de 11 dígitos.');
  if (!nombre) return invalido('Ingrese el nombre del cliente.');
  return valido({ tipo: 'BOLETA', receptorTipoDoc: tipoDoc, receptorNumDoc: numDoc, receptorNombre: nombre, ...extra });
}

function valido(solicitud: ComprobanteRequest): EstadoComprobanteSolicitud {
  return { valido: true, solicitud, error: null };
}

export function nombreTipo(tipo: string): string {
  return tipo === 'FACTURA' ? 'Factura electrónica' : tipo === 'NOTA_CREDITO' ? 'Nota de crédito electrónica' : 'Boleta de venta electrónica';
}

// Texto del QR de SUNAT: RUC|TIPO|SERIE|NUMERO|IGV|TOTAL|FECHA|TIPODOC|NUMDOC|HASH. Sin hash todavía no hay QR.
export function textoQr(c: Comprobante): string | null {
  if (!c.hash) return null;
  return [
    c.rucEmisor,
    c.tipoSunat,
    c.serie,
    c.numero,
    Number(c.igv).toFixed(2),
    Number(c.total).toFixed(2),
    c.fecha.slice(0, 10),
    c.receptorTipoDoc,
    c.receptorNumDoc ?? '',
    c.hash,
  ].join('|');
}

// Descarga un Blob con nombre (PDF o XML).
export function guardarArchivo(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Con responseType 'blob' el cuerpo del error también llega como Blob: se lee para mostrar el mensaje del backend.
export async function mensajeErrorBlob(err: HttpErrorResponse): Promise<string> {
  if (err.status === 0) return 'No se pudo conectar con el servidor.';
  if (err.error instanceof Blob) {
    try {
      const cuerpo = JSON.parse(await err.error.text()) as ErrorResponse;
      if (cuerpo?.message) return cuerpo.message;
    } catch {
      // Cuerpo no JSON: se usa el mensaje genérico.
    }
  }
  return `Error ${err.status}: ${err.statusText}`;
}
