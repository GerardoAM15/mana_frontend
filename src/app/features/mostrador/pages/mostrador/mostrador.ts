import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';
import { CajaEstadoService } from '../../../../core/services/caja-estado.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import {
  aPlatosCantidad,
  cantidadesPorCategoria,
  cumpleComposicion,
  quitarPlato,
  Seleccion,
  tocarPlato,
} from '../../../../core/utils/composicion';
import { horaActual, hoy } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { servicioPorHora } from '../../../../core/utils/servicios';
import { AvisoCaja } from '../../../../shared/components/aviso-caja/aviso-caja';
import { MenuDia, MenuPlato } from '../../../menu/models/menu.model';
import { ReglaCobro } from '../../../menu/models/regla-cobro.model';
import { MenuService } from '../../../menu/services/menu-service';
import { ReglaCobroService } from '../../../menu/services/regla-cobro-service';
import { ConsumosHoy } from '../../components/consumos-hoy/consumos-hoy';
import { Pensionista } from '../../models/pensionista.model';
import { ConsumoService } from '../../services/consumo-service';
import { PensionistaService } from '../../services/pensionista-service';

interface GrupoPlatos {
  categoria: string;
  requerida: number;
  elegida: number;
  platos: MenuPlato[];
}

interface Exito {
  nombre: string;
  servicio: string;
  saldo: number | null;
  paraLlevar: boolean;
  recargo: number;
}

const ORDEN_SERVICIOS = ['D', 'A', 'C'];

@Component({
  selector: 'app-mostrador',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, AvisoCaja, ConsumosHoy],
  templateUrl: './mostrador.html',
  styleUrl: './mostrador.css',
})
export class Mostrador implements OnInit {
  private readonly pensionistaService = inject(PensionistaService);
  private readonly consumoService = inject(ConsumoService);
  private readonly menuService = inject(MenuService);
  private readonly reglaService = inject(ReglaCobroService);
  protected readonly cajaEstado = inject(CajaEstadoService);
  protected readonly catalogos = inject(CatalogoService);

  private readonly buscador = viewChild<ElementRef<HTMLInputElement>>('buscador');
  private readonly consumosHoy = viewChild(ConsumosHoy);

  protected readonly hoy = hoy();
  protected readonly servicios = ORDEN_SERVICIOS;
  protected readonly busqueda = new FormControl('', { nonNullable: true });
  protected readonly resultados = signal<Pensionista[]>([]);
  protected readonly buscando = signal(false);
  protected readonly pensionista = signal<Pensionista | null>(null);
  protected readonly servicio = signal<string | null>(null);
  protected readonly menus = signal<MenuDia[]>([]);
  protected readonly reglas = signal<ReglaCobro[]>([]);
  protected readonly seleccion = signal<Seleccion>({});
  protected readonly paraLlevar = signal(false);
  protected readonly metodoRecargo = signal('EFECTIVO');
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<Exito | null>(null);
  // contratoId -> nombre, para mostrar el cliente en la lista de consumos de hoy.
  protected readonly nombres = signal<Record<number, string>>({});

  protected readonly menu = computed(() => this.menus().find(m => m.servicio === this.servicio()) ?? null);
  protected readonly regla = computed(() => this.reglas().find(r => r.servicio === this.servicio() && r.activo) ?? null);
  private readonly platosMenu = computed(() => this.menu()?.platos ?? []);
  protected readonly grupos = computed<GrupoPlatos[]>(() => {
    const totales = cantidadesPorCategoria(this.seleccion(), this.platosMenu());
    return (this.regla()?.componentes ?? []).map(c => ({
      categoria: c.categoria,
      requerida: c.cantidad,
      elegida: totales[c.categoria] ?? 0,
      platos: this.platosMenu().filter(p => p.categoria === c.categoria),
    }));
  });
  protected readonly completo = computed(() =>
    cumpleComposicion(this.regla()?.componentes ?? [], this.platosMenu(), this.seleccion()),
  );
  protected readonly recargo = computed(() => this.regla()?.recargoLlevar ?? 0);
  // Con recargo (> 0) se cobra en la caja; el desayuno (recargo 0) no pide nada.
  protected readonly cobraRecargo = computed(() => this.paraLlevar() && this.recargo() > 0);
  protected readonly puedeRegistrar = computed(() => {
    const servicio = this.servicio();
    return !!this.pensionista() && !!servicio && this.habilitado(servicio) && this.completo() &&
      (!this.cobraRecargo() || (this.cajaEstado.abierta() && !!this.metodoRecargo())) && !this.guardando();
  });

