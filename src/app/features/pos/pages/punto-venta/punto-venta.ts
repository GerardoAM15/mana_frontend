import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CajaEstadoService } from '../../../../core/services/caja-estado.service';
import { CatalogoService } from '../../../../core/services/catalogo-service';
import { aPlatosCantidad, cumpleComposicion, Seleccion } from '../../../../core/utils/composicion';
import { diaSemanaIso, horaActual, hoy } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/http-error';
import { EstadoPagos } from '../../../../core/utils/pagos';
import { servicioInicial, servicioPorHora } from '../../../../core/utils/servicios';
import { AvisoCaja } from '../../../../shared/components/aviso-caja/aviso-caja';
import { ConfirmarDialogo } from '../../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { SelectorComposicion } from '../../../../shared/components/selector-composicion/selector-composicion';
import { SelectorPagos } from '../../../../shared/components/selector-pagos/selector-pagos';
import { ReglaCobro } from '../../../menu/models/regla-cobro.model';
import { DatosComprobante } from '../../../comprobantes/components/datos-comprobante/datos-comprobante';
import { TarjetaComprobante } from '../../../comprobantes/components/tarjeta-comprobante/tarjeta-comprobante';
import { Comprobante } from '../../../comprobantes/models/comprobante.model';
import { EstadoComprobanteSolicitud } from '../../../comprobantes/utils/comprobante';
import { TicketVenta } from '../../../ventas/components/ticket-venta/ticket-venta';
import { Venta } from '../../../ventas/models/venta.model';
import { VentaService } from '../../../ventas/services/venta-service';
import { BebidaPos, PlatoSueltoPos, PosCatalogo } from '../../models/pos-catalogo.model';
import { PosService } from '../../services/pos-service';
import { aLineasVenta, calcularTotales, LineaPedido, subtotalLinea } from '../../utils/totales';

type Pestania = 'menus' | 'sueltos' | 'bebidas';
const SERVICIOS = ['D', 'A', 'C'];

@Component({
  selector: 'app-punto-venta',
  imports: [
    RouterLink,
    CurrencyPipe,
    AvisoCaja,
    ConfirmarDialogo,
    SelectorComposicion,
    SelectorPagos,
    TicketVenta,
    DatosComprobante,
    TarjetaComprobante,
  ],
  templateUrl: './punto-venta.html',
  styleUrl: './punto-venta.css',
})
export class PuntoVenta implements OnInit {
  private readonly posService = inject(PosService);
  private readonly ventaService = inject(VentaService);
  protected readonly cajaEstado = inject(CajaEstadoService);
  protected readonly catalogos = inject(CatalogoService);

  protected readonly servicios = SERVICIOS;
  // Día ISO de hoy en Lima: los servicios que no se atienden hoy (p. ej. la cena el viernes) se deshabilitan.
  private readonly diaHoy = diaSemanaIso(hoy());
  protected readonly servicio = signal(servicioPorHora(horaActual()));
  // true si hoy no se atiende ningún servicio: no se carga el catálogo.
  protected readonly sinServicioHoy = signal(false);
  protected readonly catalogo = signal<PosCatalogo | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pestania = signal<Pestania>('menus');

  protected readonly reglas = computed(() => this.catalogo()?.reglas.filter(r => r.activo) ?? []);
  protected readonly platosMenu = computed(() => this.catalogo()?.menu?.platos ?? []);

  // Panel para elegir los platos de un menú.
  protected readonly combo = signal<ReglaCobro | null>(null);
  protected readonly seleccionCombo = signal<Seleccion>({});
  protected readonly comboCompleto = computed(() => {
    const regla = this.combo();
    return !!regla && cumpleComposicion(regla.componentes, this.platosMenu(), this.seleccionCombo());
  });

  // Pedido.
  protected readonly lineas = signal<LineaPedido[]>([]);
  protected readonly paraLlevar = signal(false);
  protected readonly totales = computed(() => calcularTotales(this.lineas(), this.paraLlevar()));
  protected readonly cobrando = signal(false);
  protected readonly pagos = signal<EstadoPagos | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorVenta = signal<string | null>(null);
  protected readonly venta = signal<Venta | null>(null);
  // Boleta o factura pedida al cobrar y el comprobante de la venta registrada.
  protected readonly solicitudComprobante = signal<EstadoComprobanteSolicitud | null>(null);
  protected readonly comprobante = signal<Comprobante | null>(null);
  protected readonly pidioComprobante = signal(false);
  protected readonly puedeVender = computed(
    () => this.lineas().length > 0 && this.cajaEstado.abierta() && !this.guardando(),
  );

  ngOnInit(): void {
    // Los días de atención vienen de los catálogos: se espera a tenerlos para elegir el servicio.
    this.catalogos.cargar().subscribe({
      next: () => this.iniciarServicio(),
      // Sin catálogos no se puede saber qué se atiende hoy; el backend responde si no corresponde.
      error: () => this.cargarCatalogo(),
    });
  }

  // Los feriados del local no se consultan aquí (exigen CALENDARIO_GESTIONAR): si hoy es feriado,
  // el backend responde con su mensaje y se muestra como error.
  protected atiendeHoy(servicio: string): boolean {
    return this.catalogos.seAtiende(servicio, this.diaHoy);
  }

  private iniciarServicio(): void {
    const inicial = servicioInicial(SERVICIOS.filter(s => this.atiendeHoy(s)), servicioPorHora(horaActual()));
    if (!inicial) {
      this.sinServicioHoy.set(true);
      this.cargando.set(false);
      return;
    }
    this.servicio.set(inicial);
    this.cargarCatalogo();
  }

