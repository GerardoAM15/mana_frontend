import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { invitadoGuard } from './core/guards/invitado.guard';
import { permisoGuard } from './core/guards/permiso.guard';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  // Pantallas públicas, fuera del layout: no muestran header ni menú.
  {
    path: 'login',
    title: 'Iniciar sesión',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/pages/login/login').then(m => m.Login),
  },
  {
    path: 'recuperar',
    title: 'Recuperar contraseña',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/pages/recuperar-clave/recuperar-clave').then(m => m.RecuperarClave),
  },
  {
    path: 'restablecer',
    title: 'Restablecer contraseña',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/pages/restablecer-clave/restablecer-clave').then(m => m.RestablecerClave),
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio',
        loadComponent: () => import('./features/inicio/inicio').then(m => m.Inicio),
      },
      {
        path: 'caja',
        canActivate: [permisoGuard],
        data: { permiso: 'CAJA_OPERAR' },
        loadChildren: () => import('./features/caja/caja.routes').then(m => m.CAJA_ROUTES),
      },
      {
        path: 'acceso-denegado',
        title: 'Acceso denegado',
        loadComponent: () => import('./shared/pages/acceso-denegado/acceso-denegado').then(m => m.AccesoDenegado),
      },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada',
    loadComponent: () => import('./shared/pages/no-encontrado/no-encontrado').then(m => m.NoEncontrado),
  },
];
