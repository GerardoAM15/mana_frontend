// PagoRequestDTO: se usa al registrar o renovar contratos y al cobrar ventas.
export interface PagoRequest {
  metodo: string;
  monto: number;
  referencia?: string;
}
