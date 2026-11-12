import { rolesAsignables } from './usuario.model';

describe('rolesAsignables (jerarquía de usuarios)', () => {
  it('el dueño puede asignar cualquier rol', () => {
    expect(rolesAsignables('DUENO')).toEqual(['DUENO', 'ADMINISTRADOR', 'CAJERO']);
  });

  it('el administrador solo puede asignar CAJERO', () => {
    expect(rolesAsignables('ADMINISTRADOR')).toEqual(['CAJERO']);
  });

  it('sin sesión o con otro rol, solo CAJERO', () => {
    expect(rolesAsignables(undefined)).toEqual(['CAJERO']);
    expect(rolesAsignables('CAJERO')).toEqual(['CAJERO']);
  });
});
