import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { PeriodoPlan, PlanRequest } from '../../models/plan.model';
import { PlanService } from '../../services/plan-service';

@Component({
  selector: 'app-plan-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './plan-form.html',
  styleUrl: './plan-form.css',
})
export class PlanForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly planService = inject(PlanService);
  private readonly router = inject(Router);
  protected readonly catalogos = inject(CatalogoService);

  readonly id = input<string>();
  protected readonly servicios = signal<string[]>([]);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly intento = signal(false);
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    periodo: this.fb.control<PeriodoPlan>('SEMANAL', Validators.required),
    activo: [true],
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    const id = this.id();
    if (!id) return;

    this.planService.obtener(Number(id)).subscribe({
      next: plan => {
        this.form.setValue({ nombre: plan.nombre, periodo: plan.periodo, activo: plan.activo });
        this.servicios.set(plan.servicios);
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  alternar(servicio: string, marcado: boolean): void {
    this.servicios.update(lista => (marcado ? [...lista, servicio] : lista.filter(s => s !== servicio)));
  }

  guardar(): void {
    this.intento.set(true);
    if (this.form.invalid || this.servicios().length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const dto: PlanRequest = { nombre: v.nombre.trim(), periodo: v.periodo, activo: v.activo, servicios: this.servicios() };
    const id = this.id();
    const peticion = id ? this.planService.actualizar(Number(id), dto) : this.planService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => this.router.navigate(['/planes']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
