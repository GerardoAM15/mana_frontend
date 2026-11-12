import { Routes } from '@angular/router';
import { DiaNoAtencionList } from './pages/dia-no-atencion-list/dia-no-atencion-list';

// La ruta padre exige CALENDARIO_GESTIONAR.
export const CALENDARIO_ROUTES: Routes = [
  { path: '', component: DiaNoAtencionList, title: 'Calendario de atención' },
];
