// DiaNoAtencionResponseDTO: feriado o cierre del local.
export interface DiaNoAtencion {
  id: number;
  localId: number;
  fecha: string;
  motivo: string;
  version: number;
}

export interface DiaNoAtencionRequest {
  fecha: string;
  motivo: string;
}

// Filtros de GET /dias-no-atencion.
export interface FiltroDiasNoAtencion {
  desde: string | null;
  hasta: string | null;
  localId: number | null;
}
