import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { CajaEstadoService } from '../../../../core/services/caja-estado.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { redondear, sumar } from '../../../../core/utils/numeros';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { ResumenCaja } from '../../models/caja.model';
import { CajaService } from '../../services/caja-service';

interface FilaArqueo {
  metodo: string;
  esperado: number;
}

@Component({
  selector: 'app-caja-cerrar',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, ConfirmarDialogo],
  templateUrl: './caja-cerrar.html',
  styleUrl: './caja-cerrar.css',
})
export class CajaCerrar implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly cajaService = inject(CajaService);
  private readonly cajaEstado = inject(CajaEstadoService);
  private readonly router = inject(Router);
  protected readonly catalogos = inject(CatalogoService);

  protected readonly resumen = signal<ResumenCaja | null>(null);
  protected readonly filas = signal<FilaArqueo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly sinCaja = signal(false);
  protected readonly guardando = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly error = signal<string | null>(null);
  // 409 al cerrar: normalmente quedan ventas pendientes en la caja.
  protected readonly conflicto = signal(false);
  protected readonly erroresServidor = signal<Record<string, string>>({});

  protected readonly form = this.fb.group({
    conteos: this.fb.array<FormControl<number | null>>([]),
    observacion: ['', [Validators.maxLength(250)]],
  });

  // Valores contados como signal, para calcular las diferencias en vivo con computed.
  private readonly contados = signal<(number | null)[]>([]);

  protected readonly diferencias = computed(() =>
    this.filas().map((fila, i) => redondear((this.contados()[i] ?? 0) - fila.esperado)),
  );
  protected readonly totalEsperado = computed(() => sumar(this.filas().map(f => f.esperado)));
  protected readonly totalContado = computed(() => sumar(this.contados().map(v => v ?? 0)));
  protected readonly totalDiferencia = computed(() => redondear(this.totalContado() - this.totalEsperado()));

  constructor() {
    this.form.controls.conteos.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(valores => this.contados.set(valores));
  }

  ngOnInit(): void {
    forkJoin([this.catalogos.cargar(), this.cajaEstado.refrescar()])
      .pipe(switchMap(([, caja]) => (caja ? this.cajaService.resumen(caja.id) : of(null))))
      .subscribe({
        next: resumen => {
          this.cargando.set(false);
          if (!resumen) {
            this.sinCaja.set(true);
            return;
          }
          this.resumen.set(resumen);
          this.armarFilas(resumen);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  pedirConfirmacion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmando.set(true);
  }

  cancelar(): void {
    this.confirmando.set(false);
  }

  cerrar(): void {
    const resumen = this.resumen();
    if (!resumen || this.guardando()) return;

    const valores = this.form.getRawValue();
    const observacion = valores.observacion.trim();
    this.guardando.set(true);
    this.error.set(null);
    this.conflicto.set(false);
    this.erroresServidor.set({});
    this.cajaService
      .cerrar(resumen.caja.id, {
        conteos: this.filas().map((fila, i) => ({ metodo: fila.metodo, montoContado: valores.conteos[i] ?? 0 })),
        ...(observacion ? { observacion } : {}),
      })
      .subscribe({
        next: caja => {
          this.cajaEstado.establecer(null);
          this.router.navigate(['/caja', caja.id]);
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.confirmando.set(false);
          this.error.set(mensajeError(err));
          this.conflicto.set(err.status === 409);
          this.erroresServidor.set(erroresDeValidacion(err));
        },
      });
  }

  // Una fila por cada método de pago activo, más los del resumen que no estén en el catálogo.
  private armarFilas(resumen: ResumenCaja): void {
    const esperados = new Map(resumen.metodos.map(m => [m.metodo, m.montoEsperado]));
    const metodos = this.catalogos.metodosPago().map(m => m.codigo);
    resumen.metodos.forEach(m => {
      if (!metodos.includes(m.metodo)) metodos.push(m.metodo);
    });

    const conteos = this.form.controls.conteos;
    conteos.clear();
    this.filas.set(metodos.map(metodo => ({ metodo, esperado: esperados.get(metodo) ?? 0 })));
    metodos.forEach(() => conteos.push(this.fb.control<number | null>(null, [Validators.required, Validators.min(0)])));
  }
}
