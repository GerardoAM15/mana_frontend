import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { diasEntre, hoy } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { Barras, FilaBarras, Serie } from '../../components/barras/barras';
import { ContratoPorVencer } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte-service';

interface ContratoAgrupado {
  contratoId: number;
  numero: string;
  dni: string;
  clienteNombre: string;
  fechaFin: string;
  diasRestantes: number;
  saldos: { servicio: string; saldoRaciones: number }[];
  saldoTotal: number;
}

// Contratos activos que vencen en los próximos N días (por defecto 3), con su saldo por servicio.
@Component({
  selector: 'app-reporte-por-vencer',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, Barras],
  templateUrl: './reporte-por-vencer.html',
  styleUrl: './reporte-por-vencer.css',
})
export class ReportePorVencer implements OnInit {
  private readonly reporteService = inject(ReporteService);
  protected readonly catalogos = inject(CatalogoService);

  protected readonly datos = signal<ContratoPorVencer[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group({
    dias: [3, [Validators.required, Validators.min(0), Validators.max(365)]],
    desde: [''],
    hasta: [''],
  });

  protected readonly contratos = computed<ContratoAgrupado[]>(() => {
    const hoyIso = hoy();
    const mapa = new Map<number, ContratoAgrupado>();
    for (const d of this.datos()) {
      const c = mapa.get(d.contratoId) ?? {
        contratoId: d.contratoId, numero: d.numero, dni: d.dni, clienteNombre: d.clienteNombre,
        fechaFin: d.fechaFin, diasRestantes: diasEntre(hoyIso, d.fechaFin), saldos: [], saldoTotal: 0,
      };
      c.saldos.push({ servicio: d.servicio, saldoRaciones: d.saldoRaciones });
      c.saldoTotal += d.saldoRaciones;
      mapa.set(d.contratoId, c);
    }
    return [...mapa.values()].sort((a, b) => a.fechaFin.localeCompare(b.fechaFin));
  });
  protected readonly racionesPendientes = computed(() => this.contratos().reduce((t, c) => t + c.saldoTotal, 0));
  protected readonly series: Serie[] = [{ nombre: 'Raciones por consumir', tono: 'acento' }];
  protected readonly filas = computed<FilaBarras[]>(() =>
    this.contratos().map(c => ({ etiqueta: `${c.numero} · ${c.clienteNombre}`, valores: [c.saldoTotal] })),
  );

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.buscar();
  }

  buscar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.contratosPorVencer(v.dias, v.desde || null, v.hasta || null).subscribe({
      next: datos => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  imprimir(): void {
    window.print();
  }
}
