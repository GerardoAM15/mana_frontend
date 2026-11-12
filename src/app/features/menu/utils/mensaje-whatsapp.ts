import { MenuDia } from '../models/menu.model';

// Orden en que se muestran los servicios y, dentro de cada uno, las categorías.
const SERVICIOS = ['D', 'A', 'C'];
const ICONO: Record<string, string> = { D: '☕', A: '🍲', C: '🌙' };
const ORDEN_CATEGORIAS = ['BEBIDA_DESAYUNO', 'PAN', 'ENTRADA', 'SEGUNDO', 'REFRESCO'];

const DIA_SEMANA = new Intl.DateTimeFormat('es-PE', { weekday: 'long', timeZone: 'UTC' });

// "jueves 12/11" a partir de yyyy-MM-dd (sin depender de la zona del navegador).
export function etiquetaDia(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
  const nombre = DIA_SEMANA.format(new Date(Date.UTC(anio, mes - 1, dia)));
  return `${nombre} ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

// Texto del menú de un día listo para pegar en WhatsApp (grupo o lista de difusión).
// *texto* sale en negrita en WhatsApp. Devuelve null si ese día no tiene platos.
export function mensajeMenuDelDia(
  fecha: string,
  menus: Pick<MenuDia, 'fecha' | 'servicio' | 'platos'>[],
  nombreServicio: (codigo: string) => string,
  nombreCategoria: (codigo: string) => string,
): string | null {
  const bloques: string[] = [];
  for (const servicio of SERVICIOS) {
    const menu = menus.find(m => m.fecha === fecha && m.servicio === servicio);
    if (!menu?.platos.length) continue;

    const porCategoria = new Map<string, string[]>();
    for (const p of menu.platos) porCategoria.set(p.categoria, [...(porCategoria.get(p.categoria) ?? []), p.nombre]);
    const categorias = [...porCategoria.keys()].sort((a, b) => posicion(a) - posicion(b));

    const lineas = categorias.map(c => `${nombreCategoria(c)}: ${porCategoria.get(c)!.join(', ')}`);
    bloques.push(`${ICONO[servicio] ?? '•'} *${nombreServicio(servicio)}*\n${lineas.join('\n')}`);
  }
  if (bloques.length === 0) return null;
  return `🍽️ *MANÁ* – Menú del ${etiquetaDia(fecha)}\n\n${bloques.join('\n\n')}\n\n¡Los esperamos! 🙌`;
}

// Enlace que abre WhatsApp (app o web) con el texto escrito; el usuario elige el chat.
export function enlaceWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

function posicion(categoria: string): number {
  const i = ORDEN_CATEGORIAS.indexOf(categoria);
  return i === -1 ? ORDEN_CATEGORIAS.length : i;
}
