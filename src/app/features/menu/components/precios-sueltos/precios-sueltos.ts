import { CurrencyPipe, KeyValuePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { PrecioSuelto } from '../../models/precio-suelto.model';
import { PrecioSueltoService } from '../../services/precio-suelto-service';

interface FilaSuelto {
  precio: PrecioSuelto;
  form: FormGroup<{ precio: FormControl<number | null>; recargoLlevar: FormControl<number | null>; activo: FormControl<boolean> }>;
}

// Precio de un plato suelto por servicio y categoría (la cena no tiene sueltos).
@Component({
  selector: 'app-precios-sueltos',
  imports: [ReactiveFormsModule, CurrencyPipe, KeyValuePipe, ConfirmarDialogo],
  templateUrl: './precios-sueltos.html',
  styleUrl: './precios-sueltos.css',
})
export class PreciosSueltos implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly sueltoService = inject(PrecioSueltoService);
  protected readonly catalogos = inject(CatalogoService);
  protected readonly gestiona = inject(AuthService).tienePermiso('MENU_GESTIONAR');

  protected readonly filas = signal<FilaSuelto[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly porEliminar = signal<PrecioSuelto | null>(null);

  protected readonly nuevo = this.fb.group({
    servicio: ['', Validators.required],
    categoria: ['', Validators.required],
    precio: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    recargoLlevar: this.fb.control<number | null>(0, [Validators.required, Validators.min(0)]),
    activo: [true],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.sueltoService.listar().subscribe({
      next: precios => {
        const orden = (p: PrecioSuelto) => `${p.servicio}|${p.categoria}`;
        this.filas.set(precios.sort((a, b) => orden(a).localeCompare(orden(b))).map(p => this.crearFila(p)));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected clave(p: PrecioSuelto): string {
    return `${p.servicio}|${p.categoria}`;
  }

  guardar(fila: FilaSuelto): void {
    if (fila.form.invalid) {
      fila.form.markAllAsTouched();
      return;
    }
    const v = fila.form.getRawValue();
    const { servicio, categoria } = fila.precio;
    this.ejecutar(
      this.clave(fila.precio),
      this.sueltoService.actualizar(servicio, categoria, {
        servicio, categoria, precio: v.precio ?? 0, recargoLlevar: v.recargoLlevar ?? 0, activo: v.activo,
      }),
      'Precio actualizado.',
    );
  }

  crear(): void {
    if (this.nuevo.invalid) {
      this.nuevo.markAllAsTouched();
      return;
    }
    const v = this.nuevo.getRawValue();
    this.ejecutar(
      'nuevo',
      this.sueltoService.crear({ ...v, precio: v.precio ?? 0, recargoLlevar: v.recargoLlevar ?? 0 }),
      'Precio suelto registrado.',
      () => this.nuevo.reset({ servicio: '', categoria: '', precio: null, recargoLlevar: 0, activo: true }),
    );
  }

  confirmarEliminar(): void {
    const precio = this.porEliminar();
    if (!precio) return;
    this.ejecutar(
      this.clave(precio),
      this.sueltoService.eliminar(precio.servicio, precio.categoria),
      'Precio eliminado.',
      () => this.porEliminar.set(null),
    );
  }

  private ejecutar(clave: string, peticion: Observable<unknown>, exito: string, alTerminar?: () => void): void {
    this.guardando.set(clave);
    this.error.set(null);
    this.mensaje.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => {
        this.guardando.set(null);
        this.mensaje.set(exito);
        alTerminar?.();
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(null);
        this.porEliminar.set(null);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }

  private crearFila(precio: PrecioSuelto): FilaSuelto {
    const form = this.fb.group({
      precio: this.fb.control<number | null>(precio.precio, [Validators.required, Validators.min(0.01)]),
      recargoLlevar: this.fb.control<number | null>(precio.recargoLlevar, [Validators.required, Validators.min(0)]),
      activo: [precio.activo],
    });
    if (!this.gestiona) form.disable();
    return { precio, form };
  }
}
