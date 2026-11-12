import { Comprobante } from '../models/comprobante.model';
import { DatosReceptor, estadoSolicitud, textoQr } from './comprobante';

const datos = (d: Partial<DatosReceptor>): DatosReceptor => ({ tipo: 'BOLETA', numDoc: '', nombre: '', direccion: '', ...d });

describe('estadoSolicitud', () => {
  it('Ticket no envía bloque de comprobante', () => {
    expect(estadoSolicitud(datos({ tipo: 'TICKET' }), 50, 700)).toEqual({ valido: true, solicitud: null, error: null });
  });

  it('boleta bajo el umbral sin documento va a CLIENTES VARIOS', () => {
    expect(estadoSolicitud(datos({}), 699.99, 700).solicitud).toEqual({ tipo: 'BOLETA', receptorTipoDoc: '0' });
  });

  it('boleta desde el umbral exige documento', () => {
    const r = estadoSolicitud(datos({}), 700, 700);
    expect(r.valido).toBe(false);
    expect(r.error).toContain('requiere DNI o RUC');
  });

  it('boleta con DNI exige nombre y envía tipo 1', () => {
    expect(estadoSolicitud(datos({ numDoc: '12345678' }), 10, 700).valido).toBe(false);
    expect(estadoSolicitud(datos({ numDoc: ' 12345678 ', nombre: 'Ana Pérez' }), 10, 700).solicitud).toEqual({
      tipo: 'BOLETA', receptorTipoDoc: '1', receptorNumDoc: '12345678', receptorNombre: 'Ana Pérez',
    });
  });

  it('boleta con documento inválido no se puede enviar', () => {
    expect(estadoSolicitud(datos({ numDoc: '1234', nombre: 'X' }), 10, 700).valido).toBe(false);
  });

  it('factura sin RUC o con RUC inválido no se puede enviar', () => {
    expect(estadoSolicitud(datos({ tipo: 'FACTURA', nombre: 'Empresa' }), 10, 700).valido).toBe(false);
    expect(estadoSolicitud(datos({ tipo: 'FACTURA', numDoc: '30123456789', nombre: 'Empresa' }), 10, 700).valido).toBe(false);
    expect(estadoSolicitud(datos({ tipo: 'FACTURA', numDoc: '20123456789' }), 10, 700).error).toContain('razón social');
  });

  it('el correo es opcional, se normaliza y si está mal escrito bloquea', () => {
    expect(estadoSolicitud(datos({ email: ' Ana@Correo.COM ' }), 10, 700).solicitud).toEqual({ tipo: 'BOLETA', receptorTipoDoc: '0', receptorEmail: 'ana@correo.com' });
    expect(estadoSolicitud(datos({ email: 'ana@' }), 10, 700).valido).toBe(false);
    expect(estadoSolicitud(datos({ email: '' }), 10, 700).solicitud).toEqual({ tipo: 'BOLETA', receptorTipoDoc: '0' });
  });

  it('factura válida envía RUC, razón social y dirección', () => {
    expect(estadoSolicitud(datos({ tipo: 'FACTURA', numDoc: '20123456789', nombre: 'Empresa SAC', direccion: 'Av. 1' }), 10, 700).solicitud)
      .toEqual({ tipo: 'FACTURA', receptorTipoDoc: '6', receptorNumDoc: '20123456789', receptorNombre: 'Empresa SAC', receptorDireccion: 'Av. 1' });
  });
});

describe('textoQr', () => {
  const base = {
    rucEmisor: '20471380904', tipoSunat: '03', serie: 'B001', numero: 7, igv: 18, total: 118,
    fecha: '2026-11-10T12:30:00', receptorTipoDoc: '1', receptorNumDoc: '12345678', hash: 'abc=',
  } as unknown as Comprobante;

  it('arma el formato SUNAT con dos decimales y fecha corta', () => {
    expect(textoQr(base)).toBe('20471380904|03|B001|7|18.00|118.00|2026-11-10|1|12345678|abc=');
  });

  it('sin documento deja el campo vacío y sin hash no hay QR', () => {
    expect(textoQr({ ...base, receptorTipoDoc: '0', receptorNumDoc: null })).toBe('20471380904|03|B001|7|18.00|118.00|2026-11-10|0||abc=');
    expect(textoQr({ ...base, hash: null })).toBeNull();
  });
});
