import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ConsultaDocumentoService } from '../../../../core/services/consulta-documento.service';
import { ConfiguracionComprobantes } from '../../models/comprobante.model';
import { ComprobanteService } from '../../services/comprobante-service';
import { EstadoComprobanteSolicitud } from '../../utils/comprobante';
import { DatosComprobante } from './datos-comprobante';

const config = (habilitada: boolean): ConfiguracionComprobantes => ({
  habilitada, ambiente: 'BETA', igvPorcentaje: 18, boletaMontoIdentificacion: 700, rucEmisor: '', razonSocialEmisor: '',
});

async function crear(habilitada: boolean, permisos: string[], total = 50) {
  await TestBed.configureTestingModule({
    imports: [DatosComprobante],
    providers: [
      { provide: ComprobanteService, useValue: { configuracion: () => of(config(habilitada)) } },
      { provide: AuthService, useValue: { tienePermiso: (p?: string) => !p || permisos.includes(p) } },
      { provide: ConsultaDocumentoService, useValue: { dni: () => of({ dni: '12345678', nombre: 'ANA', apellido: 'PEREZ', fuente: 'RENIEC', registrado: false }) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(DatosComprobante);
  const emitidos: EstadoComprobanteSolicitud[] = [];
  fixture.componentInstance.cambio.subscribe(e => emitidos.push(e));
  fixture.componentRef.setInput('total', total);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const boton = (texto: string) => [...el.querySelectorAll<HTMLButtonElement>('.tipo')].find(b => b.textContent?.includes(texto))!;
  return { fixture, el, emitidos, boton, ultimo: () => emitidos[emitidos.length - 1] };
}

describe('DatosComprobante', () => {
  it('con la facturación apagada no muestra nada y emite Ticket', async () => {
    const { el, ultimo } = await crear(false, ['COMPROBANTE_EMITIR']);
    expect(el.querySelector('.comprobante')).toBeNull();
    expect(ultimo()).toEqual({ valido: true, solicitud: null, error: null });
  });

  it('sin COMPROBANTE_EMITIR no muestra el selector', async () => {
    const { el } = await crear(true, []);
    expect(el.querySelector('.comprobante')).toBeNull();
  });

  it('por defecto es Ticket; al elegir Factura sin RUC queda inválido', async () => {
    const { fixture, boton, ultimo } = await crear(true, ['COMPROBANTE_EMITIR']);
    expect(ultimo().solicitud).toBeNull();
    boton('Factura').click();
    fixture.detectChanges();
    expect(ultimo().valido).toBe(false);
  });

  it('boleta con DNI autocompleta el nombre y queda válida', async () => {
    const { fixture, el, boton, ultimo } = await crear(true, ['COMPROBANTE_EMITIR']);
    boton('Boleta').click();
    fixture.detectChanges();
    const input = el.querySelector<HTMLInputElement>('input[formcontrolname="numDoc"]')!;
    input.value = '12345678';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(ultimo().solicitud).toEqual({ tipo: 'BOLETA', receptorTipoDoc: '1', receptorNumDoc: '12345678', receptorNombre: 'ANA PEREZ' });
  });

  it('boleta sobre el umbral exige documento', async () => {
    const { fixture, boton, ultimo } = await crear(true, ['COMPROBANTE_EMITIR'], 800);
    boton('Boleta').click();
    fixture.detectChanges();
    expect(ultimo().valido).toBe(false);
  });
});
