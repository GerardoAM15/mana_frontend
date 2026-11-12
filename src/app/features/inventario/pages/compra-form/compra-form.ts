import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { hoy } from '../../../../core/utils/fechas';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { sumar } from '../../../../core/utils/numeros';
import { Bebida } from '../../models/bebida.model';
import { CompraBebidaRequest } from '../../models/compra-bebida.model';
import { Proveedor } from '../../models/proveedor.model';
import { BebidaService } from '../../services/bebida-service';
import { CompraBebidaService } from '../../services/compra-bebida-service';
import { ProveedorService } from '../../services/proveedor-service';

@Component({
  selector: 'app-compra-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './compra-form.html',
  styleUrl: './compra-form.css',
})
export class CompraForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly compraService = inject(CompraBebidaService);
  private readonly proveedorService = inject(ProveedorService);
  private readonly bebidaService = inject(BebidaService);
  private readonly router = inject(Router);

  protected readonly hoy = hoy();
  protected readonly proveedores = signal<Proveedor[]>([]);
  private readonly bebidas = signal<Bebida[]>([]);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    proveedorId: this.fb.control<number | null>(null, Validators.required),
    fecha: [this.hoy, Validators.required],
    detalles: this.fb.array([this.nuevaLinea()]),
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  // Solo las bebidas que vende el proveedor elegido.
  protected readonly bebidasProveedor = computed(() => {
    const proveedor = this.proveedores().find(p => p.id === Number(this.valores().proveedorId));
    return proveedor ? this.bebidas().filter(b => proveedor.bebidaIds.includes(b.id)) : [];
  });
  protected readonly unidades = computed(() =>
    (this.valores().detalles ?? []).map(d => (d.presentaciones ?? 0) * (d.unidadesPorPresentacion ?? 0)),
  );
  protected readonly total = computed(() => sumar((this.valores().detalles ?? []).map(d => d.costoTotal ?? 0)));
  protected readonly totalUnidades = computed(() => this.unidades().reduce((t, u) => t + u, 0));

  constructor() {
    // Al cambiar de proveedor se limpian las bebidas que él no vende.
    this.form.controls.proveedorId.valueChanges.pipe(takeUntilDestroyed()).subscribe(proveedorId => {
      const permitidas = new Set(this.proveedores().find(p => p.id === Number(proveedorId))?.bebidaIds ?? []);
      this.form.controls.detalles.controls.forEach(linea => {
        if (linea.controls.bebidaId.value && !permitidas.has(linea.controls.bebidaId.value)) linea.controls.bebidaId.setValue(null);
      });
    });
  }

  ngOnInit(): void {
    forkJoin([this.proveedorService.listar(), this.bebidaService.listar()]).subscribe({
      next: ([proveedores, bebidas]) => {
        this.proveedores.set(proveedores.filter(p => p.activo));
        this.bebidas.set(bebidas.filter(b => b.activo).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  agregarLinea(): void {
    this.form.controls.detalles.push(this.nuevaLinea());
  }

  quitarLinea(indice: number): void {
    if (this.form.controls.detalles.length > 1) this.form.controls.detalles.removeAt(indice);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const dto: CompraBebidaRequest = {
      proveedorId: v.proveedorId ?? 0,
      fecha: v.fecha,
      detalles: v.detalles.map(d => ({
        bebidaId: d.bebidaId ?? 0,
        presentaciones: d.presentaciones ?? 0,
        unidadesPorPresentacion: d.unidadesPorPresentacion ?? 0,
        costoTotal: d.costoTotal ?? 0,
      })),
    };

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    this.compraService.registrar(dto).subscribe({
      next: compra => this.router.navigate(['/inventario/compras', compra.id]),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }

  private nuevaLinea() {
    return this.fb.group({
      bebidaId: this.fb.control<number | null>(null, Validators.required),
      presentaciones: this.fb.control<number | null>(1, [Validators.required, Validators.min(1)]),
      unidadesPorPresentacion: this.fb.control<number | null>(1, [Validators.required, Validators.min(1)]),
      costoTotal: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    });
  }
}
