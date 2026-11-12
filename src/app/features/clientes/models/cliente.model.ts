export interface Cliente {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  activo: boolean;
  version: number;
}

// ClienteRequestDTO: dni de 8 dígitos, nombre y apellido hasta 100, teléfono hasta 20.
export interface ClienteRequest {
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  activo: boolean;
}
