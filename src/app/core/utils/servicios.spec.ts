import { servicioInicial, servicioPorHora } from './servicios';

describe('servicioPorHora', () => {
  it('antes de las 11 Desayuno, de 11 a 16 Almuerzo y después Cena', () => {
    expect(servicioPorHora(7)).toBe('D');
    expect(servicioPorHora(11)).toBe('A');
    expect(servicioPorHora(15)).toBe('A');
    expect(servicioPorHora(16)).toBe('C');
  });
});

describe('servicioInicial', () => {
  it('usa el sugerido por la hora si se atiende hoy', () => {
    expect(servicioInicial(['D', 'A', 'C'], 'C')).toBe('C');
  });

  it('si el sugerido no se atiende hoy (cena del viernes), toma el primero que sí', () => {
    expect(servicioInicial(['D', 'A'], 'C')).toBe('D');
  });

  it('devuelve null si hoy no se atiende ningún servicio', () => {
    expect(servicioInicial([], 'A')).toBeNull();
  });
});
