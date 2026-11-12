import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConsultaDocumentoService, mensajeConsulta } from '../../../../core/services/consulta-documento.service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { Bebida } from '../../models/bebida.model';
import { ProveedorRequest } from '../../models/proveedor.model';
import { BebidaService } from '../../services/bebida-service';
import { ProveedorService } from '../../services/proveedor-service';

@Component({
  selector: 'app-proveedor-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './proveedor-form.html',
  styleUrl: './proveedor-form.css',
})
export class ProveedorForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly proveedorService = inject(ProveedorService);
  private readonly bebidaService = inject(BebidaService);
  private readonly router = inject(Router);
  private readonly consultas = inject(ConsultaDocumentoService);

  readonly id = input<string>();
  protected readonly bebidas = signal<Bebida[]>([]);
  protected readonly elegidas = signal<number[]>([]);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    razonSocial: ['', [Validators.required, Validators.maxLength(160)]],
    telefono: ['', [Validators.maxLength(20)]],
    activo: [true],
  });

  // RUC solo para autocompletar desde SUNAT: el proveedor no guarda RUC.
  protected readonly ruc = this.fb.control('', Validators.pattern(/^(10|15|17|20)\d{9}$/));
  protected readonly buscandoRuc = signal(false);
  protected readonly avisoRuc = signal<string | null>(null);

  protected esEdicion(): boolean {
    return !!this.id();
  }

  buscarRuc(): void {
    const ruc = this.ruc.value.trim();
    if (!/^(10|15|17|20)\d{9}$/.test(ruc)) {
      this.ruc.markAsTouched();
      return;
    }
    this.buscandoRuc.set(true);
    this.avisoRuc.set(null);
    this.consultas.ruc(ruc).subscribe({
      next: r => {
        this.buscandoRuc.set(false);
        this.form.controls.razonSocial.setValue(r.razonSocial);
        if (r.telefono) this.form.controls.telefono.setValue(r.telefono);
        const observado = (r.estado && r.estado !== 'ACTIVO') || (r.condicion && r.condicion !== 'HABIDO');
        this.avisoRuc.set(observado
          ? `Atención: en SUNAT figura ${r.estado ?? '-'} / ${r.condicion ?? '-'}.`
          : 'Datos completados desde SUNAT; revíselos antes de guardar.');
      },
      error: (err: HttpErrorResponse) => {
        this.buscandoRuc.set(false);
        this.avisoRuc.set(mensajeConsulta(err));
      },
    });
  }

  ngOnInit(): void {
    this.bebidaService.listar().subscribe({
      next: bebidas => this.bebidas.set(bebidas.sort((a, b) => a.nombre.localeCompare(b.nombre))),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });

    const id = this.id();
    if (!id) return;
    this.proveedorService.obtener(Number(id)).subscribe({
      next: p => {
        this.form.setValue({ razonSocial: p.razonSocial, telefono: p.telefono ?? '', activo: p.activo });
        this.elegidas.set(p.bebidaIds);
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  alternar(id: number, marcado: boolean): void {
    this.elegidas.update(lista => (marcado ? [...lista, id] : lista.filter(b => b !== id)));
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const telefono = v.telefono.trim();
    const dto: ProveedorRequest = {
      razonSocial: v.razonSocial.trim(),
      ...(telefono ? { telefono } : {}),
      activo: v.activo,
      bebidaIds: this.elegidas(),
    };
    const id = this.id();
    const peticion = id ? this.proveedorService.actualizar(Number(id), dto) : this.proveedorService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: () => this.router.navigate(['/inventario/proveedores']),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
