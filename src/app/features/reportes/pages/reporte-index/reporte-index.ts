import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono, NombreIcono } from '../../../../shared/components/icono/icono';

interface EnlaceReporte {
  ruta: string;
  titulo: string;
  descripcion: string;
  icono: NombreIcono;
}

@Component({
  selector: 'app-reporte-index',
  imports: [RouterLink, Icono],
  templateUrl: './reporte-index.html',
  styleUrl: './reporte-index.css',
})
export class ReporteIndex {
  protected readonly reportes: EnlaceReporte[] = [
    { ruta: 'ingresos-mensuales', titulo: 'Ingresos mensuales', descripcion: 'Cobros netos de contratos y ventas pagadas por mes.', icono: 'caja' },
    { ruta: 'ventas-vs-pensiones', titulo: 'Ventas vs pensiones', descripcion: 'Comparativo de ingresos por venta directa y por pensiones.', icono: 'ventas' },
    { ruta: 'platos-mas-consumidos', titulo: 'Platos más consumidos', descripcion: 'Ranking de platos en consumos no anulados, por servicio.', icono: 'mostrador' },
    { ruta: 'contratos-por-vencer', titulo: 'Contratos por vencer', descripcion: 'Contratos activos que vencen pronto, con su saldo.', icono: 'contratos' },
    { ruta: 'asistencia-diaria', titulo: 'Asistencia diaria', descripcion: 'Consumos de pensionistas por día y servicio.', icono: 'calendario' },
    { ruta: 'gastos-vs-ingresos', titulo: 'Gastos vs ingresos', descripcion: 'Ingresos, gastos y diferencia por día o por mes.', icono: 'gastos' },
  ];
}
