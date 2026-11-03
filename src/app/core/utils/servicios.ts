// Servicio sugerido según la hora de Lima: antes de las 11:00 Desayuno,
// de 11:00 a 16:00 Almuerzo y después Cena.
export function servicioPorHora(hora: number): string {
  if (hora < 11) return 'D';
  if (hora < 16) return 'A';
  return 'C';
}
