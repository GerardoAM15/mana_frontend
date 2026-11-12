import { calcularTotales, LineaPedido } from './totales';

// Precios de referencia (reglas de negocio de MANÁ): menú A 11.00 (+2.00 llevar),
// entrada suelta 4.00 (+1.00 llevar), desayuno 4.50 (+0 llevar).
const linea = (tipo: LineaPedido['tipo'], cantidad: number, precioUnitario: number, recargoUnitario: number) =>
  ({ tipo, cantidad, precioUnitario, recargoUnitario });

describe('calcularTotales (POS)', () => {
  it('2 menús de almuerzo para llevar = 26.00', () => {
    expect(calcularTotales([linea('COMBO', 2, 11, 2)], true)).toEqual({ subtotal: 22, recargo: 4, total: 26 });
  });

  it('1 almuerzo + 1 entrada para llevar = 18.00', () => {
    const totales = calcularTotales([linea('COMBO', 1, 11, 2), linea('PLATO', 1, 4, 1)], true);
    expect(totales).toEqual({ subtotal: 15, recargo: 3, total: 18 });
  });

  it('1 desayuno para llevar = 4.50 (sin recargo)', () => {
    expect(calcularTotales([linea('COMBO', 1, 4.5, 0)], true)).toEqual({ subtotal: 4.5, recargo: 0, total: 4.5 });
  });

  it('sin "para llevar" no se cobra recargo', () => {
    expect(calcularTotales([linea('COMBO', 2, 11, 2)], false)).toEqual({ subtotal: 22, recargo: 0, total: 22 });
  });

  it('las bebidas nunca llevan recargo', () => {
    const totales = calcularTotales([linea('COMBO', 1, 11, 2), linea('BEBIDA', 2, 2.5, 1)], true);
    expect(totales).toEqual({ subtotal: 16, recargo: 2, total: 18 });
  });

  it('redondea a 2 decimales', () => {
    expect(calcularTotales([linea('BEBIDA', 3, 1.1, 0)], false).total).toBe(3.3);
  });
});
