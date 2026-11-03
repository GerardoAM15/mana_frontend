import { NombreIcono } from '../../shared/components/icono/icono';

export interface MenuItem {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
  permiso?: string;
}

export interface MenuGrupo {
  id: string;
  titulo: string;
  items: MenuItem[];
}

// Ítem suelto, siempre visible y fuera de los grupos.
export const MENU_INICIO: MenuItem = { etiqueta: 'Inicio', ruta: '/inicio', icono: 'inicio' };

// Grupo abierto por defecto (además del que contiene la ruta actual).
export const GRUPO_POR_DEFECTO = 'atencion';

// Cada ítem se muestra solo si el usuario tiene su permiso (docs/ENDPOINTS.md).
export const MENU_GRUPOS: MenuGrupo[] = [
  {
    id: 'atencion',
    titulo: 'Atención diaria',
    items: [
      { etiqueta: 'Mostrador', ruta: '/mostrador', icono: 'mostrador', permiso: 'CONSUMO_REGISTRAR' },
      { etiqueta: 'Punto de venta', ruta: '/pos', icono: 'pos', permiso: 'VENTA_REGISTRAR' },
      { etiqueta: 'Ventas', ruta: '/ventas', icono: 'ventas', permiso: 'VENTA_REGISTRAR' },
      { etiqueta: 'Caja', ruta: '/caja', icono: 'caja', permiso: 'CAJA_OPERAR' },
    ],
  },
  {
    id: 'pensiones',
    titulo: 'Pensiones',
    items: [
      { etiqueta: 'Clientes', ruta: '/clientes', icono: 'clientes', permiso: 'CLIENTE_LEER' },
      { etiqueta: 'Contratos', ruta: '/contratos', icono: 'contratos', permiso: 'CONTRATO_LEER' },
    ],
  },
  {
    id: 'cocina',
    titulo: 'Cocina y precios',
    items: [
      { etiqueta: 'Menú', ruta: '/menu', icono: 'menu', permiso: 'MENU_LEER' },
      { etiqueta: 'Planes', ruta: '/planes', icono: 'planes', permiso: 'PLAN_GESTIONAR' },
      { etiqueta: 'Calendario', ruta: '/calendario', icono: 'calendario', permiso: 'CALENDARIO_GESTIONAR' },
    ],
  },
  {
    id: 'almacen',
    titulo: 'Almacén y gastos',
    items: [
      { etiqueta: 'Inventario', ruta: '/inventario', icono: 'inventario', permiso: 'INVENTARIO_GESTIONAR' },
      { etiqueta: 'Gastos', ruta: '/gastos', icono: 'gastos', permiso: 'GASTO_GESTIONAR' },
    ],
  },
  {
    id: 'gestion',
    titulo: 'Gestión',
    items: [
      { etiqueta: 'Reportes', ruta: '/reportes', icono: 'reportes', permiso: 'REPORTE_VER' },
      { etiqueta: 'Usuarios', ruta: '/usuarios', icono: 'usuarios', permiso: 'USUARIO_GESTIONAR' },
      { etiqueta: 'Locales', ruta: '/locales', icono: 'locales', permiso: 'LOCAL_GESTIONAR' },
    ],
  },
];

// Grupos visibles para el usuario: filtra los ítems por permiso y oculta los grupos que quedan vacíos.
export function gruposVisibles(tienePermiso: (permiso?: string) => boolean, grupos = MENU_GRUPOS): MenuGrupo[] {
  return grupos
    .map(g => ({ ...g, items: g.items.filter(item => tienePermiso(item.permiso)) }))
    .filter(g => g.items.length > 0);
}

// Grupo que contiene la ruta (por prefijo: /contratos/5 pertenece a Pensiones).
export function grupoDeRuta(url: string, grupos = MENU_GRUPOS): string | null {
  const ruta = url.split(/[?#]/)[0];
  return grupos.find(g => g.items.some(i => ruta === i.ruta || ruta.startsWith(i.ruta + '/')))?.id ?? null;
}
