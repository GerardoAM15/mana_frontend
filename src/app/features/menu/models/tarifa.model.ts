// TarifaServicioResponseDTO: precio por ración del pensionista.
export interface Tarifa {
  id: number;
  servicio: string;
  precio: number;
  activo: boolean;
  version: number;
}

export interface TarifaRequest {
  servicio: string;
  precio: number;
  activo: boolean;
}
