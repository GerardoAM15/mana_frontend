import { enlaceWhatsApp, etiquetaDia, mensajeMenuDelDia } from './mensaje-whatsapp';

const SERVICIOS: Record<string, string> = { D: 'Desayuno', A: 'Almuerzo', C: 'Cena' };
const CATEGORIAS: Record<string, string> = {
  PAN: 'Pan', BEBIDA_DESAYUNO: 'Bebida de desayuno', ENTRADA: 'Entrada', SEGUNDO: 'Segundo', REFRESCO: 'Refresco',
};
const nombreServicio = (c: string) => SERVICIOS[c] ?? c;
const nombreCategoria = (c: string) => CATEGORIAS[c] ?? c;
const plato = (platoId: number, nombre: string, categoria: string) => ({ platoId, nombre, categoria });

describe('mensaje del menú para WhatsApp', () => {
  it('etiqueta el día en español con fecha dd/MM', () => {
    expect(etiquetaDia('2026-11-12')).toBe('jueves 12/11');
    expect(etiquetaDia('2026-11-09')).toBe('lunes 09/11');
  });

  it('arma el menú en orden D, A, C con categorías ordenadas', () => {
    const menus = [
      { fecha: '2026-11-12', servicio: 'A', platos: [
        plato(3, 'Chicha morada', 'REFRESCO'), plato(1, 'Arroz con pollo', 'SEGUNDO'),
        plato(2, 'Ají de gallina', 'SEGUNDO'), plato(4, 'Sopa de verduras', 'ENTRADA'),
      ] },
      { fecha: '2026-11-12', servicio: 'D', platos: [plato(5, 'Pan francés', 'PAN'), plato(6, 'Quinua', 'BEBIDA_DESAYUNO')] },
      { fecha: '2026-11-13', servicio: 'C', platos: [plato(7, 'Milanesa', 'SEGUNDO')] },
    ];

    expect(mensajeMenuDelDia('2026-11-12', menus, nombreServicio, nombreCategoria)).toBe(
      '🍽️ *MANÁ* – Menú del jueves 12/11\n\n' +
      '☕ *Desayuno*\nBebida de desayuno: Quinua\nPan: Pan francés\n\n' +
      '🍲 *Almuerzo*\nEntrada: Sopa de verduras\nSegundo: Arroz con pollo, Ají de gallina\nRefresco: Chicha morada\n\n' +
      '¡Los esperamos! 🙌',
    );
  });

  it('omite servicios sin platos y devuelve null si el día está vacío', () => {
    const menus = [{ fecha: '2026-11-13', servicio: 'A', platos: [] }];
    expect(mensajeMenuDelDia('2026-11-13', menus, nombreServicio, nombreCategoria)).toBeNull();
    expect(mensajeMenuDelDia('2026-11-14', [], nombreServicio, nombreCategoria)).toBeNull();
  });

  it('el enlace codifica el texto para wa.me', () => {
    expect(enlaceWhatsApp('Menú *hoy*\n¡Sí!')).toBe('https://wa.me/?text=Men%C3%BA%20*hoy*%0A%C2%A1S%C3%AD!');
  });
});
