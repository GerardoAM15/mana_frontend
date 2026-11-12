import { Routes } from '@angular/router';
import { VentaDetalle } from './pages/venta-detalle/venta-detalle';
import { VentaList } from './pages/venta-list/venta-list';

// La ruta padre exige VENTA_REGISTRAR; anular exige VENTA_ANULAR (botón con *siPermiso).
export const VENTAS_ROUTES: Routes = [
  { path: '', component: VentaList, title: 'Ventas' },
  { path: ':id', component: VentaDetalle, title: 'Venta' },
];
