export interface Local {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  activo: boolean;
  version: number;
}

export interface LocalRequest {
  nombre: string;
  direccion?: string;
  telefono?: string;
  activo: boolean;
}
