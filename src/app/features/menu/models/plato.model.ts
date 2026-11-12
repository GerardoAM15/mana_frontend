export interface Plato {
  id: number;
  nombre: string;
  categoria: string;
  activo: boolean;
  version: number;
}

export interface PlatoRequest {
  nombre: string;
  categoria: string;
  activo: boolean;
}
