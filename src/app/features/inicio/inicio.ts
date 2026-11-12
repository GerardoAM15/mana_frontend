import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CajaEstadoService } from '../../core/services/caja-estado.service';
import { hoy } from '../../core/utils/fechas';
import { Icono, NombreIcono } from '../../shared/components/icono/icono';
import { ReporteService } from '../reportes/services/reporte-service';

interface AccesoRapido {
  titulo: string;
  descripcion: string;
  ruta: string;
  icono: NombreIcono;
  permiso: string;
}

interface Indicadores {
  consumos: number;
  ventas: number;
  porVencer: number;
}

const ACCESOS: AccesoRapido[] = [
  { titulo: 'Mostrador', descripcion: 'Registrar consumos de pensionistas', ruta: '/mostrador', icono: 'mostrador', permiso: 'CONSUMO_REGISTRAR' },
  { titulo: 'Punto de venta', descripcion: 'Vender menús, sueltos y bebidas', ruta: '/pos', icono: 'pos', permiso: 'VENTA_REGISTRAR' },
  { titulo: 'Caja', descripcion: 'Abrir, revisar y cerrar su caja', ruta: '/caja', icono: 'caja', permiso: 'CAJA_OPERAR' },
  { titulo: 'Nuevo contrato', descripcion: 'Registrar una pensión prepago', ruta: '/contratos/nuevo', icono: 'contratos', permiso: 'CONTRATO_REGISTRAR' },
];

@Component({
  selector: 'app-inicio',
  imports: [CurrencyPipe, DatePipe, RouterLink, Icono],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly reporteService = inject(ReporteService);
  protected readonly cajaEstado = inject(CajaEstadoService);

  protected readonly fecha = hoy();
  protected readonly usuario = this.auth.usuario;
  protected readonly accesos = computed(() => ACCESOS.filter(a => this.auth.tienePermiso(a.permiso)));
  protected readonly operaCaja = computed(() => this.auth.tienePermiso('CAJA_OPERAR'));
  protected readonly veReportes = this.auth.tienePermiso('REPORTE_VER');
  protected readonly indicadores = signal<Indicadores | null>(null);

  // Indicadores del día (solo con REPORTE_VER): consumos y ventas de hoy y contratos que vencen en 3 días.
  ngOnInit(): void {
    if (!this.veReportes) return;
    const filtro = { desde: this.fecha, hasta: this.fecha, localId: null };
    forkJoin([
      this.reporteService.asistenciaDiaria(filtro),
      this.reporteService.ventasVsPensiones(filtro),
      this.reporteService.contratosPorVencer(3),
    ]).subscribe({
      next: ([asistencia, ingresos, porVencer]) =>
        this.indicadores.set({
          consumos: asistencia.reduce((t, a) => t + a.consumos, 0),
          ventas: ingresos.reduce((t, i) => t + i.ventas, 0),
          porVencer: new Set(porVencer.map(c => c.contratoId)).size,
        }),
      error: () => this.indicadores.set(null),
    });
  }
}
