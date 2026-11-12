import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { Plan } from '../../models/plan.model';
import { PlanService } from '../../services/plan-service';

@Component({
  selector: 'app-plan-list',
  imports: [RouterLink, ConfirmarDialogo],
  templateUrl: './plan-list.html',
  styleUrl: './plan-list.css',
})
export class PlanList implements OnInit {
  private readonly planService = inject(PlanService);
  protected readonly catalogos = inject(CatalogoService);

  protected readonly planes = signal<Plan[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly porEliminar = signal<Plan | null>(null);
  protected readonly eliminando = signal(false);

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.planService.listar().subscribe({
      next: planes => {
        this.planes.set(planes);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected nombresServicios(plan: Plan): string {
    return ['D', 'A', 'C']
      .filter(s => plan.servicios.includes(s))
      .concat(plan.servicios.filter(s => !['D', 'A', 'C'].includes(s)))
      .map(s => this.catalogos.nombreServicio(s))
      .join(', ');
  }

  confirmarEliminar(): void {
    const plan = this.porEliminar();
    if (!plan || this.eliminando()) return;

    this.eliminando.set(true);
    this.planService.eliminar(plan.id).subscribe({
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
