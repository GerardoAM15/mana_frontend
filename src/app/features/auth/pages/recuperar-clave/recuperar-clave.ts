import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-recuperar-clave',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-clave.html',
  styleUrl: './recuperar-clave.css',
})
export class RecuperarClave {
  private readonly auth = inject(AuthService);

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = inject(NonNullableFormBuilder).group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    this.auth.recuperar({ correo: this.form.getRawValue().correo.trim() }).subscribe({
      // El backend responde 200 exista o no el correo; el mensaje es siempre el mismo.
      next: () => {
        this.enviado.set(true);
        this.enviando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
        this.enviando.set(false);
      },
    });
  }
}
