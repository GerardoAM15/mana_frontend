// Servicio sugerido según la hora de Lima: antes de las 11:00 Desayuno,
// de 11:00 a 16:00 Almuerzo y después Cena.
export function servicioPorHora(hora: number): string {
  if (hora < 11) return 'D';
  if (hora < 16) return 'A';
  return 'C';
}

// Servicio inicial: el sugerido por la hora si se atiende hoy; si no, el primero que sí se atienda.
// null si hoy no se atiende ningún servicio.
export function servicioInicial(atendidosHoy: string[], sugerido: string): string | null {
  if (atendidosHoy.includes(sugerido)) return sugerido;
  return atendidosHoy[0] ?? null;
}
