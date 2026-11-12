import { Routes } from '@angular/router';
import { GastoForm } from './pages/gasto-form/gasto-form';
import { GastoList } from './pages/gasto-list/gasto-list';

// La ruta padre exige GASTO_GESTIONAR.
export const GASTOS_ROUTES: Routes = [
  { path: '', component: GastoList, title: 'Gastos diarios' },
  { path: 'nuevo', component: GastoForm, title: 'Nuevo gasto' },
  { path: ':id/editar', component: GastoForm, title: 'Editar gasto' },
];
