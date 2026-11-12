import { Routes } from '@angular/router';
import { LocalForm } from './pages/local-form/local-form';
import { LocalList } from './pages/local-list/local-list';

// La ruta padre exige LOCAL_GESTIONAR (solo ADMINISTRADOR).
export const LOCALES_ROUTES: Routes = [
  { path: '', component: LocalList, title: 'Locales' },
  { path: 'nuevo', component: LocalForm, title: 'Nuevo local' },
  { path: ':id/editar', component: LocalForm, title: 'Editar local' },
];
