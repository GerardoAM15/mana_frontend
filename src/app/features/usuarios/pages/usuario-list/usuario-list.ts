import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { coincide } from '../../../../core/utils/texto';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { Rol, rolesAsignables, Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario-service';

@Component({
  selector: 'app-usuario-list',
  imports: [RouterLink, ConfirmarDialogo],
  templateUrl: './usuario-list.html',
  styleUrl: './usuario-list.css',
})
export class UsuarioList implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  protected readonly catalogos = inject(CatalogoService);
  private readonly sesion = inject(AuthService).usuario();
  protected readonly yo = this.sesion?.usuarioId ?? null;
  // El ADMINISTRADOR solo puede asignar CAJERO; el DUENO, cualquier rol.
  protected readonly roles = rolesAsignables(this.sesion?.rol);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly texto = signal('');
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly procesando = signal(false);
  protected readonly porDesactivar = signal<Usuario | null>(null);
  protected readonly cambiandoRol = signal<Usuario | null>(null);
  protected readonly rolNuevo = signal<Rol>('CAJERO');

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listar().subscribe({
      next: usuarios => {
        this.usuarios.set(usuarios.sort((a, b) => a.apellido.localeCompare(b.apellido)));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected filtrados(): Usuario[] {
    return this.usuarios().filter(u => coincide(this.texto(), u.nombre, u.apellido, u.correo, u.dni));
  }

  // gestionable lo decide el backend según la jerarquía; nunca habilita cambiar el rol
  // propio ni desactivar la propia cuenta.
  protected puedeEditar(usuario: Usuario): boolean {
    return usuario.gestionable;
  }

  protected puedeCambiarRol(usuario: Usuario): boolean {
    return usuario.gestionable && usuario.id !== this.yo;
  }

  protected puedeDesactivar(usuario: Usuario): boolean {
    return usuario.gestionable && usuario.id !== this.yo && usuario.activo;
  }

  abrirCambioRol(usuario: Usuario): void {
    this.rolNuevo.set(this.roles.includes(usuario.rol) ? usuario.rol : this.roles[0]);
    this.cambiandoRol.set(usuario);
  }

  confirmarRol(): void {
    const usuario = this.cambiandoRol();
    if (!usuario) return;
    this.ejecutar(this.usuarioService.cambiarRol(usuario.id, { rol: this.rolNuevo() }), `Rol de ${usuario.nombre} actualizado.`);
  }

  confirmarDesactivar(): void {
    const usuario = this.porDesactivar();
    if (!usuario) return;
    this.ejecutar(this.usuarioService.eliminar(usuario.id), `${usuario.nombre} ${usuario.apellido} fue desactivado.`);
  }

  private ejecutar(peticion: Observable<unknown>, exito: string): void {
    this.procesando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    peticion.subscribe({
      next: () => {
        this.procesando.set(false);
        this.cambiandoRol.set(null);
        this.porDesactivar.set(null);
        this.mensaje.set(exito);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.procesando.set(false);
        this.cambiandoRol.set(null);
        this.porDesactivar.set(null);
        this.error.set(mensajeError(err));
      },
    });
  }
}
