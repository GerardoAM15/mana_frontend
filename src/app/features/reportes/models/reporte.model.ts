// IngresoPeriodoResponseDTO: ingresos-mensuales y ventas-vs-pensiones.
export interface IngresoPeriodo {
  periodo: string;
  contratos: number;
  ventas: number;
  total: number;
}

// PlatoConsumidoResponseDTO: platos-mas-consumidos.
export interface PlatoConsumido {
  platoId: number;
  platoNombre: string;
  servicio: string;
  cantidad: number;
}

// ContratoPorVencerResponseDTO: una fila por contrato y servicio.
export interface ContratoPorVencer {
  contratoId: number;
  numero: string;
  dni: string;
  clienteNombre: string;
  fechaFin: string;
  servicio: string;
  saldoRaciones: number;
}

// AsistenciaDiariaResponseDTO.
export interface AsistenciaDiaria {
  fecha: string;
  servicio: string;
  consumos: number;
}

// GastoIngresoResponseDTO: gastos-vs-ingresos.
export interface GastoIngreso {
  periodo: string;
  ingresos: number;
  gastos: number;
  diferencia: number;
}

// Filtros comunes de los reportes (desde y hasta son obligatorios salvo en contratos-por-vencer).
export interface FiltroReporte {
  desde: string;
  hasta: string;
  localId: number | null;
}
