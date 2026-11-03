import { Routes } from '@angular/router';
import { BebidaForm } from './pages/bebida-form/bebida-form';
import { BebidaList } from './pages/bebida-list/bebida-list';
import { CompraDetalle } from './pages/compra-detalle/compra-detalle';
import { CompraForm } from './pages/compra-form/compra-form';
import { CompraList } from './pages/compra-list/compra-list';
import { MovimientoList } from './pages/movimiento-list/movimiento-list';
import { ProveedorForm } from './pages/proveedor-form/proveedor-form';
import { ProveedorList } from './pages/proveedor-list/proveedor-list';
import { StockList } from './pages/stock-list/stock-list';

// La ruta padre exige INVENTARIO_GESTIONAR.
export const INVENTARIO_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'stock' },
  { path: 'stock', component: StockList, title: 'Stock de bebidas' },
  { path: 'kardex', component: MovimientoList, title: 'Kardex' },
  { path: 'bebidas', component: BebidaList, title: 'Bebidas' },
  { path: 'bebidas/nueva', component: BebidaForm, title: 'Nueva bebida' },
  { path: 'bebidas/:id/editar', component: BebidaForm, title: 'Editar bebida' },
  { path: 'proveedores', component: ProveedorList, title: 'Proveedores' },
  { path: 'proveedores/nuevo', component: ProveedorForm, title: 'Nuevo proveedor' },
  { path: 'proveedores/:id/editar', component: ProveedorForm, title: 'Editar proveedor' },
  { path: 'compras', component: CompraList, title: 'Compras de bebidas' },
  { path: 'compras/nueva', component: CompraForm, title: 'Nueva compra' },
  { path: 'compras/:id', component: CompraDetalle, title: 'Compra' },
];
