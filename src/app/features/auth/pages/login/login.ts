import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // ?returnUrl= que dejan el authGuard o el interceptor de 401.
  readonly returnUrl = input<string>();

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verClave = signal(false);
  protected readonly form = inject(NonNullableFormBuilder).group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    clave: ['', [Validators.required, Validators.maxLength(72)]],
  });

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    this.enviando.set(true);
    this.error.set(null);
    this.auth.login({ correo: valores.correo.trim(), clave: valores.clave }).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl() || '/inicio'),
      error: (err: HttpErrorResponse) => {
        // El backend devuelve el mismo 401 para correo inexistente, clave errada o cuenta inactiva.
        this.error.set(mensajeError(err));
        this.enviando.set(false);
      },
    });
  }
}
