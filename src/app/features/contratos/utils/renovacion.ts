import { diasEntre } from '../../../core/utils/fechas';
import { Contrato } from '../models/contrato.model';

// Se puede renovar como máximo 3 días antes de la fecha fin.
export const DIAS_RENOVACION = 3;

// Un contrato se puede renovar si está ACTIVO y faltan entre 0 y 3 días para su fin (hoy en yyyy-MM-dd).
export function esRenovable(contrato: Pick<Contrato, 'estado' | 'fechaFin'>, hoy: string): boolean {
  if (contrato.estado !== 'ACTIVO') return false;
  const dias = diasEntre(hoy, contrato.fechaFin);
  return dias >= 0 && dias <= DIAS_RENOVACION;
}
