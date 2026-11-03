import { Component, inject, input, OnInit, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { hoy, primerDiaMes } from '../../../../core/utils/fechas';
import { Agrupacion } from '../../services/reporte-service';

export interface ValoresFiltro {
  desde: string;
  hasta: string;
  servicio: string | null;
  agrupacion: Agrupacion;
}

// Filtros comunes de los reportes: desde, hasta y, según el reporte, servicio o agrupación.
@Component({
  selector: 'app-filtros-reporte',
  imports: [ReactiveFormsModule],
  templateUrl: './filtros-reporte.html',
  styleUrl: './filtros-reporte.css',
})
export class FiltrosReporte implements OnInit {
  protected readonly catalogos = inject(CatalogoService);

  readonly conServicio = input(false);
  readonly conAgrupacion = input(false);
  readonly cargando = input(false);
  readonly buscar = output<ValoresFiltro>();

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    desde: [primerDiaMes(hoy()), Validators.required],
    hasta: [hoy(), Validators.required],
    servicio: [''],
    agrupacion: this.fb.control<Agrupacion>('DIA'),
  });

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.enviar();
  }

  protected rangoInvalido(): boolean {
    const { desde, hasta } = this.form.getRawValue();
    return !!desde && !!hasta && desde > hasta;
  }

  enviar(): void {
    if (this.form.invalid || this.rangoInvalido()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.buscar.emit({ desde: v.desde, hasta: v.hasta, servicio: v.servicio || null, agrupacion: v.agrupacion });
  }

  imprimir(): void {
    window.print();
  }
}
