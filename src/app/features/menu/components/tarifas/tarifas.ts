import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { Tarifa } from '../../models/tarifa.model';
import { TarifaService } from '../../services/tarifa-service';

interface FilaTarifa {
  servicio: string;
  tarifa: Tarifa | null;
  form: FormGroup<{ precio: FormControl<number | null>; activo: FormControl<boolean> }>;
}

// Precio por ración de cada servicio para el pensionista. No afecta contratos ya registrados.
@Component({
  selector: 'app-tarifas',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './tarifas.html',
  styleUrl: './tarifas.css',
})
export class Tarifas implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly tarifaService = inject(TarifaService);
  protected readonly catalogos = inject(CatalogoService);
  protected readonly gestiona = inject(AuthService).tienePermiso('MENU_GESTIONAR');

  protected readonly filas = signal<FilaTarifa[]>([]);
  protected readonly guardando = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);

  ngOnInit(): void {
    forkJoin([this.catalogos.cargar(), this.tarifaService.listar()]).subscribe({
      next: ([catalogos, tarifas]) =>
        this.filas.set(
          catalogos.servicios.filter(s => s.activo).map(s => this.crearFila(s.codigo, tarifas.find(t => t.servicio === s.codigo) ?? null)),
        ),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  guardar(fila: FilaTarifa): void {
    if (fila.form.invalid) {
      fila.form.markAllAsTouched();
      return;
    }

    const valores = fila.form.getRawValue();
    const dto = { servicio: fila.servicio, precio: valores.precio ?? 0, activo: valores.activo };
    const peticion = fila.tarifa ? this.tarifaService.actualizar(fila.tarifa.id, dto) : this.tarifaService.crear(dto);

    this.guardando.set(fila.servicio);
    this.error.set(null);
    this.mensaje.set(null);
    peticion.subscribe({
      next: guardada => {
        this.filas.update(filas => filas.map(f => (f.servicio === fila.servicio ? { ...f, tarifa: guardada } : f)));
        this.guardando.set(null);
        this.mensaje.set(`Tarifa de ${this.catalogos.nombreServicio(fila.servicio)} guardada.`);
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(null);
        this.error.set(mensajeError(err));
      },
    });
  }

  private crearFila(servicio: string, tarifa: Tarifa | null): FilaTarifa {
    const form = this.fb.group({
      precio: this.fb.control<number | null>(tarifa?.precio ?? null, [Validators.required, Validators.min(0.01)]),
      activo: [tarifa?.activo ?? true],
    });
    if (!this.gestiona) form.disable();
    return { servicio, tarifa, form };
  }
}
