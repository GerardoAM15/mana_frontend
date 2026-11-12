import { mensajeClonado, serviciosOmitidos } from './clonado';

describe('aviso de servicios omitidos al clonar', () => {
  it('detecta el servicio que el backend no devolvió', () => {
    expect(serviciosOmitidos(['D', 'A', 'C'], [{ servicio: 'D' }, { servicio: 'A' }])).toEqual(['C']);
  });

  it('no hay omitidos si se devolvió todo lo pedido', () => {
    expect(serviciosOmitidos(['D', 'A'], [{ servicio: 'A' }, { servicio: 'D' }])).toEqual([]);
  });

  it('arma el mensaje con el servicio omitido y su motivo', () => {
    expect(mensajeClonado([{ nombre: 'Cena', motivo: 'no se atiende ese día' }])).toBe(
      'Día clonado. Se omitió: Cena (no se atiende ese día)',
    );
  });

  it('lista varios omitidos separados por coma', () => {
    expect(
      mensajeClonado([
        { nombre: 'Almuerzo', motivo: 'feriado' },
        { nombre: 'Cena', motivo: 'feriado' },
      ]),
    ).toBe('Día clonado. Se omitió: Almuerzo (feriado), Cena (feriado)');
  });

  it('sin omitidos el mensaje es simple', () => {
    expect(mensajeClonado([])).toBe('Día clonado.');
  });
});
