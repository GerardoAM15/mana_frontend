import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { hoy } from '../../../../core/utils/fechas';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { GastoRequest } from '../../models/gasto.model';
import { GastoService } from '../../services/gasto-service';

@Component({
  selector: 'app-gasto-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './gasto-form.html',
  styleUrl: './gasto-form.css',
})
export class GastoForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly gastoService = inject(GastoService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    fecha: [hoy(), Validators.required],
    monto: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    descripcion: ['', [Validators.required, Validators.maxLength(500)]],
    activo: [true],
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.gastoService.obtener(Number(id)).subscribe({
      next: g => this.form.setValue({ fecha: g.fecha, monto: g.monto, descripcion: g.descripcion, activo: g.activo }),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const dto: GastoRequest = { fecha: v.fecha, monto: v.monto ?? 0, descripcion: v.descripcion.trim(), activo: v.activo };
    const id = this.id();
    const peticion = id ? this.gastoService.actualizar(Number(id), dto) : this.gastoService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => this.router.navigate(['/gastos']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
