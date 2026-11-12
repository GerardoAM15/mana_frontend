// POST /auth/login (LoginRequestDTO).
export interface LoginRequest {
  correo: string;
  clave: string;
}

// Respuesta de POST /auth/login y GET /auth/me (LoginResponseDTO).
export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  usuarioId: number;
  nombreCompleto: string;
  rol: string;
  localId: number;
  localNombre: string;
  permisos: string[];
}

// Lo que se guarda en sessionStorage: el token y el instante (ms) en que vence.
export interface Sesion {
  token: string;
  usuarioId: number;
  nombreCompleto: string;
  rol: string;
  localId: number;
  localNombre: string;
  permisos: string[];
  expiraEn: number;
}

// POST /auth/recuperar (RecuperarClaveRequestDTO).
export interface RecuperarClaveRequest {
  correo: string;
}

// POST /auth/restablecer (RestablecerClaveRequestDTO).
export interface RestablecerClaveRequest {
  token: string;
  nuevaClave: string;
}

// MensajeResponseDTO.
export interface MensajeResponse {
  mensaje: string;
}
