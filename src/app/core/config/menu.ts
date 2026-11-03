export interface MenuItem {
  etiqueta: string;
  ruta: string;
  icono: string;
  permiso?: string;
}

// Cada ítem se muestra solo si el usuario tiene su permiso (docs/ENDPOINTS.md).
export const MENU: MenuItem[] = [
  { etiqueta: 'Inicio', ruta: '/inicio', icono: '⌂' },
  { etiqueta: 'Mostrador', ruta: '/mostrador', icono: '🍽', permiso: 'CONSUMO_REGISTRAR' },
  { etiqueta: 'Punto de venta', ruta: '/pos', icono: '🛒', permiso: 'VENTA_REGISTRAR' },
  { etiqueta: 'Ventas', ruta: '/ventas', icono: '🧾', permiso: 'VENTA_REGISTRAR' },
  { etiqueta: 'Caja', ruta: '/caja', icono: '💰', permiso: 'CAJA_OPERAR' },
  { etiqueta: 'Clientes', ruta: '/clientes', icono: '👤', permiso: 'CLIENTE_LEER' },
  { etiqueta: 'Contratos', ruta: '/contratos', icono: '📄', permiso: 'CONTRATO_LEER' },
  { etiqueta: 'Menú', ruta: '/menu', icono: '📋', permiso: 'MENU_LEER' },
  { etiqueta: 'Planes', ruta: '/planes', icono: '🗂', permiso: 'PLAN_GESTIONAR' },
  { etiqueta: 'Calendario', ruta: '/calendario', icono: '📅', permiso: 'CALENDARIO_GESTIONAR' },
  { etiqueta: 'Inventario', ruta: '/inventario', icono: '🥤', permiso: 'INVENTARIO_GESTIONAR' },
  { etiqueta: 'Gastos', ruta: '/gastos', icono: '💸', permiso: 'GASTO_GESTIONAR' },
  { etiqueta: 'Reportes', ruta: '/reportes', icono: '📊', permiso: 'REPORTE_VER' },
  { etiqueta: 'Usuarios', ruta: '/usuarios', icono: '🔑', permiso: 'USUARIO_GESTIONAR' },
  { etiqueta: 'Locales', ruta: '/locales', icono: '🏠', permiso: 'LOCAL_GESTIONAR' },
];
