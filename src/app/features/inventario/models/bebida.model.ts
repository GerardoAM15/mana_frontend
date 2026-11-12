export interface Bebida {
  id: number;
  nombre: string;
  precioVenta: number;
  activo: boolean;
  version: number;
}

export interface BebidaRequest {
  nombre: string;
  precioVenta: number;
  activo: boolean;
}
