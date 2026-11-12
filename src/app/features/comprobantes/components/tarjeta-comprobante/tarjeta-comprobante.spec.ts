import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { Comprobante, ConfiguracionComprobantes } from '../../models/comprobante.model';
import { ComprobanteService } from '../../services/comprobante-service';
import { TarjetaComprobante } from './tarjeta-comprobante';

const CONFIG: ConfiguracionComprobantes = {
  habilitada: true, ambiente: 'BETA', igvPorcentaje: 18, boletaMontoIdentificacion: 700, rucEmisor: '20471380904', razonSocialEmisor: 'MANA',
};

function comprobante(estado: Comprobante['estado']): Comprobante {
  return {
    id: 1, localId: 1, ventaId: 5, contratoId: null, referenciaId: null, referenciaNumero: null, tipo: 'BOLETA', tipoSunat: '03',
    serie: 'B001', numero: 1, numeroCompleto: 'B001-00000001', fecha: '2026-11-10T12:00:00', moneda: 'PEN', rucEmisor: '20471380904',
    receptorTipoDoc: '0', receptorNumDoc: null, receptorNombre: 'CLIENTES VARIOS', receptorDireccion: null, porcentajeIgv: 18,
    opGravadas: 10, igv: 1.8, total: 11.8, estado, ambiente: 'BETA', sunatCodigo: null, sunatMensaje: null, hash: null, intentos: 0,
    ultimoIntentoEn: null, motivoCodigo: null, motivoDescripcion: null, lineas: [], receptorEmail: null, correoEnviadoEn: null,
  };
}

async function crear(actual: Comprobante | null, permisos: string[]) {
  await TestBed.configureTestingModule({
    imports: [TarjetaComprobante],
    providers: [
      { provide: ComprobanteService, useValue: { configuracion: () => of(CONFIG), deVenta: () => of(actual) } },
      { provide: AuthService, useValue: { tienePermiso: (p?: string) => !p || permisos.includes(p) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(TarjetaComprobante);
  fixture.componentRef.setInput('ventaId', 5);
  fixture.componentRef.setInput('total', 11.8);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('TarjetaComprobante', () => {
  it('un comprobante PENDIENTE muestra el aviso de envío, no un error', async () => {
    const el = await crear(comprobante('PENDIENTE'), ['COMPROBANTE_VER']);
    expect(el.textContent).toContain('B001-00000001');
    expect(el.textContent).toContain('se enviará a SUNAT en unos minutos');
    expect(el.querySelector('.alerta')).toBeNull();
    expect(el.textContent).toContain('PRUEBA');
  });

  it('sin comprobante y con COMPROBANTE_EMITIR ofrece emitir', async () => {
    const el = await crear(null, ['COMPROBANTE_VER', 'COMPROBANTE_EMITIR']);
    expect(el.textContent).toContain('Emitir boleta o factura');
  });

  it('un RECHAZADO permite emitir de nuevo', async () => {
    const el = await crear(comprobante('RECHAZADO'), ['COMPROBANTE_VER', 'COMPROBANTE_EMITIR']);
    expect(el.textContent).toContain('Emitir de nuevo');
  });

  it('sin COMPROBANTE_GESTIONAR no muestra Reenviar', async () => {
    const el = await crear(comprobante('ERROR'), ['COMPROBANTE_VER']);
    expect(el.textContent).toContain('Actualizar estado');
    expect(el.textContent).not.toContain('Reenviar');
  });

  it('un aceptado ofrece enviar por correo y muestra cuándo se envió', async () => {
    const c = { ...comprobante('ACEPTADO'), receptorEmail: 'ana@correo.com', correoEnviadoEn: '2026-11-10T12:05:00' };
    const el = await crear(c, ['COMPROBANTE_VER', 'COMPROBANTE_EMITIR']);
    expect(el.textContent).toContain('ana@correo.com');
    expect(el.textContent).toContain('enviado el 10/11/2026 12:05');
    expect(el.textContent).toContain('Reenviar por correo');
  });

  it('un pendiente no ofrece correo todavía', async () => {
    const el = await crear({ ...comprobante('PENDIENTE'), receptorEmail: 'ana@correo.com' }, ['COMPROBANTE_VER', 'COMPROBANTE_EMITIR']);
    expect(el.textContent).not.toContain('por correo');
    expect(el.textContent).toContain('se enviará cuando SUNAT lo acepte');
  });

  it('sin comprobante ni permiso de emitir no muestra nada', async () => {
    const el = await crear(null, ['COMPROBANTE_VER']);
    expect(el.querySelector('.tarjeta-comprobante')).toBeNull();
  });
});
