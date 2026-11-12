import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

// Lee el permiso de data.permiso de la ruta. Es experiencia de usuario: el backend igual responde 403.
export const permisoGuard: CanActivateFn = route => {
  const permiso = route.data['permiso'] as string | undefined;
  if (inject(AuthService).tienePermiso(permiso)) return true;
  return inject(Router).createUrlTree(['/acceso-denegado']);
};
