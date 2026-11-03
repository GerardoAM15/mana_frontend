import { grupoDeRuta, gruposVisibles, MENU_GRUPOS } from './menu';

// Permisos por rol según el backend: DUENO tiene todos; ADMINISTRADOR, todos menos LOCAL_GESTIONAR.
const TODOS = [
  'USUARIO_GESTIONAR', 'LOCAL_GESTIONAR', 'CLIENTE_LEER', 'CLIENTE_ESCRIBIR', 'CONTRATO_LEER', 'CONTRATO_REGISTRAR',
  'CONTRATO_ANULAR', 'CONSUMO_REGISTRAR', 'CONSUMO_ANULAR', 'VENTA_REGISTRAR', 'VENTA_ANULAR', 'CAJA_OPERAR',
  'CAJA_SUPERVISAR', 'MENU_GESTIONAR', 'MENU_LEER', 'PLAN_GESTIONAR', 'CALENDARIO_GESTIONAR', 'INVENTARIO_GESTIONAR',
  'GASTO_GESTIONAR', 'REPORTE_VER',
];
const PERMISOS: Record<string, string[]> = {
  DUENO: TODOS,
  ADMINISTRADOR: TODOS.filter(p => p !== 'LOCAL_GESTIONAR'),
  CAJERO: ['CLIENTE_LEER', 'CLIENTE_ESCRIBIR', 'CONTRATO_LEER', 'CONSUMO_REGISTRAR', 'VENTA_REGISTRAR', 'CAJA_OPERAR', 'MENU_LEER'],
};

function menuDe(rol: string): Record<string, string[]> {
  const permisos = new Set(PERMISOS[rol]);
  return Object.fromEntries(
    gruposVisibles(p => !p || permisos.has(p)).map(g => [g.titulo, g.items.map(i => i.etiqueta)]),
  );
}

describe('gruposVisibles', () => {
  it('el dueño ve los 5 grupos con todos sus ítems', () => {
    expect(menuDe('DUENO')).toEqual({
      'Atención diaria': ['Mostrador', 'Punto de venta', 'Ventas', 'Caja'],
      Pensiones: ['Clientes', 'Contratos'],
      'Cocina y precios': ['Menú', 'Planes', 'Calendario'],
      'Almacén y gastos': ['Inventario', 'Gastos'],
      Gestión: ['Reportes', 'Usuarios', 'Locales'],
    });
  });

  it('el administrador ve todo menos Locales', () => {
    expect(menuDe('ADMINISTRADOR')).toEqual({
      'Atención diaria': ['Mostrador', 'Punto de venta', 'Ventas', 'Caja'],
      Pensiones: ['Clientes', 'Contratos'],
      'Cocina y precios': ['Menú', 'Planes', 'Calendario'],
      'Almacén y gastos': ['Inventario', 'Gastos'],
      Gestión: ['Reportes', 'Usuarios'],
    });
  });

  it('el cajero no ve los grupos Almacén y gastos ni Gestión', () => {
    expect(menuDe('CAJERO')).toEqual({
      'Atención diaria': ['Mostrador', 'Punto de venta', 'Ventas', 'Caja'],
      Pensiones: ['Clientes', 'Contratos'],
      'Cocina y precios': ['Menú'],
    });
  });

  it('no modifica la configuración original', () => {
    gruposVisibles(() => false);
    expect(MENU_GRUPOS.flatMap(g => g.items).length).toBe(14);
  });
});

describe('grupoDeRuta', () => {
  it('encuentra el grupo por prefijo de ruta', () => {
    expect(grupoDeRuta('/contratos/75')).toBe('pensiones');
    expect(grupoDeRuta('/inventario/kardex?bebidaId=1')).toBe('almacen');
    expect(grupoDeRuta('/caja')).toBe('atencion');
    expect(grupoDeRuta('/reportes/asistencia-diaria')).toBe('gestion');
  });

  it('no confunde rutas con prefijo parecido y devuelve null fuera de los grupos', () => {
    expect(grupoDeRuta('/menu-otro')).toBeNull();
    expect(grupoDeRuta('/inicio')).toBeNull();
  });
});
