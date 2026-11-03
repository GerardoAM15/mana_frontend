// Reglas de composición del menú (componentes_regla): cuántos platos de cada categoría lleva.
// Las usan el Mostrador (consumo del pensionista) y el POS (combo).

export interface Componente {
  categoria: string;
  cantidad: number;
}

export interface PlatoDisponible {
  platoId: number;
  categoria: string;
}

// platoId -> cantidad elegida.
export type Seleccion = Record<number, number>;

export function cantidadesPorCategoria(seleccion: Seleccion, platos: PlatoDisponible[]): Record<string, number> {
  const categoriaDe = new Map(platos.map(p => [p.platoId, p.categoria]));
  const totales: Record<string, number> = {};
  for (const [id, cantidad] of Object.entries(seleccion)) {
    const categoria = categoriaDe.get(Number(id));
    if (categoria && cantidad > 0) totales[categoria] = (totales[categoria] ?? 0) + cantidad;
  }
  return totales;
}

// La selección cumple si todos sus platos están en el menú, no hay categorías extra
// y cada categoría de la composición tiene EXACTAMENTE la cantidad requerida.
export function cumpleComposicion(componentes: Componente[], platos: PlatoDisponible[], seleccion: Seleccion): boolean {
  if (componentes.length === 0) return false;
  const disponibles = new Set(platos.map(p => p.platoId));
  const elegidos = Object.entries(seleccion).filter(([, cantidad]) => cantidad > 0);
  if (elegidos.some(([id]) => !disponibles.has(Number(id)))) return false;

  const totales = cantidadesPorCategoria(seleccion, platos);
  const requeridas = new Map(componentes.map(c => [c.categoria, c.cantidad]));
  if (Object.keys(totales).some(categoria => !requeridas.has(categoria))) return false;
  return componentes.every(c => (totales[c.categoria] ?? 0) === c.cantidad);
}

// Toca un plato: si la categoría pide 1, lo reemplaza (o lo quita si ya estaba);
// si pide más, suma 1 mientras no se pase de la cantidad requerida (se puede repetir).
export function tocarPlato(seleccion: Seleccion, plato: PlatoDisponible, requerida: number, platos: PlatoDisponible[]): Seleccion {
  const delaCategoria = platos.filter(p => p.categoria === plato.categoria).map(p => p.platoId);
  if (requerida === 1) {
    const yaElegido = (seleccion[plato.platoId] ?? 0) > 0;
    const nueva = { ...seleccion };
    delaCategoria.forEach(id => delete nueva[id]);
    if (!yaElegido) nueva[plato.platoId] = 1;
    return nueva;
  }
  const elegida = cantidadesPorCategoria(seleccion, platos)[plato.categoria] ?? 0;
  if (elegida >= requerida) return seleccion;
  return { ...seleccion, [plato.platoId]: (seleccion[plato.platoId] ?? 0) + 1 };
}

export function quitarPlato(seleccion: Seleccion, platoId: number): Seleccion {
  const actual = seleccion[platoId] ?? 0;
  const nueva = { ...seleccion };
  if (actual <= 1) delete nueva[platoId];
  else nueva[platoId] = actual - 1;
  return nueva;
}

export function aPlatosCantidad(seleccion: Seleccion): { platoId: number; cantidad: number }[] {
  return Object.entries(seleccion)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([id, cantidad]) => ({ platoId: Number(id), cantidad }));
}
