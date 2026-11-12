import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { Local } from '../../models/local.model';
import { LocalService } from '../../services/local-service';

@Component({
  selector: 'app-local-list',
  imports: [RouterLink, ConfirmarDialogo],
  templateUrl: './local-list.html',
  styleUrl: './local-list.css',
})
export class LocalList implements OnInit {
  private readonly localService = inject(LocalService);
  // El local propio no se ofrece para eliminar.
  protected readonly localActual = inject(AuthService).usuario()?.localId ?? null;

  protected readonly locales = signal<Local[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly porEliminar = signal<Local | null>(null);
  protected readonly eliminando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.localService.listar().subscribe({
      next: locales => {
        this.locales.set(locales.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  confirmarEliminar(): void {
    const local = this.porEliminar();
    if (!local || this.eliminando()) return;

    this.eliminando.set(true);
    this.localService.eliminar(local.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.porEliminar.set(null);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.eliminando.set(false);
        this.porEliminar.set(null);
      },
    });
  }
}
