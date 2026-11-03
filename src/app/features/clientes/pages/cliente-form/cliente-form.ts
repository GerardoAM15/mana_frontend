import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { ClienteRequest } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';

@Component({
  selector: 'app-cliente-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.css',
})
export class ClienteForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  // ?dni=...&retorno=contrato cuando se crea desde "Nuevo contrato".
  readonly dni = input<string>();
  readonly retorno = input<string>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    telefono: ['', [Validators.maxLength(20)]],
    activo: [true],
  });

  protected esEdicion(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      const dni = this.dni();
      if (dni) this.form.controls.dni.setValue(dni);
      return;
    }

    this.clienteService.obtener(Number(id)).subscribe({
      next: cliente => this.form.setValue({
        dni: cliente.dni,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        telefono: cliente.telefono ?? '',
        activo: cliente.activo,
      }),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const telefono = valores.telefono.trim();
    const dto: ClienteRequest = {
      dni: valores.dni.trim(),
      nombre: valores.nombre.trim(),
      apellido: valores.apellido.trim(),
      ...(telefono ? { telefono } : {}),
      activo: valores.activo,
    };
    const id = this.id();
    const peticion = id ? this.clienteService.actualizar(Number(id), dto) : this.clienteService.crear(dto);

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: cliente => {
        if (this.retorno() === 'contrato') {
          this.router.navigate(['/contratos/nuevo'], { queryParams: { clienteId: cliente.id } });
        } else {
          this.router.navigate(['/clientes', cliente.id]);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
