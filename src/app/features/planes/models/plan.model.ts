export type PeriodoPlan = 'SEMANAL' | 'MENSUAL';

export interface Plan {
  id: number;
  nombre: string;
  periodo: PeriodoPlan;
  activo: boolean;
  servicios: string[];
  version: number;
}

export interface PlanRequest {
  nombre: string;
  periodo: PeriodoPlan;
  activo: boolean;
  servicios: string[];
}
