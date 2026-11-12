import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const cerrarSesion = vi.fn();

  beforeEach(() => {
    cerrarSesion.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { cerrarSesion } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  function responder(url: string, status: number): number | undefined {
    let recibido: number | undefined;
    http.get(url).subscribe({ error: err => (recibido = err.status) });
    backend.expectOne(url).flush({ message: 'error' }, { status, statusText: 'Error' });
    return recibido;
  }

  it('con 401 cierra la sesión y propaga el error', () => {
    expect(responder('/api/v1/clientes', 401)).toBe(401);
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('con 403 NO cierra la sesión (el componente muestra el mensaje)', () => {
    expect(responder('/api/v1/reportes/ingresos-mensuales', 403)).toBe(403);
    expect(cerrarSesion).not.toHaveBeenCalled();
  });

  it('el 401 del propio login no cierra sesión (son credenciales inválidas)', () => {
    let recibido: number | undefined;
    http.post('/api/v1/auth/login', {}).subscribe({ error: err => (recibido = err.status) });
    backend.expectOne('/api/v1/auth/login').flush({ message: 'Credenciales invalidas' }, { status: 401, statusText: 'Unauthorized' });
    expect(recibido).toBe(401);
    expect(cerrarSesion).not.toHaveBeenCalled();
  });

  it('con 429 (demasiados intentos) NO cierra la sesión y propaga el error', () => {
    expect(responder('/api/v1/ventas', 429)).toBe(429);
    expect(cerrarSesion).not.toHaveBeenCalled();
  });

  it('otros errores (409, 500) pasan sin cerrar sesión', () => {
    expect(responder('/api/v1/ventas', 409)).toBe(409);
    expect(responder('/api/v1/ventas', 500)).toBe(500);
    expect(cerrarSesion).not.toHaveBeenCalled();
  });
});
