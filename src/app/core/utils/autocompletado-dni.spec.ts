import { HttpErrorResponse } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ConsultaDni, ConsultaDocumentoService, mensajeConsulta } from '../services/consulta-documento.service';
import { AutocompletadoDni } from './autocompletado-dni';

describe('AutocompletadoDni', () => {
  function crear(respuesta: () => ReturnType<ConsultaDocumentoService['dni']>, edicion = false) {
    const dni = vi.fn(respuesta);
    const controles = {
      dni: new FormControl('', { nonNullable: true }),
      nombre: new FormControl('', { nonNullable: true }),
      apellido: new FormControl('', { nonNullable: true }),
    };
    const servicio = { dni } as unknown as ConsultaDocumentoService;
    const auto = runInInjectionContext(TestBed.inject(Injector), () => new AutocompletadoDni(servicio, controles, () => edicion));
    return { auto, controles, dni };
  }

  const reniec: ConsultaDni = { dni: '12345678', nombre: 'JUAN CARLOS', apellido: 'PEREZ ROJAS', fuente: 'RENIEC', registrado: false };

  it('al escribir 8 dígitos completa nombre y apellido una sola vez', () => {
    const { controles, dni, auto } = crear(() => of(reniec));
    controles.dni.setValue('1234567');
    expect(dni).not.toHaveBeenCalled();
    controles.dni.setValue('12345678');
    controles.dni.setValue('12345678');
    expect(dni).toHaveBeenCalledTimes(1);
    expect(controles.nombre.value).toBe('JUAN CARLOS');
    expect(controles.apellido.value).toBe('PEREZ ROJAS');
    expect(auto.aviso()).toContain('RENIEC');
  });

  it('si la persona ya está registrada avisa y no sobrescribe', () => {
    const { controles, auto } = crear(() => of({ ...reniec, fuente: 'MANA', registrado: true }));
    controles.nombre.setValue('Escrito a mano');
    controles.dni.setValue('12345678');
    expect(controles.nombre.value).toBe('Escrito a mano');
    expect(auto.aviso()).toContain('Ya existe una persona');
  });

  it('al editar no busca automáticamente, solo con el botón', () => {
    const { controles, dni, auto } = crear(() => of(reniec), true);
    controles.dni.setValue('12345678');
    expect(dni).not.toHaveBeenCalled();
    auto.buscar();
    expect(dni).toHaveBeenCalledTimes(1);
  });

  it('si la API no está disponible deja escribir a mano', () => {
    const { controles, auto } = crear(() => throwError(() => new HttpErrorResponse({ status: 503 })));
    controles.dni.setValue('12345678');
    expect(auto.buscando()).toBe(false);
    expect(auto.aviso()).toContain('manualmente');
    expect(controles.nombre.enabled).toBe(true);
  });
});

describe('mensajeConsulta', () => {
  it('usa el mensaje del backend en 404 y uno propio en 429 y 503', () => {
    const conMensaje = (status: number) =>
      new HttpErrorResponse({ status, error: { status, message: 'No se encontró el DNI; ingrese los datos manualmente' } });
    expect(mensajeConsulta(conMensaje(404))).toBe('No se encontró el DNI; ingrese los datos manualmente');
    expect(mensajeConsulta(conMensaje(429))).toContain('espere un minuto');
    expect(mensajeConsulta(conMensaje(503))).toContain('no está disponible');
  });
});
