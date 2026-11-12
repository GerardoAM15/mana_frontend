import { Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export const MOTIVO_MIN = 10;
export const MOTIVO_MAX = 250;

// Modal que pide el motivo de anulación (10 a 250 caracteres) antes de confirmar.
// Uso: @if (anulando()) { <app-confirmar-anulacion titulo="..." (confirmar)="anular($event)" (cancelar)="..." /> }
@Component({
  selector: 'app-confirmar-anulacion',
  imports: [ReactiveFormsModule],
  templateUrl: './confirmar-anulacion.html',
  styleUrl: './confirmar-anulacion.css',
})
export class ConfirmarAnulacion {
  readonly titulo = input.required<string>();
  readonly aviso = input('');
  readonly procesando = input(false);
  readonly error = input<string | null>(null);

  readonly confirmar = output<string>();
  readonly cancelar = output<void>();

  protected readonly min = MOTIVO_MIN;
  protected readonly max = MOTIVO_MAX;
  protected readonly motivo = inject(NonNullableFormBuilder).control('', [
    Validators.required,
    Validators.minLength(MOTIVO_MIN),
    Validators.maxLength(MOTIVO_MAX),
  ]);

  enviar(): void {
    const motivo = this.motivo.value.trim();
    if (motivo.length < MOTIVO_MIN || motivo.length > MOTIVO_MAX) {
      this.motivo.markAsTouched();
      return;
    }
    this.confirmar.emit(motivo);
  }

  cerrar(): void {
    if (!this.procesando()) this.cancelar.emit();
  }
}
