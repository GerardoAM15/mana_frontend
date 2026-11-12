// GastoDiarioResponseDTO.
export interface Gasto {
  id: number;
  localId: number;
  fecha: string;
  monto: number;
  descripcion: string;
  activo: boolean;
  version: number;
}

// GastoDiarioRequestDTO: monto mayor a 0, descripción hasta 500 caracteres.
export interface GastoRequest {
  fecha: string;
  monto: number;
  descripcion: string;
  activo: boolean;
}

// Filtros de GET /gastos.
export interface FiltroGastos {
  desde: string | null;
  hasta: string | null;
  localId: number | null;
}
