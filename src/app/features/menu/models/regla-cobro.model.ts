// ComponenteReglaResponseDTO: cuántos platos de una categoría lleva el menú.
export interface ComponenteRegla {
  categoria: string;
  cantidad: number;
}

// ReglaCobroResponseDTO: menú público (combo) con su composición y recargo para llevar.
export interface ReglaCobro {
  id: number;
  nombre: string;
  servicio: string;
  precioCombo: number;
  recargoLlevar: number;
  activo: boolean;
  componentes: ComponenteRegla[];
  version: number;
}

export interface ReglaCobroRequest {
  nombre: string;
  servicio: string;
  precioCombo: number;
  recargoLlevar: number;
  activo: boolean;
  componentes: ComponenteRegla[];
}
