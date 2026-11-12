// StockBebidaResponseDTO (GET /stock-bebidas).
export interface StockBebida {
  id: number;
  localId: number;
  bebidaId: number;
  bebidaNombre: string;
  stock: number;
}

export type TipoMovimientoStock = 'COMPRA' | 'VENTA' | 'DEVOLUCION';

// MovimientoStockResponseDTO (kardex, GET /movimientos-stock).
export interface MovimientoStock {
  id: number;
  localId: number;
  bebidaId: number;
  bebidaNombre: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  fecha: string;
  detalleCompraId: number | null;
  detalleOrdenId: number | null;
  motivo: string | null;
}

// Filtros de GET /movimientos-stock.
export interface FiltroMovimientos {
  bebidaId: number | null;
  desde: string | null;
  hasta: string | null;
  localId: number | null;
}
