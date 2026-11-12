import { Routes } from '@angular/router';
import { PlanForm } from './pages/plan-form/plan-form';
import { PlanList } from './pages/plan-list/plan-list';

// La ruta padre exige PLAN_GESTIONAR.
export const PLANES_ROUTES: Routes = [
  { path: '', component: PlanList, title: 'Planes' },
  { path: 'nuevo', component: PlanForm, title: 'Nuevo plan' },
  { path: ':id/editar', component: PlanForm, title: 'Editar plan' },
];
