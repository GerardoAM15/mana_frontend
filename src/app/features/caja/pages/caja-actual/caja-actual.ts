import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CajaEstadoService } from '../../../../core/services/caja-estado.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { ResumenCaja } from '../../models/caja.model';
import { CajaService } from '../../services/caja-service';

// El resumen se vuelve a pedir cada 30 segundos mientras la pantalla está abierta.
const REFRESCO_MS = 30_000;

@Component({
  selector: 'app-caja-actual',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, SiPermiso],
  templateUrl: './caja-actual.html',
  styleUrl: './caja-actual.css',
})
export class CajaActual implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly cajaService = inject(CajaService);
  protected readonly cajaEstado = inject(CajaEstadoService);
  protected readonly catalogos = inject(CatalogoService);

  protected readonly resumen = signal<ResumenCaja | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    montoInicial: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  constructor() {
    const temporizador = setInterval(() => this.cargarResumen(), REFRESCO_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(temporizador));
  }

  ngOnInit(): void {
    this.cargando.set(true);
    this.cajaEstado.refrescar().subscribe({
      next: () => {
        this.cargando.set(false);
        this.cargarResumen();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  cargarResumen(): void {
    const caja = this.cajaEstado.caja();
    if (!caja) return;

    this.cajaService.resumen(caja.id).subscribe({
      next: resumen => {
        this.resumen.set(resumen);
        this.error.set(null);
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  abrir(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    this.cajaService.abrir({ montoInicial: this.form.getRawValue().montoInicial ?? 0 }).subscribe({
      next: caja => {
        this.cajaEstado.establecer(caja);
        this.guardando.set(false);
        this.form.reset();
        this.cargarResumen();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
