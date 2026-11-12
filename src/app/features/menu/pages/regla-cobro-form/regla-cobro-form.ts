import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { ComponenteRegla, ReglaCobroRequest } from '../../models/regla-cobro.model';
import { ReglaCobroService } from '../../services/regla-cobro-service';

@Component({
  selector: 'app-regla-cobro-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './regla-cobro-form.html',
  styleUrl: './regla-cobro-form.css',
})
export class ReglaCobroForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly reglaService = inject(ReglaCobroService);
  private readonly router = inject(Router);
  protected readonly catalogos = inject(CatalogoService);

  readonly id = input<string>();
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    servicio: ['', Validators.required],
    precioCombo: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    recargoLlevar: this.fb.control<number | null>(0, [Validators.required, Validators.min(0)]),
    activo: [true],
    componentes: this.fb.array([this.nuevoComponente()]),
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    const id = this.id();
    if (!id) return;

    this.reglaService.obtener(Number(id)).subscribe({
      next: regla => {
        const componentes = this.form.controls.componentes;
        componentes.clear();
        regla.componentes.forEach(c => componentes.push(this.nuevoComponente(c)));
        this.form.patchValue({
          nombre: regla.nombre,
          servicio: regla.servicio,
          precioCombo: regla.precioCombo,
          recargoLlevar: regla.recargoLlevar,
          activo: regla.activo,
        });
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  agregarComponente(): void {
    this.form.controls.componentes.push(this.nuevoComponente());
  }

  quitarComponente(indice: number): void {
    if (this.form.controls.componentes.length > 1) this.form.controls.componentes.removeAt(indice);
  }

  // Una categoría no puede repetirse en la composición.
  protected categoriaRepetida(): boolean {
    const categorias = this.form.controls.componentes.getRawValue().map(c => c.categoria).filter(Boolean);
    return new Set(categorias).size !== categorias.length;
  }

  guardar(): void {
    if (this.form.invalid || this.categoriaRepetida()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const dto: ReglaCobroRequest = {
      nombre: v.nombre.trim(),
      servicio: v.servicio,
      precioCombo: v.precioCombo ?? 0,
      recargoLlevar: v.recargoLlevar ?? 0,
      activo: v.activo,
      componentes: v.componentes.map(c => ({ categoria: c.categoria, cantidad: c.cantidad ?? 1 })),
    };
    const id = this.id();
    const peticion = id ? this.reglaService.actualizar(Number(id), dto) : this.reglaService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => this.router.navigate(['/menu/precios']),
      error: (err: HttpErrorResponse) => {
        // 409: ya existe otro menú activo para ese servicio.
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }

  private nuevoComponente(componente?: ComponenteRegla) {
    return this.fb.group({
      categoria: [componente?.categoria ?? '', Validators.required],
      cantidad: this.fb.control<number | null>(componente?.cantidad ?? 1, [Validators.required, Validators.min(1)]),
    });
  }
}
