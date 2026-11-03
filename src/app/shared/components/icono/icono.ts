import { Component, input } from '@angular/core';

export type NombreIcono =
  | 'inicio'
  | 'mostrador'
  | 'pos'
  | 'ventas'
  | 'caja'
  | 'clientes'
  | 'contratos'
  | 'menu'
  | 'planes'
  | 'calendario'
  | 'inventario'
  | 'gastos'
  | 'reportes'
  | 'usuarios'
  | 'locales'
  | 'flecha';

// Íconos SVG de línea, monocromos (heredan currentColor) y del mismo tamaño.
// Son decorativos: el texto que los acompaña es el que se lee. Uso: <app-icono nombre="caja" />
@Component({
  selector: 'app-icono',
  templateUrl: './icono.html',
  styleUrl: './icono.css',
})
export class Icono {
  readonly nombre = input.required<NombreIcono>();
  readonly tamano = input(20);
}
