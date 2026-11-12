import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { coincide } from '../../../../core/utils/texto';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { MenuTabs } from '../../components/menu-tabs/menu-tabs';
import { Plato } from '../../models/plato.model';
import { PlatoService } from '../../services/plato-service';

type FiltroActivo = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-plato-list',
  imports: [RouterLink, ConfirmarDialogo, SiPermiso, MenuTabs],
  templateUrl: './plato-list.html',
  styleUrl: './plato-list.css',
})
export class PlatoList implements OnInit {
  private readonly platoService = inject(PlatoService);
  protected readonly catalogos = inject(CatalogoService);

  protected readonly platos = signal<Plato[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly texto = signal('');
  protected readonly categoria = signal('');
  protected readonly activo = signal<FiltroActivo>('activos');
  protected readonly porEliminar = signal<Plato | null>(null);
  protected readonly eliminando = signal(false);

  protected readonly filtrados = computed(() =>
    this.platos()
      .filter(p => !this.categoria() || p.categoria === this.categoria())
      .filter(p => this.activo() === 'todos' || p.activo === (this.activo() === 'activos'))
      .filter(p => coincide(this.texto(), p.nombre))
      .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)),
  );

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.platoService.listar().subscribe({
      next: platos => {
        this.platos.set(platos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  confirmarEliminar(): void {
    const plato = this.porEliminar();
    if (!plato || this.eliminando()) return;

    this.eliminando.set(true);
    this.platoService.eliminar(plato.id).subscribe({
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
