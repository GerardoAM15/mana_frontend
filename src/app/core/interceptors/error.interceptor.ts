import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

// 401 = sin token, token alterado o vencido: se cierra la sesión y se vuelve al login con returnUrl.
// 403 = autenticado pero sin permiso: NO se cierra la sesión; el componente muestra el mensaje.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // El 401 del login es "credenciales inválidas" y lo muestra el formulario de login.
      if (err.status === 401 && !req.url.endsWith('/auth/login')) {
        auth.cerrarSesion(router.url);
      }
      return throwError(() => err);
    }),
  );
};
