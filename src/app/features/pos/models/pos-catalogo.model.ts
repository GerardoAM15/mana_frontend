import { MenuDia } from '../../menu/models/menu.model';
import { ReglaCobro } from '../../menu/models/regla-cobro.model';

// PlatoSueltoPosResponseDTO.
export interface PlatoSueltoPos {
  platoId: number;
  nombre: string;
  categoria: string;
  precio: number;
  recargoLlevar: number;
}

// BebidaPosResponseDTO.
export interface BebidaPos {
  bebidaId: number;
  nombre: string;
  precioVenta: number;
  stock: number;
}

// PosCatalogoResponseDTO (GET /pos/catalogo?servicio=): lo que se puede vender hoy.
export interface PosCatalogo {
  localId: number;
  fecha: string;
  servicio: string;
  menu: MenuDia | null;
  reglas: ReglaCobro[];
  sueltos: PlatoSueltoPos[];
  bebidas: BebidaPos[];
}
