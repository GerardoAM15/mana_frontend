import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CajaEstadoService } from '../../../../core/services/caja-estado.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { VentaService } from '../../../ventas/services/venta-service';
import { PosService } from '../../services/pos-service';
import { PuntoVenta } from './punto-venta';

// Días de atención ISO: D y A de lunes a viernes; C de lunes a jueves.
const DIAS = [1, 2, 3, 4, 5].flatMap(d => [{ servicio: 'D', diaSemana: d }, { servicio: 'A', diaSemana: d }])
  .concat([1, 2, 3, 4].map(d => ({ servicio: 'C', diaSemana: d })));
const NOMBRES: Record<string, string> = { D: 'Desayuno', A: 'Almuerzo', C: 'Cena' };

describe('PuntoVenta: servicios que no se atienden hoy', () => {
  let catalogoPos: ReturnType<typeof vi.fn>;

  async function crear(instanteUtc: string) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(instanteUtc));
    catalogoPos = vi.fn(() => of({ localId: 1, fecha: '', servicio: 'D', menu: null, reglas: [], sueltos: [], bebidas: [] }));

    await TestBed.configureTestingModule({
      imports: [PuntoVenta],
      providers: [
        provideRouter([]),
        { provide: PosService, useValue: { catalogo: catalogoPos } },
        { provide: VentaService, useValue: {} },
        {
          provide: CajaEstadoService,
          useValue: { abierta: signal(true), cargada: signal(true), refrescar: () => of(null) },
        },
        {
          provide: CatalogoService,
          useValue: {
            cargar: () => of({}),
            seAtiende: (s: string, d: number) => DIAS.some(x => x.servicio === s && x.diaSemana === d),
            nombreServicio: (s: string) => NOMBRES[s] ?? s,
            nombreCategoria: (c: string) => c,
            metodosPago: () => [],
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PuntoVenta);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const elemento: HTMLElement = fixture.nativeElement;
    const boton = (nombre: string) =>
      [...elemento.querySelectorAll<HTMLButtonElement>('.servicio')].find(b => b.textContent?.includes(nombre))!;
    return { elemento, boton };
  }

  afterEach(() => vi.useRealTimers());

  it('un viernes a las 20:00 deshabilita la cena y elige el primer servicio que sí se atiende', async () => {
    // Viernes 06/11/2026 20:00 en Lima (UTC-5).
    const { boton } = await crear('2026-11-07T01:00:00Z');
    expect(boton('Cena').disabled).toBe(true);
    expect(boton('Desayuno').disabled).toBe(false);
    expect(boton('Almuerzo').disabled).toBe(false);
    // Por la hora tocaría Cena, pero no se atiende: queda Desayuno.
    expect(boton('Desayuno').classList).toContain('activo');
    expect(catalogoPos).toHaveBeenCalledTimes(1);
    expect(catalogoPos).toHaveBeenCalledWith('D');
  });

  it('un jueves a las 20:00 la cena está habilitada y preseleccionada', async () => {
    // Jueves 05/11/2026 20:00 en Lima.
    const { boton } = await crear('2026-11-06T01:00:00Z');
    expect(boton('Cena').disabled).toBe(false);
    expect(boton('Cena').classList).toContain('activo');
    expect(catalogoPos).toHaveBeenCalledWith('C');
  });

  it('un sábado muestra el aviso y no carga el catálogo', async () => {
    // Sábado 07/11/2026 12:00 en Lima.
    const { elemento, boton } = await crear('2026-11-07T17:00:00Z');
    expect(elemento.textContent).toContain('Hoy no hay servicios de atención');
    expect(boton('Desayuno').disabled).toBe(true);
    expect(boton('Almuerzo').disabled).toBe(true);
    expect(boton('Cena').disabled).toBe(true);
    expect(catalogoPos).not.toHaveBeenCalled();
    expect(elemento.querySelector('.columnas')).toBeNull();
  });
});
