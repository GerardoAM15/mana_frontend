import { Component, input, output } from '@angular/core';

// Modal de confirmación genérico. El contenido proyectado se muestra como resumen de lo que se confirma.
// Uso: @if (abierto()) { <app-confirmar-dialogo titulo="..." (confirmar)="..." (cancelar)="..."> ... </app-confirmar-dialogo> }
@Component({
  selector: 'app-confirmar-dialogo',
  templateUrl: './confirmar-dialogo.html',
  styleUrl: './confirmar-dialogo.css',
})
export class ConfirmarDialogo {
  readonly titulo = input.required<string>();
  readonly mensaje = input('');
  readonly textoConfirmar = input('Confirmar');
  readonly textoProcesando = input('Procesando...');
  readonly peligro = input(false);
  readonly procesando = input(false);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  cerrar(): void {
    if (!this.procesando()) this.cancelar.emit();
  }
}
