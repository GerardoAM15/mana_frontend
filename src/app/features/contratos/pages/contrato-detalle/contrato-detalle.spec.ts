import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { CajaEstadoService } from '../../../../core/services/caja-estado.service';
import { hoy, sumarDias } from '../../../../core/utils/fechas';
import { Contrato, EstadoContrato } from '../../models/contrato.model';
import { ContratoService } from '../../services/contrato-service';
import { ContratoDetalle } from './contrato-detalle';

function contrato(id: number, estado: EstadoContrato, extra: Partial<Contrato> = {}): Contrato {
  return {
    id, numero: `C-00000${id}`, localId: 1, clienteId: 10, dni: '70000001', clienteNombre: 'Lucía Quispe',
    planId: 1, planNombre: 'Semanal', estado, fechaInicio: sumarDias(hoy(), -4), fechaFin: sumarDias(hoy(), 2),
    montoTotal: 98, anteriorId: null, anuladoEn: null, motivoAnulacion: null, detalles: [], pagos: [], consumos: [],
    version: 1, ...extra,
  };
}

describe('ContratoDetalle: botón Renovar', () => {
  // Contrato ACTIVO que vence en 2 días: es renovable.
  const actual = contrato(5, 'ACTIVO');

  async function crear(otros: Contrato[]) {
    await TestBed.configureTestingModule({
      imports: [ContratoDetalle],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { tienePermiso: () => true } },
        { provide: CajaEstadoService, useValue: { abierta: signal(true), cargada: signal(true), refrescar: () => of(null) } },
        {
          provide: ContratoService,
          useValue: {
            obtener: () => of(actual),
            buscar: () => of({ contenido: [actual, ...otros], pagina: 0, tamanio: 50, totalElementos: 1 + otros.length, totalPaginas: 1, ultima: true }),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ContratoDetalle);
    fixture.componentRef.setInput('id', '5');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const elemento: HTMLElement = fixture.nativeElement;
    return {
      renovar: [...elemento.querySelectorAll('.acciones a')].find(a => a.textContent?.includes('Renovar')),
      renovadoPor: elemento.textContent?.includes('Renovado por') ?? false,
    };
  }

  it('si la renovación está ANULADA, permite Renovar otra vez', async () => {
    const { renovar, renovadoPor } = await crear([contrato(6, 'ANULADO', { anteriorId: 5 })]);
    expect(renovar).toBeTruthy();
    expect(renovadoPor).toBe(false);
  });

  it('si ya tiene una renovación vigente, oculta Renovar y la muestra como siguiente', async () => {
    const { renovar, renovadoPor } = await crear([contrato(7, 'PROGRAMADO', { anteriorId: 5 })]);
    expect(renovar).toBeUndefined();
    expect(renovadoPor).toBe(true);
  });

  it('sin renovaciones, permite Renovar', async () => {
    const { renovar } = await crear([]);
    expect(renovar).toBeTruthy();
  });
});
