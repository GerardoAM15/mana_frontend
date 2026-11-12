import { Routes } from '@angular/router';
import { ComprobanteList } from './pages/comprobante-list/comprobante-list';

// La ruta padre exige COMPROBANTE_GESTIONAR.
export const COMPROBANTES_ROUTES: Routes = [{ path: '', component: ComprobanteList, title: 'Comprobantes' }];
