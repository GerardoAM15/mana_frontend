// Fechas de negocio en la zona de Lima. El backend usa LocalDate (yyyy-MM-dd)
// y LocalDateTime sin zona, así que aquí siempre se trabaja con texto ISO.
const ZONA = 'America/Lima';

function partes(fecha: Date): Record<string, string> {
  const formato = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return Object.fromEntries(formato.formatToParts(fecha).map(p => [p.type, p.value]));
}

// Hoy en Lima como yyyy-MM-dd.
export function hoy(): string {
  const p = partes(new Date());
  return `${p['year']}-${p['month']}-${p['day']}`;
}

// Hora actual en Lima (0-23).
export function horaActual(): number {
  return Number(partes(new Date())['hour']);
}

function aFecha(iso: string): Date {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function aIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function sumarDias(iso: string, dias: number): string {
  const fecha = aFecha(iso);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return aIso(fecha);
}

// Día de la semana ISO: 1 = lunes ... 7 = domingo.
export function diaSemanaIso(iso: string): number {
  return aFecha(iso).getUTCDay() || 7;
}

// Lunes de la semana a la que pertenece la fecha.
export function inicioSemana(iso: string): string {
  return sumarDias(iso, 1 - diaSemanaIso(iso));
}

export function primerDiaMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

// Días completos entre dos fechas ISO (hasta - desde).
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aFecha(hasta).getTime() - aFecha(desde).getTime()) / 86_400_000);
}
