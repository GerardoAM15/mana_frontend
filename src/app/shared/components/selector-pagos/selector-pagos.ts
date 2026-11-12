import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogoService } from '../../../core/services/catalogo-service';
import { redondear } from '../../../core/utils/numeros';
import { EstadoPagos, estadoPagos, FilaPago } from '../../../core/utils/pagos';

// Filas método + monto + referencia. Recibe el total y emite los pagos y si son válidos (suma exacta).
// Uso: <app-selector-pagos [total]="total()" (cambio)="pagos.set($event)" />
@Component({
  selector: 'app-selector-pagos',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './selector-pagos.html',
  styleUrl: './selector-pagos.css',
})
export class SelectorPagos {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly catalogos = inject(CatalogoService);

  readonly total = input.required<number>();
  readonly deshabilitado = input(false);
  readonly cambio = output<EstadoPagos>();

  protected readonly filas = this.fb.array([this.nuevaFila()]);
  private readonly valores = signal<FilaPago[]>(this.filas.getRawValue());

  protected readonly estado = computed(() => estadoPagos(this.valores(), this.total()));
  protected readonly diferencia = computed(() => redondear(this.total() - this.estado().pagado));

  constructor() {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.filas.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.valores.set(this.filas.getRawValue()));

    // Con una sola fila, el monto sigue al total (lo más común: un solo método de pago).
    effect(() => {
      const total = this.total();
      untracked(() => {
        if (this.filas.length === 1) this.filas.at(0).controls.monto.setValue(total > 0 ? total : null);
      });
    });

    effect(() => this.cambio.emit(this.estado()));

    effect(() => {
      if (this.deshabilitado()) this.filas.disable({ emitEvent: false });
      else this.filas.enable({ emitEvent: false });
    });
  }

  agregar(): void {
    const falta = this.diferencia();
    const fila = this.nuevaFila();
    fila.controls.monto.setValue(falta > 0 ? falta : null);
    this.filas.push(fila);
  }

  quitar(indice: number): void {
    if (this.filas.length > 1) this.filas.removeAt(indice);
  }

  // Vuelve a una sola fila (por ejemplo, después de registrar).
  reiniciar(): void {
    this.filas.clear();
    const fila = this.nuevaFila();
    fila.controls.monto.setValue(this.total() > 0 ? this.total() : null);
    this.filas.push(fila);
  }

  private nuevaFila() {
    const metodo = this.catalogos?.metodosPago().find(m => m.codigo === 'EFECTIVO')?.codigo ?? 'EFECTIVO';
    return this.fb.group({
      metodo: [metodo, Validators.required],
      monto: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
      referencia: ['', Validators.maxLength(160)],
    });
  }
}
