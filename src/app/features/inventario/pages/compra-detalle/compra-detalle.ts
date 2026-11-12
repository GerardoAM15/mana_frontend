import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeError } from '../../../../core/utils/http-error';
import { CompraBebida } from '../../models/compra-bebida.model';
import { CompraBebidaService } from '../../services/compra-bebida-service';

@Component({
  selector: 'app-compra-detalle',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './compra-detalle.html',
  styleUrl: './compra-detalle.css',
})
export class CompraDetalle implements OnInit {
  private readonly compraService = inject(CompraBebidaService);

  readonly id = input.required<string>();
  protected readonly compra = signal<CompraBebida | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.compraService.obtener(Number(this.id())).subscribe({
      next: compra => this.compra.set(compra),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  imprimir(): void {
    window.print();
  }
}
