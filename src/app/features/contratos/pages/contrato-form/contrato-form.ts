import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { CajaEstadoService } from '../../../../core/services/caja-estado.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { hoy, sumarDias } from '../../../../core/utils/fechas';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { EstadoPagos } from '../../../../core/utils/pagos';
import { AvisoCaja } from '../../../../shared/components/aviso-caja/aviso-caja';
import { SelectorPagos } from '../../../../shared/components/selector-pagos/selector-pagos';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { Plan } from '../../../planes/models/plan.model';
import { PlanService } from '../../../planes/services/plan-service';
import { Contrato, SimulacionContrato, SimularContratoRequest } from '../../models/contrato.model';
import { ContratoService } from '../../services/contrato-service';
import { esRenovable } from '../../utils/renovacion';

// Nuevo contrato (/contratos/nuevo) y renovación (/contratos/:id/renovar) en una sola pantalla.
@Component({
  selector: 'app-contrato-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, AvisoCaja, SelectorPagos],
  templateUrl: './contrato-form.html',
  styleUrl: './contrato-form.css',
})
export class ContratoForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly contratoService = inject(ContratoService);
  private readonly clienteService = inject(ClienteService);
  private readonly planService = inject(PlanService);
  private readonly router = inject(Router);
  protected readonly cajaEstado = inject(CajaEstadoService);
  protected readonly catalogos = inject(CatalogoService);

  // :id del contrato a renovar.
  readonly id = input<string>();
  // ?clienteId= al venir desde el detalle del cliente o tras crearlo.
  readonly clienteId = input<string>();

  protected readonly hoy = hoy();
  protected readonly planes = signal<Plan[]>([]);
  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly anterior = signal<Contrato | null>(null);
  protected readonly dniNoEncontrado = signal<string | null>(null);
  protected readonly buscandoCliente = signal(false);
  protected readonly servicios = signal<string[]>([]);
  protected readonly simulacion = signal<SimulacionContrato | null>(null);
  protected readonly simulando = signal(false);
  protected readonly errorSimulacion = signal<string | null>(null);
  protected readonly pagos = signal<EstadoPagos | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});

  protected readonly form = this.fb.group({
    dni: ['', [Validators.pattern(/^\d{8}$/)]],
    planId: this.fb.control<number | null>(null, Validators.required),
    fechaInicio: [this.hoy, Validators.required],
  });
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly esRenovacion = computed(() => !!this.id());
  protected readonly plan = computed(() => this.planes().find(p => p.id === Number(this.valores().planId)) ?? null);
  // En la renovación la fecha la fija el backend: max(hoy, fin anterior + 1).
  protected readonly fechaInicio = computed(() => {
    const anterior = this.anterior();
    if (anterior) {
      const siguiente = sumarDias(anterior.fechaFin, 1);
      return siguiente > this.hoy ? siguiente : this.hoy;
    }
    return this.valores().fechaInicio ?? '';
  });
  protected readonly renovable = computed(() => {
    const anterior = this.anterior();
    return !anterior || esRenovable(anterior, this.hoy);
  });

  private readonly solicitud = computed<SimularContratoRequest | null>(() => {
    const cliente = this.cliente();
    const plan = this.plan();
    const fechaInicio = this.fechaInicio();
    const servicios = this.servicios();
    if (!cliente || !plan || !fechaInicio || fechaInicio < this.hoy || servicios.length === 0) return null;
    return { clienteId: cliente.id, planId: plan.id, fechaInicio, servicios };
  });

  protected readonly total = computed(() => this.simulacion()?.total ?? 0);
  protected readonly puedeRegistrar = computed(
    () =>
      !!this.simulacion() &&
      !this.simulando() &&
      !!this.pagos()?.valido &&
      this.cajaEstado.abierta() &&
      !!this.cliente()?.activo &&
      this.renovable() &&
      !this.guardando(),
  );

  constructor() {
    // Al cambiar de plan se marcan todos sus servicios.
    this.form.controls.planId.valueChanges.pipe(takeUntilDestroyed()).subscribe(planId => {
      const plan = this.planes().find(p => p.id === Number(planId));
      this.servicios.set(plan ? [...plan.servicios] : []);
    });

    // Simulación en vivo: cada cambio de cliente, plan, fecha o servicios llama a POST /contratos/simular.
    toObservable(this.solicitud)
      .pipe(
        map(solicitud => (solicitud ? JSON.stringify(solicitud) : null)),
        distinctUntilChanged(),
        tap(clave => {
          this.simulacion.set(null);
          this.errorSimulacion.set(null);
          this.simulando.set(!!clave);
        }),
        debounceTime(400),
        switchMap(clave => {
          if (!clave) return of(null);
          return this.contratoService.simular(JSON.parse(clave) as SimularContratoRequest).pipe(
            catchError((err: HttpErrorResponse) => {
              this.errorSimulacion.set(mensajeError(err));
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(simulacion => {
        this.simulacion.set(simulacion);
        this.simulando.set(false);
      });
  }

  ngOnInit(): void {
    this.catalogos.cargar().subscribe({ error: () => undefined });
    this.planService.listar().subscribe({
      next: planes => {
        this.planes.set(planes.filter(p => p.activo));
        this.cargarDatosIniciales();
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  buscarCliente(): void {
    const dni = this.form.controls.dni.value.trim();
    if (!/^\d{8}$/.test(dni)) {
      this.form.controls.dni.markAsTouched();
      return;
    }

    this.buscandoCliente.set(true);
    this.dniNoEncontrado.set(null);
    this.cliente.set(null);
    this.clienteService.buscar(dni, 0, 10).subscribe({
      next: pagina => {
        const cliente = pagina.contenido.find(c => c.dni === dni) ?? null;
        this.cliente.set(cliente);
        if (!cliente) this.dniNoEncontrado.set(dni);
        this.buscandoCliente.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.buscandoCliente.set(false);
      },
    });
  }

  cambiarCliente(): void {
    this.cliente.set(null);
    this.dniNoEncontrado.set(null);
  }

  alternarServicio(servicio: string, marcado: boolean): void {
    this.servicios.update(lista => (marcado ? [...lista, servicio] : lista.filter(s => s !== servicio)));
  }

  registrar(): void {
    const solicitud = this.solicitud();
    const pagos = this.pagos();
    if (!solicitud || !pagos?.valido || !this.puedeRegistrar()) return;

    const anterior = this.anterior();
    const peticion = anterior
      ? this.contratoService.renovar(anterior.id, { planId: solicitud.planId, servicios: solicitud.servicios, pagos: pagos.pagos })
      : this.contratoService.crear({ ...solicitud, pagos: pagos.pagos });

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});
    peticion.subscribe({
      next: contrato => this.router.navigate(['/contratos', contrato.id]),
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }

  private cargarDatosIniciales(): void {
    const id = this.id();
    if (id) {
      this.contratoService.obtener(Number(id)).subscribe({
        next: contrato => {
          this.anterior.set(contrato);
          this.form.controls.fechaInicio.disable();
          this.cargarCliente(contrato.clienteId);
          // Mismo plan y servicios por defecto; el usuario puede cambiarlos.
          this.form.controls.planId.setValue(contrato.planId);
          const delPlan = this.plan()?.servicios ?? [];
          this.servicios.set(contrato.detalles.map(d => d.servicio).filter(s => delPlan.includes(s)));
        },
        error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
      });
      return;
    }

    const clienteId = this.clienteId();
    if (clienteId) this.cargarCliente(Number(clienteId));
  }

  private cargarCliente(id: number): void {
    this.clienteService.obtener(id).subscribe({
      next: cliente => {
        this.cliente.set(cliente);
        this.form.controls.dni.setValue(cliente.dni);
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}
