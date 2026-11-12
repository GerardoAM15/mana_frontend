import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { ConsultaDocumentoService, mensajeConsulta } from '../../../../core/services/consulta-documento.service';
import { TipoSolicitudComprobante } from '../../models/comprobante.model';
import { ComprobanteService } from '../../services/comprobante-service';
import { DNI, estadoSolicitud, EstadoComprobanteSolicitud, RUC } from '../../utils/comprobante';

// Selector Ticket / Boleta / Factura con los datos del cliente. Emite el bloque `comprobante` del request
// (null = Ticket, el comportamiento de siempre). Si la facturación está apagada o falta COMPROBANTE_EMITIR,
// no muestra nada y emite Ticket.
// Uso: <app-datos-comprobante [total]="total()" (cambio)="comprobante.set($event)" />
@Component({
  selector: 'app-datos-comprobante',
  imports: [ReactiveFormsModule],
  templateUrl: './datos-comprobante.html',
  styleUrl: './datos-comprobante.css',
})
export class DatosComprobante {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly consultas = inject(ConsultaDocumentoService);
  private readonly auth = inject(AuthService);

  readonly total = input.required<number>();
  readonly deshabilitado = input(false);
  // Datos para precargar la boleta (p. ej. el DNI y nombre del cliente del contrato).
  readonly documentoInicial = input('');
  readonly nombreInicial = input('');
  readonly cambio = output<EstadoComprobanteSolicitud>();

  protected readonly tipos: { valor: TipoSolicitudComprobante; etiqueta: string }[] = [
    { valor: 'TICKET', etiqueta: 'Ticket' },
    { valor: 'BOLETA', etiqueta: 'Boleta' },
    { valor: 'FACTURA', etiqueta: 'Factura' },
  ];

  protected readonly configuracion = toSignal(inject(ComprobanteService).configuracion(), { initialValue: null });
  protected readonly visible = computed(
    () => !!this.configuracion()?.habilitada && this.auth.tienePermiso('COMPROBANTE_EMITIR'),
  );
  protected readonly umbral = computed(() => this.configuracion()?.boletaMontoIdentificacion ?? 700);

  protected readonly form = this.fb.group({
    tipo: this.fb.control<TipoSolicitudComprobante>('TICKET'),
    numDoc: [''],
    nombre: [''],
    direccion: [''],
    email: [''],
  });
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly tipo = computed(() => this.valores().tipo ?? 'TICKET');

  protected readonly estado = computed<EstadoComprobanteSolicitud>(() => {
    if (!this.visible()) return { valido: true, solicitud: null, error: null };
    this.valores(); // dependencia: se recalcula con cada cambio del formulario
    return estadoSolicitud(this.form.getRawValue(), this.total(), this.umbral());
  });
  protected readonly documentoObligatorio = computed(() => this.tipo() === 'BOLETA' && this.total() >= this.umbral());

  protected readonly buscando = signal(false);
  protected readonly aviso = signal<string | null>(null);
  private ultimoConsultado = '';

  constructor() {
    // El estado depende de los valores del formulario (signal) y del total.
    effect(() => this.cambio.emit(this.estado()));

    effect(() => {
      const doc = this.documentoInicial();
      const nombre = this.nombreInicial();
      untracked(() => {
        if (doc && !this.form.controls.numDoc.value) {
          this.ultimoConsultado = doc;
          this.form.patchValue({ numDoc: doc, nombre: this.form.controls.nombre.value || nombre });
        }
      });
    });

    effect(() => {
      if (this.deshabilitado()) this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    });

    // Autocompletado al llegar a 8 (DNI) u 11 (RUC) dígitos; nunca bloquea.
    this.form.controls.numDoc.valueChanges.pipe(takeUntilDestroyed()).subscribe(valor => {
      const doc = valor.trim();
      if (doc !== this.ultimoConsultado && ((this.tipo() === 'BOLETA' && DNI.test(doc)) || RUC.test(doc))) this.buscar();
    });
  }

  elegir(tipo: TipoSolicitudComprobante): void {
    if (this.deshabilitado() || tipo === this.tipo()) return;
    this.aviso.set(null);
    // Un DNI no sirve para factura: se limpia al cambiar.
    if (tipo === 'FACTURA' && !RUC.test(this.form.controls.numDoc.value.trim())) {
      this.form.patchValue({ tipo, numDoc: '', nombre: '', direccion: '' }); // el correo se conserva
      this.ultimoConsultado = '';
    } else {
      this.form.controls.tipo.setValue(tipo);
    }
  }

  buscar(): void {
    const doc = this.form.controls.numDoc.value.trim();
    const esRuc = RUC.test(doc);
    if (!esRuc && !(this.tipo() === 'BOLETA' && DNI.test(doc))) {
      this.form.controls.numDoc.markAsTouched();
      return;
    }
    this.ultimoConsultado = doc;
    this.buscando.set(true);
    this.aviso.set(null);
    if (esRuc) {
      this.consultas.ruc(doc).subscribe({
        next: r => {
          this.buscando.set(false);
          this.form.patchValue({ nombre: r.razonSocial, direccion: r.direccion ?? '' });
          if (r.estado && r.estado !== 'ACTIVO') this.aviso.set(`SUNAT reporta el RUC como ${r.estado}${r.condicion ? ' / ' + r.condicion : ''}.`);
        },
        error: (err: HttpErrorResponse) => this.fallo(err),
      });
    } else {
      this.consultas.dni(doc).subscribe({
        next: r => {
          this.buscando.set(false);
          this.form.patchValue({ nombre: `${r.nombre} ${r.apellido}`.trim() });
        },
        error: (err: HttpErrorResponse) => this.fallo(err),
      });
    }
  }

  // Después de registrar: vuelve a Ticket con los campos vacíos.
  reiniciar(): void {
    this.ultimoConsultado = '';
    this.aviso.set(null);
    this.form.reset({ tipo: 'TICKET', numDoc: '', nombre: '', direccion: '', email: '' });
  }

  private fallo(err: HttpErrorResponse): void {
    this.buscando.set(false);
    this.aviso.set(mensajeConsulta(err));
  }
}
