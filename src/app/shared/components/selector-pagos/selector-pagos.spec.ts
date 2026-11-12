import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EstadoPagos, validarPagos } from '../../../core/utils/pagos';
import { SelectorPagos } from './selector-pagos';

const fila = (metodo: string, monto: number | null) => ({ metodo, monto, referencia: '' });

describe('validarPagos (suma exacta)', () => {
  it('es válido si la suma es exactamente el total', () => {
    expect(validarPagos([fila('EFECTIVO', 60), fila('YAPE', 38)], 98)).toBe(true);
  });

  it('no es válido si falta o sobra', () => {
    expect(validarPagos([fila('EFECTIVO', 60)], 98)).toBe(false);
    expect(validarPagos([fila('EFECTIVO', 100)], 98)).toBe(false);
  });

  it('no es válido con montos en 0, negativos o vacíos', () => {
    expect(validarPagos([fila('EFECTIVO', 98), fila('YAPE', 0)], 98)).toBe(false);
    expect(validarPagos([fila('EFECTIVO', 100), fila('YAPE', -2)], 98)).toBe(false);
    expect(validarPagos([fila('EFECTIVO', null)], 98)).toBe(false);
  });

  it('no es válido sin método o con total 0', () => {
    expect(validarPagos([fila('', 98)], 98)).toBe(false);
    expect(validarPagos([fila('EFECTIVO', 0)], 0)).toBe(false);
  });

  it('compara en céntimos sin errores de coma flotante', () => {
    expect(validarPagos([fila('EFECTIVO', 0.1), fila('YAPE', 0.2)], 0.3)).toBe(true);
  });
});

describe('SelectorPagos', () => {
  async function crear(total: number) {
    await TestBed.configureTestingModule({
      imports: [SelectorPagos],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(SelectorPagos);
    const emitidos: EstadoPagos[] = [];
    fixture.componentInstance.cambio.subscribe(e => emitidos.push(e));
    fixture.componentRef.setInput('total', total);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, emitidos, input: (i: number) => fixture.nativeElement.querySelectorAll('input[type=number]')[i] as HTMLInputElement };
  }

  it('con una sola fila el monto sigue al total y emite pagos válidos', async () => {
    const { emitidos } = await crear(26);
    const ultimo = emitidos.at(-1)!;
    expect(ultimo.valido).toBe(true);
    expect(ultimo.pagado).toBe(26);
    expect(ultimo.pagos).toEqual([{ metodo: 'EFECTIVO', monto: 26 }]);
  });

  it('deja de ser válido si la suma no es exacta y vuelve a serlo al completar', async () => {
    const { fixture, emitidos, input } = await crear(26);
    const monto = input(0);
    monto.value = '20';
    monto.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(emitidos.at(-1)!.valido).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Falta');

    // "Agregar otro método" propone el monto que falta.
    (fixture.nativeElement.querySelector('.agregar') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input(1).value).toBe('6');
    expect(emitidos.at(-1)!.valido).toBe(true);
    expect(emitidos.at(-1)!.pagado).toBe(26);
  });
});
