// ProveedorResponseDTO con los ids de las bebidas que vende.
export interface Proveedor {
  id: number;
  razonSocial: string;
  telefono: string | null;
  activo: boolean;
  bebidaIds: number[];
  version: number;
}

export interface ProveedorRequest {
  razonSocial: string;
  telefono?: string;
  activo: boolean;
  bebidaIds: number[];
}
