import { PagoRequest } from '../../../core/models/pago.model';
import { Consumo } from './consumo.model';

export type EstadoContrato = 'PROGRAMADO' | 'ACTIVO' | 'FINALIZADO' | 'ANULADO';
export type TipoPagoContrato = 'COBRO' | 'DEVOLUCION';

// DetalleContratoResponseDTO: una fila por servicio contratado.
export interface DetalleContrato {
  id: number;
  servicio: string;
  racionesContratadas: number;
  saldoRaciones: number;
  precioRacionPactado: number;
  subtotal: number;
}

// PagoContratoResponseDTO.
export interface PagoContrato {
  id: number;
  cajaId: number;
  tipo: TipoPagoContrato;
  metodo: string;
  monto: number;
  fecha: string;
  referencia: string | null;
}

// ContratoResponseDTO.
export interface Contrato {
  id: number;
  numero: string;
  localId: number;
  clienteId: number;
  dni: string;
  clienteNombre: string;
  planId: number;
  planNombre: string;
  estado: EstadoContrato;
  fechaInicio: string;
  fechaFin: string;
  montoTotal: number;
  anteriorId: number | null;
  anuladoEn: string | null;
  motivoAnulacion: string | null;
  detalles: DetalleContrato[];
  pagos: PagoContrato[];
  consumos: Consumo[];
  version: number;
}

// ContratoRequestDTO.
export interface ContratoRequest {
  clienteId: number;
  planId: number;
  fechaInicio: string;
  servicios: string[];
  pagos: PagoRequest[];
}

// RenovarContratoRequestDTO.
export interface RenovarContratoRequest {
  planId: number;
  servicios: string[];
  pagos: PagoRequest[];
}

// SimularContratoRequestDTO.
export interface SimularContratoRequest {
  clienteId: number;
  planId: number;
  fechaInicio: string;
  servicios: string[];
}

// RacionesServicioResponseDTO.
export interface RacionesServicio {
  servicio: string;
  raciones: number;
  precioRacion: number;
  subtotal: number;
}

// SimulacionContratoResponseDTO.
export interface SimulacionContrato {
  clienteId: number;
  planId: number;
  fechaInicio: string;
  fechaFin: string;
  servicios: RacionesServicio[];
  total: number;
}

// Filtros de GET /contratos.
export interface FiltroContratos {
  dni: string | null;
  estado: EstadoContrato | null;
  desde: string | null;
  hasta: string | null;
  localId: number | null;
}
