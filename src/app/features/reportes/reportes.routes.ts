import { Routes } from '@angular/router';
import { ReporteAsistencia } from './pages/reporte-asistencia/reporte-asistencia';
import { ReporteGastosIngresos } from './pages/reporte-gastos-ingresos/reporte-gastos-ingresos';
import { ReporteIndex } from './pages/reporte-index/reporte-index';
import { ReporteIngresos } from './pages/reporte-ingresos/reporte-ingresos';
import { ReportePlatos } from './pages/reporte-platos/reporte-platos';
import { ReportePorVencer } from './pages/reporte-por-vencer/reporte-por-vencer';
import { ReporteVentasPensiones } from './pages/reporte-ventas-pensiones/reporte-ventas-pensiones';

// La ruta padre exige REPORTE_VER (contratos-por-vencer además exige CONTRATO_LEER en el backend).
export const REPORTES_ROUTES: Routes = [
  { path: '', component: ReporteIndex, title: 'Reportes' },
  { path: 'ingresos-mensuales', component: ReporteIngresos, title: 'Ingresos mensuales' },
  { path: 'ventas-vs-pensiones', component: ReporteVentasPensiones, title: 'Ventas vs pensiones' },
  { path: 'platos-mas-consumidos', component: ReportePlatos, title: 'Platos más consumidos' },
  { path: 'contratos-por-vencer', component: ReportePorVencer, title: 'Contratos por vencer' },
  { path: 'asistencia-diaria', component: ReporteAsistencia, title: 'Asistencia diaria' },
  { path: 'gastos-vs-ingresos', component: ReporteGastosIngresos, title: 'Gastos vs ingresos' },
];
