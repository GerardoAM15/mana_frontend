import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export interface Serie {
  nombre: string;
  // Clase de color: primario, acento, exito, peligro, info.
  tono: string;
}

export interface FilaBarras {
  etiqueta: string;
  valores: number[];
}

// Barras horizontales comparativas hechas con CSS (sin librerías de gráficos).
// Cada fila tiene un valor por serie; el ancho es proporcional al máximo del reporte.
@Component({
  selector: 'app-barras',
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './barras.html',
  styleUrl: './barras.css',
})
export class Barras {
  readonly series = input.required<Serie[]>();
  readonly filas = input.required<FilaBarras[]>();
  readonly moneda = input(false);

  protected readonly maximo = computed(() => Math.max(1, ...this.filas().flatMap(f => f.valores.map(v => Math.abs(v)))));

  protected ancho(valor: number): number {
    return Math.max(valor === 0 ? 0 : 1, (Math.abs(valor) / this.maximo()) * 100);
  }
}
