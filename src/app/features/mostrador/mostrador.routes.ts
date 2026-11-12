import { Routes } from '@angular/router';
import { Mostrador } from './pages/mostrador/mostrador';

// La ruta padre exige CONSUMO_REGISTRAR.
export const MOSTRADOR_ROUTES: Routes = [
  { path: '', component: Mostrador, title: 'Mostrador de pensionistas' },
];
