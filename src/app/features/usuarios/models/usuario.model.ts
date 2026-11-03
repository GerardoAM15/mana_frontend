export type Rol = 'ADMINISTRADOR' | 'DUENO' | 'CAJERO';

// UsuarioResponseDTO: persona + empleado + usuario. Nunca trae la clave.
export interface Usuario {
  id: number;
  empleadoId: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  localId: number;
  localNombre: string;
  cargo: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  version: number;
}

// UsuarioRequestDTO. clave (8 a 72) es opcional al editar.
export interface UsuarioRequest {
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  localId: number;
  cargo: string;
  correo: string;
  clave?: string;
  rol: Rol;
  activo: boolean;
}

// RolRequestDTO (PATCH /usuarios/{id}/rol).
export interface RolRequest {
  rol: Rol;
}
