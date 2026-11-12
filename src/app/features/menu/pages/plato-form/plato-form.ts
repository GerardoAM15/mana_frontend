import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { PlatoRequest } from '../../models/plato.model';
import { PlatoService } from '../../services/plato-service';

@Component({
  selector: 'app-plato-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './plato-form.html',
  styleUrl: './plato-form.css',
})
export class PlatoForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly platoService = inject(PlatoService);
  private readonly router = inject(Router);
  protected readonly catalogos = inject(CatalogoService);

  readonly id = input<string>();
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    categoria: ['', Validators.required],
    activo: [true],
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    const id = this.id();
    if (!id) return;

    this.platoService.obtener(Number(id)).subscribe({
      next: plato => this.form.setValue({ nombre: plato.nombre, categoria: plato.categoria, activo: plato.activo }),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const dto: PlatoRequest = { nombre: valores.nombre.trim(), categoria: valores.categoria, activo: valores.activo };
    const id = this.id();
    const peticion = id ? this.platoService.actualizar(Number(id), dto) : this.platoService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => this.router.navigate(['/menu/platos']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
