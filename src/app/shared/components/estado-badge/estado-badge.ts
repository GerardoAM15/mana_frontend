import { Component, computed, input } from '@angular/core';

// Colores por estado de contrato, venta o caja. Uso: <app-estado-badge [estado]="contrato.estado" />
const TONOS: Record<string, string> = {
  PROGRAMADO: 'info',
  ACTIVO: 'exito',
  FINALIZADO: 'neutro',
  ANULADO: 'peligro',
  PENDIENTE: 'aviso',
  PAGADA: 'exito',
  ANULADA: 'peligro',
  ABIERTA: 'exito',
  CERRADA: 'neutro',
  // Comprobantes electrónicos.
  ACEPTADO: 'exito',
  OBSERVADO: 'aviso',
  RECHAZADO: 'peligro',
  ERROR: 'peligro',
};

const ETIQUETAS: Record<string, string> = {
  PROGRAMADO: 'Programado',
  ACTIVO: 'Activo',
  FINALIZADO: 'Finalizado',
  ANULADO: 'Anulado',
  PENDIENTE: 'Pendiente',
  PAGADA: 'Pagada',
  ANULADA: 'Anulada',
  ABIERTA: 'Abierta',
  CERRADA: 'Cerrada',
  ACEPTADO: 'Aceptado',
  OBSERVADO: 'Observado',
  RECHAZADO: 'Rechazado',
  ERROR: 'Con error',
};

@Component({
  selector: 'app-estado-badge',
  templateUrl: './estado-badge.html',
  styleUrl: './estado-badge.css',
})
export class EstadoBadge {
  readonly estado = input.required<string>();

  protected readonly tono = computed(() => TONOS[this.estado()] ?? 'neutro');
  protected readonly etiqueta = computed(() => ETIQUETAS[this.estado()] ?? this.estado());
}
