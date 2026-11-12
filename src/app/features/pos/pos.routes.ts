import { Routes } from '@angular/router';
import { PuntoVenta } from './pages/punto-venta/punto-venta';

// La ruta padre exige VENTA_REGISTRAR.
export const POS_ROUTES: Routes = [
  { path: '', component: PuntoVenta, title: 'Punto de venta' },
];
