import { PagoRequest } from '../models/pago.model';
import { redondear, sumar } from './numeros';

export interface FilaPago {
  metodo: string;
  monto: number | null;
  referencia: string;
}

export interface EstadoPagos {
  pagos: PagoRequest[];
  pagado: number;
  valido: boolean;
}

// Los pagos son válidos si cada fila tiene método y monto > 0, y la suma es EXACTAMENTE el total.
export function validarPagos(filas: FilaPago[], total: number): boolean {
  if (total <= 0 || filas.length === 0) return false;
  const filasOk = filas.every(f => !!f.metodo && f.monto !== null && f.monto > 0);
  return filasOk && sumar(filas.map(f => f.monto ?? 0)) === redondear(total);
}

export function aPagos(filas: FilaPago[]): PagoRequest[] {
  return filas.map(f => {
    const referencia = f.referencia.trim();
    return { metodo: f.metodo, monto: redondear(f.monto ?? 0), ...(referencia ? { referencia } : {}) };
  });
}

export function estadoPagos(filas: FilaPago[], total: number): EstadoPagos {
  return {
    pagos: aPagos(filas),
    pagado: sumar(filas.map(f => f.monto ?? 0)),
    valido: validarPagos(filas, total),
  };
}
