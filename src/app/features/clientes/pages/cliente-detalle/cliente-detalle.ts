import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { EstadoBadge } from '../../../../shared/components/estado-badge/estado-badge';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Contrato } from '../../../contratos/models/contrato.model';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';

@Component({
  selector: 'app-cliente-detalle',
  imports: [RouterLink, CurrencyPipe, DatePipe, EstadoBadge, SiPermiso],
  templateUrl: './cliente-detalle.html',
  styleUrl: './cliente-detalle.css',
})
export class ClienteDetalle implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly auth = inject(AuthService);
  protected readonly catalogos = inject(CatalogoService);

  readonly id = input.required<string>();
  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly contrato = signal<Contrato | null>(null);
  protected readonly cargandoContrato = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorContrato = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.id());
    this.clienteService.obtener(id).subscribe({
      next: cliente => this.cliente.set(cliente),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });

    if (!this.auth.tienePermiso('CONTRATO_LEER')) return;
    this.cargandoContrato.set(true);
    this.clienteService.contratoVigente(id).subscribe({
      next: contrato => {
        this.contrato.set(contrato);
        this.cargandoContrato.set(false);
      },
      // 404: el cliente no tiene contrato vigente.
      error: (err: HttpErrorResponse) => {
        if (err.status !== 404) this.errorContrato.set(mensajeError(err));
        this.cargandoContrato.set(false);
      },
    });
  }
}
