import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { LocalService } from '../../../locales/services/local-service';
import { Rol, rolesAsignables, UsuarioRequest } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario-service';

interface OpcionLocal {
  id: number;
  nombre: string;
}

// Crea persona + empleado + usuario en un solo paso. Al editar, la clave es opcional
// y el rol se cambia con "Cambiar rol" en el listado (PATCH /usuarios/{id}/rol).
// Jerarquía: el ADMINISTRADOR solo crea cajeros; el DUENO, cualquier rol.
@Component({
  selector: 'app-usuario-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css',
})
export class UsuarioForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly localService = inject(LocalService);
  private readonly router = inject(Router);
  protected readonly catalogos = inject(CatalogoService);
  private readonly auth = inject(AuthService);

  readonly id = input<string>();
  protected readonly roles = signal<Rol[]>(rolesAsignables(this.auth.usuario()?.rol));
  protected readonly locales = signal<OpcionLocal[]>([]);
  // false si el backend indica que este usuario no se puede editar (gestionable = false).
  protected readonly editable = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    telefono: ['', [Validators.maxLength(20)]],
    localId: this.fb.control<number | null>(null, Validators.required),
    cargo: ['', [Validators.required, Validators.maxLength(100)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    clave: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    rol: this.fb.control<Rol>('CAJERO', Validators.required),
    activo: [true],
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.cargarLocales();

    const id = this.id();
    if (!id) return;
    // Al editar, la clave es opcional (vacía = no se cambia) y el rol no se edita aquí.
    this.form.controls.clave.setValidators([Validators.minLength(8), Validators.maxLength(72)]);
    this.form.controls.rol.disable();
    this.usuarioService.obtener(Number(id)).subscribe({
      next: u => {
        this.agregarLocal({ id: u.localId, nombre: u.localNombre });
        // El rol actual se muestra aunque no esté entre los asignables.
        if (!this.roles().includes(u.rol)) this.roles.update(r => [...r, u.rol]);
        this.form.patchValue({
          dni: u.dni, nombre: u.nombre, apellido: u.apellido, telefono: u.telefono ?? '', localId: u.localId,
          cargo: u.cargo, correo: u.correo, clave: '', rol: u.rol, activo: u.activo,
        });
        if (!u.gestionable) {
          this.editable.set(false);
          this.form.disable();
        }
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  // GET /locales exige LOCAL_GESTIONAR (solo DUENO). Sin ese permiso se usa el local de la sesión.
  private cargarLocales(): void {
    const sesion = this.auth.usuario();
    if (!this.auth.tienePermiso('LOCAL_GESTIONAR')) {
      if (sesion) this.agregarLocal({ id: sesion.localId, nombre: sesion.localNombre });
      if (!this.id() && sesion) this.form.controls.localId.setValue(sesion.localId);
      return;
    }
    this.localService.listar().subscribe({
      next: locales => locales.filter(l => l.activo).forEach(l => this.agregarLocal({ id: l.id, nombre: l.nombre })),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  private agregarLocal(local: OpcionLocal): void {
    this.locales.update(lista => (lista.some(l => l.id === local.id) ? lista : [...lista, local]));
  }

  guardar(): void {
    if (!this.editable()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const telefono = v.telefono.trim();
    const dto: UsuarioRequest = {
      dni: v.dni.trim(),
      nombre: v.nombre.trim(),
      apellido: v.apellido.trim(),
      ...(telefono ? { telefono } : {}),
      localId: v.localId ?? 0,
      cargo: v.cargo.trim(),
      correo: v.correo.trim(),
      ...(v.clave ? { clave: v.clave } : {}),
      rol: v.rol,
      activo: v.activo,
    };
    const id = this.id();
    const peticion = id ? this.usuarioService.actualizar(Number(id), dto) : this.usuarioService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => this.router.navigate(['/usuarios']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
