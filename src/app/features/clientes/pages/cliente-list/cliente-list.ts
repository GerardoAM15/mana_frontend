import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';

const TAMANIO = 20;

@Component({
  selector: 'app-cliente-list',
  imports: [ReactiveFormsModule, RouterLink, Paginador, ConfirmarDialogo, SiPermiso],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteList implements OnInit {
  private readonly clienteService = inject(ClienteService);

  protected readonly resultado = signal<PaginaResponse<Cliente> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly porDesactivar = signal<Cliente | null>(null);
  protected readonly desactivando = signal(false);
  protected readonly busqueda = new FormControl('', { nonNullable: true });

  constructor() {
    this.busqueda.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.buscar(0));
  }

  ngOnInit(): void {
    this.buscar(0);
  }

  buscar(pagina = this.resultado()?.pagina ?? 0): void {
    this.cargando.set(true);
    this.error.set(null);
    this.clienteService.buscar(this.busqueda.value, pagina, TAMANIO).subscribe({
      next: resultado => {
        this.resultado.set(resultado);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  confirmarDesactivar(): void {
    const cliente = this.porDesactivar();
    if (!cliente || this.desactivando()) return;

    this.desactivando.set(true);
    this.clienteService.eliminar(cliente.id).subscribe({
      next: () => {
        this.desactivando.set(false);
        this.porDesactivar.set(null);
        this.buscar();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.desactivando.set(false);
        this.porDesactivar.set(null);
      },
    });
  }
}
