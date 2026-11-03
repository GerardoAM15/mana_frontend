import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso.guard';
import { ContratoDetalle } from './pages/contrato-detalle/contrato-detalle';
import { ContratoForm } from './pages/contrato-form/contrato-form';
import { ContratoList } from './pages/contrato-list/contrato-list';

// La ruta padre exige CONTRATO_LEER; registrar y renovar exigen CONTRATO_REGISTRAR.
export const CONTRATOS_ROUTES: Routes = [
  { path: '', component: ContratoList, title: 'Contratos' },
  {
    path: 'nuevo',
    component: ContratoForm,
    title: 'Nuevo contrato',
    canActivate: [permisoGuard],
    data: { permiso: 'CONTRATO_REGISTRAR' },
  },
  { path: ':id', component: ContratoDetalle, title: 'Contrato' },
  {
    path: ':id/renovar',
    component: ContratoForm,
    title: 'Renovar contrato',
    canActivate: [permisoGuard],
    data: { permiso: 'CONTRATO_REGISTRAR' },
  },
];
