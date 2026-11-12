import { aPlatosCantidad, cumpleComposicion, quitarPlato, tocarPlato } from './composicion';

// Menú de desayuno: 1 BEBIDA_DESAYUNO + 2 PAN (puede repetir).
const desayuno = [
  { categoria: 'BEBIDA_DESAYUNO', cantidad: 1 },
  { categoria: 'PAN', cantidad: 2 },
];
const platos = [
  { platoId: 1, categoria: 'BEBIDA_DESAYUNO' },
  { platoId: 2, categoria: 'BEBIDA_DESAYUNO' },
  { platoId: 3, categoria: 'PAN' },
  { platoId: 4, categoria: 'PAN' },
  { platoId: 9, categoria: 'SEGUNDO' },
];

describe('cumpleComposicion', () => {
  it('acepta 1 bebida y 2 panes distintos', () => {
    expect(cumpleComposicion(desayuno, platos, { 1: 1, 3: 1, 4: 1 })).toBe(true);
  });

  it('acepta repetir el mismo pan', () => {
    expect(cumpleComposicion(desayuno, platos, { 1: 1, 3: 2 })).toBe(true);
  });

  it('rechaza si falta un pan', () => {
    expect(cumpleComposicion(desayuno, platos, { 1: 1, 3: 1 })).toBe(false);
  });

  it('rechaza si sobra un pan o una bebida', () => {
    expect(cumpleComposicion(desayuno, platos, { 1: 1, 3: 3 })).toBe(false);
    expect(cumpleComposicion(desayuno, platos, { 1: 1, 2: 1, 3: 2 })).toBe(false);
  });

  it('rechaza una categoría que no está en la composición', () => {
    expect(cumpleComposicion(desayuno, platos, { 1: 1, 3: 2, 9: 1 })).toBe(false);
  });

  it('rechaza platos que no están en el menú de hoy', () => {
    expect(cumpleComposicion(desayuno, platos, { 1: 1, 3: 1, 99: 1 })).toBe(false);
  });

  it('rechaza una selección vacía o una composición vacía', () => {
    expect(cumpleComposicion(desayuno, platos, {})).toBe(false);
    expect(cumpleComposicion([], platos, { 1: 1 })).toBe(false);
  });
});

describe('tocarPlato y quitarPlato', () => {
  it('con cantidad 1 reemplaza el plato de la categoría y vuelve a tocarlo lo quita', () => {
    let seleccion = tocarPlato({}, platos[0], 1, platos);
    expect(seleccion).toEqual({ 1: 1 });
    seleccion = tocarPlato(seleccion, platos[1], 1, platos);
    expect(seleccion).toEqual({ 2: 1 });
    expect(tocarPlato(seleccion, platos[1], 1, platos)).toEqual({});
  });

  it('con cantidad 2 suma hasta el máximo y no lo pasa', () => {
    let seleccion = tocarPlato({}, platos[2], 2, platos);
    seleccion = tocarPlato(seleccion, platos[2], 2, platos);
    expect(seleccion).toEqual({ 3: 2 });
    expect(tocarPlato(seleccion, platos[3], 2, platos)).toEqual({ 3: 2 });
  });

  it('quitarPlato resta 1 y elimina al llegar a 0', () => {
    expect(quitarPlato({ 3: 2 }, 3)).toEqual({ 3: 1 });
    expect(quitarPlato({ 3: 1 }, 3)).toEqual({});
  });

  it('aPlatosCantidad arma el request sin ceros', () => {
    expect(aPlatosCantidad({ 1: 1, 3: 2, 4: 0 })).toEqual([{ platoId: 1, cantidad: 1 }, { platoId: 3, cantidad: 2 }]);
  });
});
