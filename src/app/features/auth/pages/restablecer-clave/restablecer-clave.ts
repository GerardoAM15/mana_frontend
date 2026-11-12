import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';

function clavesIguales(grupo: AbstractControl): ValidationErrors | null {
  const { nuevaClave, confirmacion } = grupo.value as { nuevaClave: string; confirmacion: string };
  return nuevaClave === confirmacion ? null : { distintas: true };
}

@Component({
  selector: 'app-restablecer-clave',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './restablecer-clave.html',
  styleUrl: './restablecer-clave.css',
})
export class RestablecerClave {
  private readonly auth = inject(AuthService);

  // /restablecer?token=... (enlace del correo).
  readonly token = input<string>();

  protected readonly enviando = signal(false);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      nuevaClave: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacion: ['', Validators.required],
    },
    { validators: clavesIguales },
  );

  guardar(): void {
    const token = this.token();
    if (!token) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    this.auth.restablecer({ token, nuevaClave: this.form.getRawValue().nuevaClave }).subscribe({
      next: respuesta => {
        this.mensaje.set(respuesta.mensaje || 'Su contraseña fue actualizada.');
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
