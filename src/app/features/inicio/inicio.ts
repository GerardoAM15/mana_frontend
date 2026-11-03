import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CajaEstadoService } from '../../core/services/caja-estado.service';
import { hoy } from '../../core/utils/fechas';

interface AccesoRapido {
  titulo: string;
  descripcion: string;
  ruta: string;
  icono: string;
  permiso: string;
}

const ACCESOS: AccesoRapido[] = [
  { titulo: 'Mostrador', descripcion: 'Registrar consumos de pensionistas', ruta: '/mostrador', icono: '🍽', permiso: 'CONSUMO_REGISTRAR' },
  { titulo: 'Punto de venta', descripcion: 'Vender menús, sueltos y bebidas', ruta: '/pos', icono: '🛒', permiso: 'VENTA_REGISTRAR' },
  { titulo: 'Caja', descripcion: 'Abrir, revisar y cerrar su caja', ruta: '/caja', icono: '💰', permiso: 'CAJA_OPERAR' },
  { titulo: 'Nuevo contrato', descripcion: 'Registrar una pensión prepago', ruta: '/contratos/nuevo', icono: '📄', permiso: 'CONTRATO_REGISTRAR' },
];

@Component({
  selector: 'app-inicio',
  imports: [DatePipe, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private readonly auth = inject(AuthService);
  protected readonly cajaEstado = inject(CajaEstadoService);

  protected readonly fecha = hoy();
  protected readonly usuario = this.auth.usuario;
  protected readonly accesos = computed(() => ACCESOS.filter(a => this.auth.tienePermiso(a.permiso)));
  protected readonly operaCaja = computed(() => this.auth.tienePermiso('CAJA_OPERAR'));
}
