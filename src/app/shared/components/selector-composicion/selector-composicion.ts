import { Component, computed, inject, input, model } from '@angular/core';
import { CatalogoService } from '../../../core/services/catalogo-service';
import { cantidadesPorCategoria, Componente, quitarPlato, Seleccion, tocarPlato } from '../../../core/utils/composicion';

export interface PlatoElegible {
  platoId: number;
  nombre: string;
  categoria: string;
}

interface GrupoPlatos {
  categoria: string;
  requerida: number;
  elegida: number;
  platos: PlatoElegible[];
}

// Platos agrupados por categoría según la composición ("Pan: elige 2 (puede repetir)").
// Uso: <app-selector-composicion [componentes]="regla.componentes" [platos]="menu.platos" [(seleccion)]="seleccion" />
@Component({
  selector: 'app-selector-composicion',
  templateUrl: './selector-composicion.html',
  styleUrl: './selector-composicion.css',
})
export class SelectorComposicion {
  protected readonly catalogos = inject(CatalogoService);

  readonly componentes = input.required<Componente[]>();
  readonly platos = input.required<PlatoElegible[]>();
  readonly seleccion = model<Seleccion>({});

  protected readonly grupos = computed<GrupoPlatos[]>(() => {
    const totales = cantidadesPorCategoria(this.seleccion(), this.platos());
    return this.componentes().map(c => ({
      categoria: c.categoria,
      requerida: c.cantidad,
      elegida: totales[c.categoria] ?? 0,
      platos: this.platos().filter(p => p.categoria === c.categoria),
    }));
  });

  tocar(plato: PlatoElegible, grupo: GrupoPlatos): void {
    this.seleccion.update(s => tocarPlato(s, plato, grupo.requerida, this.platos()));
  }

  quitar(plato: PlatoElegible): void {
    this.seleccion.update(s => quitarPlato(s, plato.platoId));
  }

  protected cantidad(plato: PlatoElegible): number {
    return this.seleccion()[plato.platoId] ?? 0;
  }
}
