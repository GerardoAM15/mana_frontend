import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso.guard';
import { CajaActual } from './pages/caja-actual/caja-actual';
import { CajaCerrar } from './pages/caja-cerrar/caja-cerrar';
import { CajaDetalle } from './pages/caja-detalle/caja-detalle';
import { CajaList } from './pages/caja-list/caja-list';

// La ruta padre ya exige CAJA_OPERAR; el historial de todas las cajas exige CAJA_SUPERVISAR.
export const CAJA_ROUTES: Routes = [
  { path: '', component: CajaActual, title: 'Mi caja' },
  { path: 'cerrar', component: CajaCerrar, title: 'Cerrar caja' },
  {
    path: 'historial',
    component: CajaList,
    title: 'Historial de cajas',
    canActivate: [permisoGuard],
    data: { permiso: 'CAJA_SUPERVISAR' },
  },
  { path: ':id', component: CajaDetalle, title: 'Arqueo de caja' },
];
