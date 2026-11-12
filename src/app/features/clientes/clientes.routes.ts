import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso.guard';
import { ClienteDetalle } from './pages/cliente-detalle/cliente-detalle';
import { ClienteForm } from './pages/cliente-form/cliente-form';
import { ClienteList } from './pages/cliente-list/cliente-list';

// La ruta padre exige CLIENTE_LEER; crear y editar exigen CLIENTE_ESCRIBIR.
export const CLIENTES_ROUTES: Routes = [
  { path: '', component: ClienteList, title: 'Clientes' },
  {
    path: 'nuevo',
    component: ClienteForm,
    title: 'Nuevo cliente',
    canActivate: [permisoGuard],
    data: { permiso: 'CLIENTE_ESCRIBIR' },
  },
  { path: ':id', component: ClienteDetalle, title: 'Cliente' },
  {
    path: ':id/editar',
    component: ClienteForm,
    title: 'Editar cliente',
    canActivate: [permisoGuard],
    data: { permiso: 'CLIENTE_ESCRIBIR' },
  },
];
