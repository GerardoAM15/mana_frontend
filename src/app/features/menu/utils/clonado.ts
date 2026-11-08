// Servicios que se pidieron clonar y el backend no devolvió (por ejemplo, la cena de un viernes).
export function serviciosOmitidos(pedidos: string[], devueltos: { servicio: string }[]): string[] {
  const clonados = new Set(devueltos.map(m => m.servicio));
  return pedidos.filter(s => !clonados.has(s));
}

// "Día clonado." o "Día clonado. Se omitió: Cena (no se atiende ese día)".
export function mensajeClonado(omitidos: { nombre: string; motivo: string }[]): string {
  if (omitidos.length === 0) return 'Día clonado.';
  return `Día clonado. Se omitió: ${omitidos.map(o => `${o.nombre} (${o.motivo})`).join(', ')}`;
}
