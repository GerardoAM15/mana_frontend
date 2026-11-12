import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { hoy } from '../../../../core/utils/fechas';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { DiaNoAtencion } from '../../models/dia-no-atencion.model';
import { DiaNoAtencionService } from '../../services/dia-no-atencion-service';

// Feriados y cierres del local: no cuentan como raciones y no se registran consumos.
@Component({
  selector: 'app-dia-no-atencion-list',
  imports: [ReactiveFormsModule, DatePipe, ConfirmarDialogo],
  templateUrl: './dia-no-atencion-list.html',
  styleUrl: './dia-no-atencion-list.css',
})
export class DiaNoAtencionList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(DiaNoAtencionService);
  protected readonly localNombre = inject(AuthService).usuario()?.localNombre ?? '';

  protected readonly dias = signal<DiaNoAtencion[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly editando = signal<DiaNoAtencion | null>(null);
  protected readonly porEliminar = signal<DiaNoAtencion | null>(null);

  protected readonly filtros = this.fb.group({ desde: [`${hoy().slice(0, 4)}-01-01`], hasta: [`${hoy().slice(0, 4)}-12-31`] });
  protected readonly form = this.fb.group({
    fecha: ['', Validators.required],
    motivo: ['', [Validators.required, Validators.maxLength(160)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    this.cargando.set(true);
    this.service.listar({ desde: desde || null, hasta: hasta || null, localId: null }).subscribe({
      next: dias => {
        this.dias.set(dias.sort((a, b) => a.fecha.localeCompare(b.fecha)));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  editar(dia: DiaNoAtencion): void {
    this.editando.set(dia);
    this.form.setValue({ fecha: dia.fecha, motivo: dia.motivo });
    this.mensaje.set(null);
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.form.reset({ fecha: '', motivo: '' });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto = { fecha: v.fecha, motivo: v.motivo.trim() };
    const editando = this.editando();
    const peticion = editando ? this.service.actualizar(editando.id, dto) : this.service.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set(editando ? 'Día actualizado.' : 'Día de no atención registrado.');
        this.cancelarEdicion();
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }

  confirmarEliminar(): void {
    const dia = this.porEliminar();
    if (!dia) return;
    this.guardando.set(true);
    this.service.eliminar(dia.id).subscribe({
      next: () => {
        this.guardando.set(false);
        this.porEliminar.set(null);
        this.mensaje.set('Día eliminado.');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.porEliminar.set(null);
        this.error.set(mensajeError(err));
      },
    });
  }
}
