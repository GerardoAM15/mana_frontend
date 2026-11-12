export type TipoSolicitudComprobante = 'TICKET' | 'BOLETA' | 'FACTURA';
export type TipoComprobante = 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO';
export type EstadoComprobante = 'PENDIENTE' | 'ACEPTADO' | 'OBSERVADO' | 'RECHAZADO' | 'ERROR' | 'ANULADO';
export type AmbienteFacturacion = 'BETA' | 'PRODUCCION';
// '0' sin documento (CLIENTES VARIOS), '1' DNI, '6' RUC.
export type TipoDocReceptor = '0' | '1' | '6';

// ComprobanteRequestDTO: bloque opcional `comprobante` de ventas y contratos, y body de POST /comprobantes/ventas|contratos/{id}.
export interface ComprobanteRequest {
  tipo: TipoSolicitudComprobante;
  receptorTipoDoc?: TipoDocReceptor;
  receptorNumDoc?: string;
  receptorNombre?: string;
  receptorDireccion?: string;
  // Opcional: se le envía el PDF y el XML cuando SUNAT acepta.
  receptorEmail?: string;
}

// ComprobanteDetalleResponseDTO.
export interface LineaComprobante {
  item: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  valorUnitario: number;
  precioUnitario: number;
  valorVenta: number;
  igv: number;
  total: number;
}

// ComprobanteResponseDTO.
export interface Comprobante {
  id: number;
  localId: number;
  ventaId: number | null;
  contratoId: number | null;
  referenciaId: number | null;
  referenciaNumero: string | null;
  tipo: TipoComprobante;
  tipoSunat: string;
  serie: string;
  numero: number;
  numeroCompleto: string;
  fecha: string;
  moneda: string;
  rucEmisor: string;
  receptorTipoDoc: TipoDocReceptor;
  receptorNumDoc: string | null;
  receptorNombre: string;
  receptorDireccion: string | null;
  porcentajeIgv: number;
  opGravadas: number;
  igv: number;
  total: number;
  estado: EstadoComprobante;
  ambiente: AmbienteFacturacion;
  sunatCodigo: string | null;
  sunatMensaje: string | null;
  hash: string | null;
  intentos: number;
  ultimoIntentoEn: string | null;
  motivoCodigo: string | null;
  motivoDescripcion: string | null;
  lineas: LineaComprobante[];
  receptorEmail: string | null;
  // Último envío por correo; null = no enviado.
  correoEnviadoEn: string | null;
}

// ComprobanteConfiguracionDTO (GET /comprobantes/configuracion).
export interface ConfiguracionComprobantes {
  habilitada: boolean;
  ambiente: AmbienteFacturacion;
  igvPorcentaje: number;
  boletaMontoIdentificacion: number;
  rucEmisor: string;
  razonSocialEmisor: string;
}

// Filtros de GET /comprobantes.
export interface FiltroComprobantes {
  desde: string | null;
  hasta: string | null;
  tipo: TipoComprobante | null;
  estado: EstadoComprobante | null;
}
