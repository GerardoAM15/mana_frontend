import { Routes } from '@angular/router';
import { UsuarioForm } from './pages/usuario-form/usuario-form';
import { UsuarioList } from './pages/usuario-list/usuario-list';

// La ruta padre exige USUARIO_GESTIONAR (solo ADMINISTRADOR).
export const USUARIOS_ROUTES: Routes = [
  { path: '', component: UsuarioList, title: 'Usuarios' },
  { path: 'nuevo', component: UsuarioForm, title: 'Nuevo usuario' },
  { path: ':id/editar', component: UsuarioForm, title: 'Editar usuario' },
];
