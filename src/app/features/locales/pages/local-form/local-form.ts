import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { LocalRequest } from '../../models/local.model';
import { LocalService } from '../../services/local-service';

@Component({
  selector: 'app-local-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './local-form.html',
  styleUrl: './local-form.css',
})
export class LocalForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly localService = inject(LocalService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    direccion: ['', [Validators.maxLength(250)]],
    telefono: ['', [Validators.maxLength(20)]],
    activo: [true],
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    this.localService.obtener(Number(id)).subscribe({
      next: l => this.form.setValue({ nombre: l.nombre, direccion: l.direccion ?? '', telefono: l.telefono ?? '', activo: l.activo }),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const direccion = v.direccion.trim();
    const telefono = v.telefono.trim();
    const dto: LocalRequest = {
      nombre: v.nombre.trim(),
      ...(direccion ? { direccion } : {}),
      ...(telefono ? { telefono } : {}),
      activo: v.activo,
    };
    const id = this.id();
    const peticion = id ? this.localService.actualizar(Number(id), dto) : this.localService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => this.router.navigate(['/locales']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
