// DetalleCompraResponseDTO. unidades = presentaciones × unidadesPorPresentacion.
export interface DetalleCompra {
  id: number;
  bebidaId: number;
  bebidaNombre: string;
  presentaciones: number;
  unidadesPorPresentacion: number;
  unidades: number;
  costoTotal: number;
}

// CompraBebidaResponseDTO.
export interface CompraBebida {
  id: number;
  localId: number;
  proveedorId: number;
  proveedorNombre: string;
  fecha: string;
  total: number;
  detalles: DetalleCompra[];
}

// DetalleCompraRequestDTO.
export interface DetalleCompraRequest {
  bebidaId: number;
  presentaciones: number;
  unidadesPorPresentacion: number;
  costoTotal: number;
}

// CompraBebidaRequestDTO.
export interface CompraBebidaRequest {
  proveedorId: number;
  fecha: string;
  detalles: DetalleCompraRequest[];
}

// Filtros de GET /compras-bebidas.
export interface FiltroCompras {
  desde: string | null;
  hasta: string | null;
  localId: number | null;
}