  elegirServicio(servicio: string): void {
    if (servicio === this.servicio() || !this.atiendeHoy(servicio)) return;
    this.servicio.set(servicio);
    // Cada venta es de un solo servicio: al cambiarlo se vacía el pedido.
    this.lineas.set([]);
    this.cargarCatalogo();
  }

  cargarCatalogo(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.posService.catalogo(this.servicio()).subscribe({
      next: catalogo => {
        this.catalogo.set(catalogo);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.catalogo.set(null);
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  abrirCombo(regla: ReglaCobro): void {
    this.combo.set(regla);
    this.seleccionCombo.set({});
  }

  agregarCombo(): void {
    const regla = this.combo();
    if (!regla || !this.comboCompleto()) return;

    const platos = aPlatosCantidad(this.seleccionCombo()).sort((a, b) => a.platoId - b.platoId);
    const nombres = new Map(this.platosMenu().map(p => [p.platoId, p.nombre]));
    this.agregar({
      clave: `C:${regla.id}:${platos.map(p => `${p.platoId}x${p.cantidad}`).join(',')}`,
      tipo: 'COMBO',
      descripcion: regla.nombre,
      detalle: platos.map(p => `${p.cantidad > 1 ? p.cantidad + '× ' : ''}${nombres.get(p.platoId) ?? p.platoId}`),
      cantidad: 1,
      precioUnitario: regla.precioCombo,
      recargoUnitario: regla.recargoLlevar,
      reglaId: regla.id,
      platos,
    });
    this.combo.set(null);
  }

  agregarSuelto(suelto: PlatoSueltoPos): void {
    this.agregar({
      clave: `P:${suelto.platoId}`,
      tipo: 'PLATO',
      descripcion: suelto.nombre,
      detalle: [this.catalogos.nombreCategoria(suelto.categoria)],
      cantidad: 1,
      precioUnitario: suelto.precio,
      recargoUnitario: suelto.recargoLlevar,
      platoId: suelto.platoId,
    });
  }

  agregarBebida(bebida: BebidaPos): void {
    if (this.enPedido(`B:${bebida.bebidaId}`) >= bebida.stock) return;
    this.agregar({
      clave: `B:${bebida.bebidaId}`,
      tipo: 'BEBIDA',
      descripcion: bebida.nombre,
      detalle: [],
      cantidad: 1,
      precioUnitario: bebida.precioVenta,
      recargoUnitario: 0,
      bebidaId: bebida.bebidaId,
      stock: bebida.stock,
    });
  }

  cambiarCantidad(linea: LineaPedido, delta: number): void {
    const nueva = linea.cantidad + delta;
    if (linea.stock !== undefined && nueva > linea.stock) return;
    this.lineas.update(lineas =>
      nueva <= 0 ? lineas.filter(l => l.clave !== linea.clave) : lineas.map(l => (l.clave === linea.clave ? { ...l, cantidad: nueva } : l)),
    );
  }

  vaciar(): void {
    this.lineas.set([]);
    this.paraLlevar.set(false);
    this.errorVenta.set(null);
  }

  protected enPedido(clave: string): number {
    return this.lineas().find(l => l.clave === clave)?.cantidad ?? 0;
  }

  protected subtotal(linea: LineaPedido): number {
    return subtotalLinea(linea, this.paraLlevar());
  }

  abrirCobro(): void {
    if (!this.puedeVender()) return;
    this.pagos.set(null);
    this.solicitudComprobante.set(null);
    this.errorVenta.set(null);
    this.cobrando.set(true);
  }

  // Con pagos la venta queda PAGADA; sin pagos, PENDIENTE.
  registrar(conPagos: boolean): void {
    const pagos = this.pagos();
    // El comprobante solo va con pagos: una venta pendiente se factura al cobrarla.
    const comprobante = conPagos ? this.solicitudComprobante()?.solicitud ?? null : null;
    if (!this.puedeVender() || (conPagos && (!pagos?.valido || this.solicitudComprobante()?.valido === false))) return;

    this.guardando.set(true);
    this.errorVenta.set(null);
    this.ventaService
      .registrar({
        servicio: this.servicio(),
        paraLlevar: this.paraLlevar(),
        lineas: aLineasVenta(this.lineas()),
        ...(conPagos && pagos ? { pagos: pagos.pagos } : {}),
        ...(comprobante ? { comprobante } : {}),
      })
      .subscribe({
        next: venta => {
          this.guardando.set(false);
          this.cobrando.set(false);
          this.comprobante.set(null);
          this.pidioComprobante.set(!!comprobante);
          this.venta.set(venta);
          this.vaciar();
          this.cargarCatalogo();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.errorVenta.set(mensajeError(err));
        },
      });
  }

  nuevaVenta(): void {
    this.venta.set(null);
    this.comprobante.set(null);
    this.pidioComprobante.set(false);
  }

  imprimir(): void {
    window.print();
  }

  // Si ya hay una línea igual (mismo menú con los mismos platos, mismo suelto o bebida), suma 1.
  private agregar(linea: LineaPedido): void {
    this.errorVenta.set(null);
    this.lineas.update(lineas =>
      lineas.some(l => l.clave === linea.clave)
        ? lineas.map(l => (l.clave === linea.clave ? { ...l, cantidad: l.cantidad + 1 } : l))
        : [...lineas, linea],
    );
  }
}
