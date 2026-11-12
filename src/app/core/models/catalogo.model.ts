// Respuesta de GET /catalogos (CatalogosResponseDTO).
export interface CatalogoItem {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

// diaSemana en ISO: 1 = lunes ... 7 = domingo.
export interface DiaAtencion {
  servicio: string;
  diaSemana: number;
}

export interface Catalogos {
  servicios: CatalogoItem[];
  metodosPago: CatalogoItem[];
  categorias: CatalogoItem[];
  roles: CatalogoItem[];
  diasAtencion: DiaAtencion[];
}
