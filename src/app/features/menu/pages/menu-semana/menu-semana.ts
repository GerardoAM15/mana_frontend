import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { diaSemanaIso, hoy, inicioSemana, sumarDias } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { DiaNoAtencion } from '../../../calendario/models/dia-no-atencion.model';
import { DiaNoAtencionService } from '../../../calendario/services/dia-no-atencion-service';
import { MenuTabs } from '../../components/menu-tabs/menu-tabs';
import { MenuDia } from '../../models/menu.model';
import { Plato } from '../../models/plato.model';
import { ReglaCobro } from '../../models/regla-cobro.model';
import { MenuService } from '../../services/menu-service';
import { PlatoService } from '../../services/plato-service';
import { ReglaCobroService } from '../../services/regla-cobro-service';

const SERVICIOS = ['D', 'A', 'C'];

interface Celda {
  fecha: string;
  servicio: string;
}

interface GrupoBanco {
  categoria: string;
  enComposicion: boolean;
  platos: Plato[];
}

@Component({
  selector: 'app-menu-semana',
  imports: [ReactiveFormsModule, DatePipe, ConfirmarDialogo, SiPermiso, MenuTabs],
  templateUrl: './menu-semana.html',
  styleUrl: './menu-semana.css',
})
export class MenuSemana implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly menuService = inject(MenuService);
  private readonly platoService = inject(PlatoService);
  private readonly reglaService = inject(ReglaCobroService);
  private readonly diaNoAtencionService = inject(DiaNoAtencionService);
  private readonly auth = inject(AuthService);
  protected readonly catalogos = inject(CatalogoService);

  protected readonly servicios = SERVICIOS;
  protected readonly hoy = hoy();
  protected readonly gestiona = this.auth.tienePermiso('MENU_GESTIONAR');
  protected readonly lunes = signal(inicioSemana(this.hoy));
  protected readonly dias = computed(() => Array.from({ length: 7 }, (_, i) => sumarDias(this.lunes(), i)));
  protected readonly menus = signal<MenuDia[]>([]);
  protected readonly feriados = signal<DiaNoAtencion[]>([]);
  protected readonly platos = signal<Plato[]>([]);
  protected readonly reglas = signal<ReglaCobro[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);

  private readonly porCelda = computed(() => new Map(this.menus().map(m => [`${m.fecha}|${m.servicio}`, m])));
  private readonly feriadoPorFecha = computed(() => new Map(this.feriados().map(f => [f.fecha, f.motivo])));

  // Editor de una celda.
  protected readonly editando = signal<Celda | null>(null);
  protected readonly elegidos = signal<Set<number>>(new Set());
  protected readonly guardando = signal(false);
  protected readonly errorModal = signal<string | null>(null);
  protected readonly gruposBanco = computed<GrupoBanco[]>(() => {
    const celda = this.editando();
    if (!celda) return [];
    const composicion = this.reglas().find(r => r.servicio === celda.servicio && r.activo)?.componentes.map(c => c.categoria) ?? [];
    const visibles = this.platos().filter(p => p.activo || this.elegidos().has(p.id));
    const categorias = [...new Set([...composicion, ...visibles.map(p => p.categoria)])];
    return categorias
      .map(categoria => ({
        categoria,
        enComposicion: composicion.includes(categoria),
        platos: visibles.filter(p => p.categoria === categoria).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }))
      .filter(g => g.platos.length > 0)
      .sort((a, b) => Number(b.enComposicion) - Number(a.enComposicion));
  });

  // Clonar día y copiar segundos a la cena.
  protected readonly clonando = signal(false);
  protected readonly copiando = signal(false);
  protected readonly formClonar = this.fb.group({
    fechaOrigen: [this.hoy, Validators.required],
    fechaDestino: [sumarDias(this.hoy, 1), Validators.required],
    D: [true],
    A: [true],
    C: [true],
  });
  protected readonly formCopiar = this.fb.group({ fecha: [this.hoy, Validators.required] });

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    forkJoin([this.platoService.listar(), this.reglaService.listar()]).subscribe({
      next: ([platos, reglas]) => {
        this.platos.set(platos);
        this.reglas.set(reglas);
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
    this.cargarSemana();
  }

  cambiarSemana(semanas: number): void {
    this.lunes.update(lunes => sumarDias(lunes, semanas * 7));
    this.cargarSemana();
  }

  irAHoy(): void {
    this.lunes.set(inicioSemana(this.hoy));
    this.cargarSemana();
  }

  cargarSemana(): void {
    const desde = this.lunes();
    const hasta = sumarDias(desde, 6);
    this.cargando.set(true);
    this.error.set(null);
    this.menuService.listar({ desde, hasta, servicio: null, localId: null }).subscribe({
      next: menus => {
        this.menus.set(menus);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
    // Los feriados exigen CALENDARIO_GESTIONAR; sin ese permiso solo se grisan los días sin atención.
    if (this.auth.tienePermiso('CALENDARIO_GESTIONAR')) {
      this.diaNoAtencionService.listar({ desde, hasta, localId: null }).subscribe({
        next: feriados => this.feriados.set(feriados),
        error: () => this.feriados.set([]),
      });
    }
  }

  protected menu(fecha: string, servicio: string): MenuDia | undefined {
    return this.porCelda().get(`${fecha}|${servicio}`);
  }

  protected feriado(fecha: string): string | undefined {
    return this.feriadoPorFecha().get(fecha);
  }

  // Grisado si el servicio no se atiende ese día de la semana (p. ej. cena del viernes) o es feriado.
  protected atiende(fecha: string, servicio: string): boolean {
    return this.catalogos.seAtiende(servicio, diaSemanaIso(fecha)) && !this.feriado(fecha);
  }

  abrirEditor(fecha: string, servicio: string): void {
    if (!this.gestiona || !this.atiende(fecha, servicio)) return;
    this.editando.set({ fecha, servicio });
    this.elegidos.set(new Set(this.menu(fecha, servicio)?.platos.map(p => p.platoId) ?? []));
    this.errorModal.set(null);
  }

  alternar(platoId: number): void {
    this.elegidos.update(actual => {
      const nuevo = new Set(actual);
      if (nuevo.has(platoId)) nuevo.delete(platoId);
      else nuevo.add(platoId);
      return nuevo;
    });
  }

  guardarCelda(): void {
    const celda = this.editando();
    if (!celda) return;
    this.ejecutar(
      this.menuService.guardar({ fecha: celda.fecha, servicio: celda.servicio, platoIds: [...this.elegidos()] }),
      () => this.editando.set(null),
      'Menú guardado.',
    );
  }

  abrirClonar(fecha?: string): void {
    const origen = fecha ?? this.hoy;
    this.formClonar.reset({ fechaOrigen: origen, fechaDestino: sumarDias(origen, 1), D: true, A: true, C: true });
    this.errorModal.set(null);
    this.clonando.set(true);
  }

  clonar(): void {
    const v = this.formClonar.getRawValue();
    const servicios = SERVICIOS.filter(s => v[s as 'D' | 'A' | 'C']);
    if (this.formClonar.invalid || servicios.length === 0) {
      this.errorModal.set('Elija las fechas y al menos un servicio.');
      return;
    }
    if (v.fechaOrigen === v.fechaDestino) {
      this.errorModal.set('La fecha destino debe ser distinta de la de origen.');
      return;
    }
    this.ejecutar(
      this.menuService.clonar({ fechaOrigen: v.fechaOrigen, fechaDestino: v.fechaDestino, servicios }),
      () => this.clonando.set(false),
      'Día clonado.',
    );
  }

  abrirCopiar(fecha?: string): void {
    this.formCopiar.reset({ fecha: fecha ?? this.hoy });
    this.errorModal.set(null);
    this.copiando.set(true);
  }

  copiarACena(): void {
    if (this.formCopiar.invalid) return;
    this.ejecutar(
      this.menuService.copiarACena({ fecha: this.formCopiar.getRawValue().fecha }),
      () => this.copiando.set(false),
      'Segundos del almuerzo copiados a la cena.',
    );
  }

  cerrarModales(): void {
    if (this.guardando()) return;
    this.editando.set(null);
    this.clonando.set(false);
    this.copiando.set(false);
  }

  private ejecutar(peticion: Observable<unknown>, alTerminar: () => void, exito: string): void {
    this.guardando.set(true);
    this.errorModal.set(null);
    this.mensaje.set(null);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        alTerminar();
        this.mensaje.set(exito);
        this.cargarSemana();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorModal.set(mensajeError(err));
      },
    });
  }
}
