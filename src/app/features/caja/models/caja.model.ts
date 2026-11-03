// CajaResponseDTO. cierre es null mientras la caja está abierta.
export interface Caja {
  id: number;
  localId: number;
  usuarioId: number;
  apertura: string;
  cierre: string | null;
  montoInicial: number;
  montoEsperado: number | null;
  montoContado: number | null;
  diferencia: number | null;
  observacion: string | null;
  version: number;
}

export interface AbrirCajaRequest {
  montoInicial: number;
}

export interface ConteoCajaRequest {
  metodo: string;
  montoContado: number;
}

export interface CerrarCajaRequest {
  conteos: ConteoCajaRequest[];
  observacion?: string;
}

// MetodoCajaResponseDTO.
export interface MetodoCaja {
  metodo: string;
  montoEsperado: number;
  montoContado: number | null;
  diferencia: number | null;
  movimientos: number;
}

// ResumenCajaResponseDTO (GET /cajas/{id}/resumen).
export interface ResumenCaja {
  caja: Caja;
  metodos: MetodoCaja[];
  montoEsperado: number;
  ventas: number;
  consumos: number;
  contratos: number;
}

// Filtros de GET /cajas.
export interface FiltroCajas {
  desde: string | null;
  hasta: string | null;
  usuarioId: number | null;
  localId: number | null;
}
