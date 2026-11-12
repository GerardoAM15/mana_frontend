import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { permisoGuard } from './permiso.guard';

describe('permisoGuard', () => {
  const permisos = new Set<string>();

  beforeEach(() => {
    permisos.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { tienePermiso: (p?: string) => !p || permisos.has(p) } },
      ],
    });
  });

  const ejecutar = (data: Record<string, unknown>) =>
    TestBed.runInInjectionContext(() =>
      permisoGuard({ data } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  it('deja pasar si el usuario tiene el permiso de data.permiso', () => {
    permisos.add('REPORTE_VER');
    expect(ejecutar({ permiso: 'REPORTE_VER' })).toBe(true);
  });

  it('redirige a /acceso-denegado si no tiene el permiso', () => {
    permisos.add('CAJA_OPERAR');
    const resultado = ejecutar({ permiso: 'REPORTE_VER' });
    expect(resultado).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/acceso-denegado');
  });

  it('deja pasar si la ruta no exige permiso', () => {
    expect(ejecutar({})).toBe(true);
  });
});
