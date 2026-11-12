import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { BebidaRequest } from '../../models/bebida.model';
import { BebidaService } from '../../services/bebida-service';

@Component({
  selector: 'app-bebida-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './bebida-form.html',
  styleUrl: './bebida-form.css',
})
export class BebidaForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly bebidaService = inject(BebidaService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    precioVenta: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    activo: [true],
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.bebidaService.obtener(Number(id)).subscribe({
      next: b => this.form.setValue({ nombre: b.nombre, precioVenta: b.precioVenta, activo: b.activo }),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const dto: BebidaRequest = { nombre: v.nombre.trim(), precioVenta: v.precioVenta ?? 0, activo: v.activo };
    const id = this.id();
    const peticion = id ? this.bebidaService.actualizar(Number(id), dto) : this.bebidaService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => this.router.navigate(['/inventario/bebidas']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
