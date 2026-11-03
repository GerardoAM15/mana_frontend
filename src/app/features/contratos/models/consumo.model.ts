// DetalleConsumoResponseDTO.
export interface DetalleConsumo {
  platoId: number;
  platoNombre: string;
  categoria: string;
  cantidad: number;
}

// ConsumoResponseDTO.
export interface Consumo {
  id: number;
  contratoId: number;
  detalleContratoId: number;
  servicio: string;
  fecha: string;
  registradoEn: string;
  valorRacion: number;
  paraLlevar: boolean;
  recargoLlevar: number | null;
  metodoRecargo: string | null;
  cajaId: number | null;
  anulado: boolean;
  anuladoEn: string | null;
  motivoAnulacion: string | null;
  platos: DetalleConsumo[];
}

// PlatoCantidadRequestDTO.
export interface PlatoCantidad {
  platoId: number;
  cantidad: number;
}

// ConsumoRequestDTO. metodoRecargo solo cuando es para llevar y el servicio tiene recargo.
export interface ConsumoRequest {
  contratoId: number;
  servicio: string;
  platos: PlatoCantidad[];
  paraLlevar: boolean;
  metodoRecargo?: string;
}

// Filtros de GET /consumos.
export interface FiltroConsumos {
  contratoId: number | null;
  servicio: string | null;
  desde: string | null;
  hasta: string | null;
  localId: number | null;
}
