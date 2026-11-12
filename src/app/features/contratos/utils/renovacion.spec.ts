import { EstadoContrato } from '../models/contrato.model';
import { esRenovable } from './renovacion';

const contrato = (estado: EstadoContrato, fechaFin: string) => ({ estado, fechaFin });

describe('esRenovable (botón Renovar)', () => {
  const hoy = '2026-11-03';

  it('es visible si está ACTIVO y faltan 3 días', () => {
    expect(esRenovable(contrato('ACTIVO', '2026-11-06'), hoy)).toBe(true);
  });

  it('es visible si está ACTIVO y faltan 1 o 2 días', () => {
    expect(esRenovable(contrato('ACTIVO', '2026-11-04'), hoy)).toBe(true);
    expect(esRenovable(contrato('ACTIVO', '2026-11-05'), hoy)).toBe(true);
  });

  it('es visible el mismo día de la fecha fin', () => {
    expect(esRenovable(contrato('ACTIVO', '2026-11-03'), hoy)).toBe(true);
  });

  it('no es visible si faltan 4 días o más', () => {
    expect(esRenovable(contrato('ACTIVO', '2026-11-07'), hoy)).toBe(false);
    expect(esRenovable(contrato('ACTIVO', '2026-11-09'), hoy)).toBe(false);
  });

  it('no es visible si la fecha fin ya pasó', () => {
    expect(esRenovable(contrato('ACTIVO', '2026-11-02'), hoy)).toBe(false);
  });

  it('no es visible si no está ACTIVO, aunque falten 3 días o menos', () => {
    expect(esRenovable(contrato('PROGRAMADO', '2026-11-05'), hoy)).toBe(false);
    expect(esRenovable(contrato('FINALIZADO', '2026-11-05'), hoy)).toBe(false);
    expect(esRenovable(contrato('ANULADO', '2026-11-05'), hoy)).toBe(false);
  });

  it('cuenta bien los días al cruzar de mes', () => {
    expect(esRenovable(contrato('ACTIVO', '2026-12-01'), '2026-11-28')).toBe(true);
    expect(esRenovable(contrato('ACTIVO', '2026-12-02'), '2026-11-28')).toBe(false);
  });
});
