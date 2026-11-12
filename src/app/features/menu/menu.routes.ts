import { Routes } from '@angular/router';
import { permisoGuard } from '../../core/guards/permiso.guard';
import { MenuSemana } from './pages/menu-semana/menu-semana';
import { PlatoForm } from './pages/plato-form/plato-form';
import { PlatoList } from './pages/plato-list/plato-list';
import { Precios } from './pages/precios/precios';
import { ReglaCobroForm } from './pages/regla-cobro-form/regla-cobro-form';

// La ruta padre exige MENU_LEER; crear y editar exigen MENU_GESTIONAR.
const gestionar = { canActivate: [permisoGuard], data: { permiso: 'MENU_GESTIONAR' } };

export const MENU_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'programacion' },
  { path: 'programacion', component: MenuSemana, title: 'Programación semanal' },
  { path: 'platos', component: PlatoList, title: 'Banco de platos' },
  { path: 'platos/nuevo', component: PlatoForm, title: 'Nuevo plato', ...gestionar },
  { path: 'platos/:id/editar', component: PlatoForm, title: 'Editar plato', ...gestionar },
  { path: 'precios', component: Precios, title: 'Precios' },
  { path: 'reglas/nueva', component: ReglaCobroForm, title: 'Nuevo menú público', ...gestionar },
  { path: 'reglas/:id/editar', component: ReglaCobroForm, title: 'Editar menú público', ...gestionar },
];
