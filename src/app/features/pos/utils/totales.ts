import { redondear } from '../../../core/utils/numeros';
import { LineaVentaRequest, TipoLineaVenta } from '../../ventas/models/venta.model';

// Línea del pedido en pantalla. recargoUnitario sale del catálogo del POS:
// menú = regla.recargoLlevar, suelto = suelto.recargoLlevar, bebida = 0.
export interface LineaPedido {
  clave: string;
  tipo: TipoLineaVenta;
  descripcion: string;
  detalle: string[];
  cantidad: number;
  precioUnitario: number;
  recargoUnitario: number;
  platoId?: number;
  reglaId?: number;
  bebidaId?: number;
  platos?: { platoId: number; cantidad: number }[];
  stock?: number;
}

export interface TotalesPedido {
  subtotal: number;
  recargo: number;
  total: number;
}

// Igual que el backend: recargo = Σ cantidad × recargoUnitario (solo si es para llevar)
// y total = Σ cantidad × precioUnitario + recargo.
export function calcularTotales(lineas: Pick<LineaPedido, 'tipo' | 'cantidad' | 'precioUnitario' | 'recargoUnitario'>[], paraLlevar: boolean): TotalesPedido {
  const subtotal = redondear(lineas.reduce((t, l) => t + l.cantidad * l.precioUnitario, 0));
  const recargo = paraLlevar
    ? redondear(lineas.reduce((t, l) => t + (l.tipo === 'BEBIDA' ? 0 : l.cantidad * l.recargoUnitario), 0))
    : 0;
  return { subtotal, recargo, total: redondear(subtotal + recargo) };
}

export function subtotalLinea(linea: LineaPedido, paraLlevar: boolean): number {
  const recargo = paraLlevar && linea.tipo !== 'BEBIDA' ? linea.recargoUnitario : 0;
  return redondear(linea.cantidad * (linea.precioUnitario + recargo));
}

export function aLineasVenta(lineas: LineaPedido[]): LineaVentaRequest[] {
  return lineas.map(l => {
    switch (l.tipo) {
      case 'COMBO':
        return { tipo: 'COMBO', cantidad: l.cantidad, reglaId: l.reglaId, platos: l.platos };
      case 'PLATO':
        return { tipo: 'PLATO', cantidad: l.cantidad, platoId: l.platoId };
      default:
        return { tipo: 'BEBIDA', cantidad: l.cantidad, bebidaId: l.bebidaId };
    }
  });
}
