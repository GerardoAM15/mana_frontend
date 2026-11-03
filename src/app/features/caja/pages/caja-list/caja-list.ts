import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { EstadoBadge } from '../../../../shared/components/estado-badge/estado-badge';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { UsuarioService } from '../../../usuarios/services/usuario-service';
import { Caja, FiltroCajas } from '../../models/caja.model';
import { CajaService } from '../../services/caja-service';

const TAMANIO = 20;

@Component({
  selector: 'app-caja-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, EstadoBadge, Paginador],
  templateUrl: './caja-list.html',
  styleUrl: './caja-list.css',
})
export class CajaList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly cajaService = inject(CajaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly auth = inject(AuthService);

  protected readonly resultado = signal<PaginaResponse<Caja> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly usuarios = signal<Usuario[]>([]);
  // GET /usuarios exige USUARIO_GESTIONAR: sin ese permiso el filtro es por id de usuario.
  protected readonly puedeListarUsuarios = this.auth.tienePermiso('USUARIO_GESTIONAR');
  private readonly nombres = computed(
    () => new Map(this.usuarios().map(u => [u.id, `${u.nombre} ${u.apellido}`])),
  );

  protected readonly filtros = this.fb.group({
    desde: [''],
    hasta: [''],
    usuarioId: this.fb.control<number | null>(null),
  });

  ngOnInit(): void {
    if (this.puedeListarUsuarios) {
      this.usuarioService.listar().subscribe({ next: usuarios => this.usuarios.set(usuarios), error: () => undefined });
    }
    this.buscar(0);
  }

  buscar(pagina = 0): void {
    const valores = this.filtros.getRawValue();
    const filtro: FiltroCajas = {
      desde: valores.desde || null,
      hasta: valores.hasta || null,
      usuarioId: valores.usuarioId ? Number(valores.usuarioId) : null,
      localId: null,
    };

    this.cargando.set(true);
    this.error.set(null);
    this.cajaService.buscar(filtro, pagina, TAMANIO).subscribe({
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

  limpiar(): void {
    this.filtros.reset();
    this.buscar(0);
  }

  imprimir(): void {
    window.print();
  }

  protected nombreUsuario(id: number): string {
    return this.nombres().get(id) ?? `Usuario #${id}`;
  }
}
