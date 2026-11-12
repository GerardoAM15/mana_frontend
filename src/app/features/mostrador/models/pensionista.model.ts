import { DetalleContrato, EstadoContrato } from '../../contratos/models/contrato.model';

// PensionistaResponseDTO (GET /pensionistas/buscar?q=): contrato vigente y saldo por servicio.
export interface Pensionista {
  clienteId: number;
  dni: string;
  nombreCompleto: string;
  contratoId: number;
  numero: string;
  estado: EstadoContrato;
  fechaInicio: string;
  fechaFin: string;
  servicios: DetalleContrato[];
}