  constructor() {
    // Resultados mientras se escribe (DNI o nombre). Sin distinctUntilChanged: tras limpiar el buscador,
    // volver a escribir el mismo texto debe buscar de nuevo.
    this.busqueda.valueChanges
      .pipe(
        map(q => q.trim()),
        debounceTime(300),
        tap(q => this.buscando.set(q.length >= 2)),
        switchMap(q =>
          q.length < 2
            ? of([])
            : this.pensionistaService.buscar(q).pipe(
                catchError((err: HttpErrorResponse) => {
                  this.error.set(mensajeError(err));
                  return of([]);
                }),
              ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(resultados => {
        this.resultados.set(resultados);
        this.buscando.set(false);
        this.recordarNombres(resultados);
      });
  }

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.menuService.listar({ desde: this.hoy, hasta: this.hoy, servicio: null, localId: null }).subscribe({
      next: menus => this.menus.set(menus),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
    this.reglaService.listar().subscribe({
      next: reglas => this.reglas.set(reglas),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  elegir(pensionista: Pensionista): void {
    this.pensionista.set(pensionista);
    this.resultados.set([]);
    this.error.set(null);
    this.exito.set(null);
    this.limpiarPedido();
    const sugerido = servicioPorHora(horaActual());
    this.servicio.set(this.habilitado(sugerido) ? sugerido : (ORDEN_SERVICIOS.find(s => this.habilitado(s)) ?? null));
  }

  elegirServicio(servicio: string): void {
    if (!this.habilitado(servicio)) return;
    this.servicio.set(servicio);
    this.limpiarPedido();
  }

  // El servicio debe estar en el contrato y tener saldo.
  protected habilitado(servicio: string): boolean {
    const detalle = this.pensionista()?.servicios.find(d => d.servicio === servicio);
    return !!detalle && detalle.saldoRaciones > 0;
  }

  protected saldo(servicio: string): number | null {
    return this.pensionista()?.servicios.find(d => d.servicio === servicio)?.saldoRaciones ?? null;
  }

  tocar(plato: MenuPlato, grupo: GrupoPlatos): void {
    this.seleccion.update(s => tocarPlato(s, plato, grupo.requerida, this.platosMenu()));
  }

  quitar(plato: MenuPlato): void {
    this.seleccion.update(s => quitarPlato(s, plato.platoId));
  }

  protected cantidad(plato: MenuPlato): number {
    return this.seleccion()[plato.platoId] ?? 0;
  }

  registrar(): void {
    const pensionista = this.pensionista();
    const servicio = this.servicio();
    if (!pensionista || !servicio || !this.puedeRegistrar()) return;

    const cobraRecargo = this.cobraRecargo();
    this.guardando.set(true);
    this.error.set(null);
    this.consumoService
      .registrar({
        contratoId: pensionista.contratoId,
        servicio,
        platos: aPlatosCantidad(this.seleccion()),
        paraLlevar: this.paraLlevar(),
        ...(cobraRecargo ? { metodoRecargo: this.metodoRecargo() } : {}),
      })
      .pipe(
        // Saldo actualizado del pensionista para el mensaje de éxito.
        switchMap(consumo =>
          this.pensionistaService.buscar(pensionista.dni).pipe(
            map(lista => lista.find(p => p.contratoId === pensionista.contratoId) ?? null),
            catchError(() => of(null)),
            map(actualizado => ({ consumo, actualizado })),
          ),
        ),
      )
      .subscribe({
        next: ({ consumo, actualizado }) => {
          this.guardando.set(false);
          this.exito.set({
            nombre: pensionista.nombreCompleto,
            servicio,
            saldo: actualizado?.servicios.find(d => d.servicio === servicio)?.saldoRaciones ?? null,
            paraLlevar: consumo.paraLlevar,
            recargo: consumo.recargoLlevar ?? 0,
          });
          this.siguienteCliente();
          this.consumosHoy()?.cargar(0);
          if (cobraRecargo) this.cajaEstado.refrescar().subscribe({ error: () => undefined });
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.error.set(mensajeError(err));
        },
      });
  }

  cancelar(): void {
    this.siguienteCliente();
    this.exito.set(null);
    this.error.set(null);
  }

  // Tras anular un consumo, si es del pensionista en pantalla se refresca su saldo.
  alAnular(contratoId: number): void {
    const actual = this.pensionista();
    if (!actual || actual.contratoId !== contratoId) return;
    this.pensionistaService.buscar(actual.dni).subscribe({
      next: lista => {
        const refrescado = lista.find(p => p.contratoId === contratoId);
        if (refrescado) this.pensionista.set(refrescado);
      },
      error: () => undefined,
    });
  }

  private limpiarPedido(): void {
    this.seleccion.set({});
    this.paraLlevar.set(false);
  }

  private siguienteCliente(): void {
    this.pensionista.set(null);
    this.servicio.set(null);
    this.limpiarPedido();
    this.busqueda.setValue('');
    this.resultados.set([]);
    setTimeout(() => this.buscador()?.nativeElement.focus());
  }

  private recordarNombres(lista: Pensionista[]): void {
    if (lista.length === 0) return;
    this.nombres.update(actuales => ({
      ...actuales,
      ...Object.fromEntries(lista.map(p => [p.contratoId, p.nombreCompleto])),
    }));
  }
}
