import { PagoRequest } from '../../../core/models/pago.model';
import { PlatoCantidad } from '../../contratos/models/consumo.model';

export type EstadoVenta = 'PENDIENTE' | 'PAGADA' | 'ANULADA';
export type TipoLineaVenta = 'PLATO' | 'COMBO' | 'BEBIDA';

// PlatoComboResponseDTO: platos elegidos dentro de una línea COMBO.
export interface PlatoCombo {
  platoId: number;
  nombre: string;
  cantidad: number;
}

// LineaVentaResponseDTO.
export interface LineaVenta {
  id: number;
  tipo: TipoLineaVenta;
  platoId: number | null;
  reglaId: number | null;
  bebidaId: number | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  recargoUnitario: number;
  platos: PlatoCombo[];
}

// PagoVentaResponseDTO.
export interface PagoVenta {
  id: number;
  metodo: string;
  monto: number;
  fecha: string;
}

// DevolucionVentaResponseDTO.
export interface DevolucionVenta {
  id: number;
  metodo: string;
  monto: number;
  fecha: string;
  motivo: string;
}

// VentaResponseDTO.
export interface Venta {
  id: number;
  numero: string;
  localId: number;
  cajaId: number;
  clienteId: number | null;
  servicio: string;
  paraLlevar: boolean;
  estado: EstadoVenta;
  fecha: string;
  recargoLlevar: number;
  total: number;
  anuladaEn: string | null;
  motivoAnulacion: string | null;
  lineas: LineaVenta[];
  pagos: PagoVenta[];
  devoluciones: DevolucionVenta[];
  version: number;
}

// LineaVentaRequestDTO. PLATO lleva platoId, COMBO reglaId + platos, BEBIDA bebidaId.
export interface LineaVentaRequest {
  tipo: TipoLineaVenta;
  cantidad: number;
  platoId?: number;
  reglaId?: number;
  bebidaId?: number;
  platos?: PlatoCantidad[];
}

// VentaRequestDTO. Con pagos la venta queda PAGADA; sin pagos, PENDIENTE.
export interface VentaRequest {
  servicio: string;
  paraLlevar: boolean;
  clienteId?: number;
  lineas: LineaVentaRequest[];
  pagos?: PagoRequest[];
}

// PagosVentaRequestDTO (POST /ventas/{id}/pagos).
export interface PagosVentaRequest {
  pagos: PagoRequest[];
}

// Filtros de GET /ventas.
export interface FiltroVentas {
  desde: string | null;
  hasta: string | null;
  estado: EstadoVenta | null;
  cajaId: number | null;
  localId: number | null;
}
