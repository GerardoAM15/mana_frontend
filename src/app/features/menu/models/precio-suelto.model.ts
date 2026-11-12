// PrecioSueltoResponseDTO: precio de un plato suelto por servicio y categoría.
// Su clave es (servicio, categoria): PUT/DELETE /precios-sueltos/{servicio}/{categoria}.
export interface PrecioSuelto {
  servicio: string;
  categoria: string;
  precio: number;
  recargoLlevar: number;
  activo: boolean;
}

export interface PrecioSueltoRequest {
  servicio: string;
  categoria: string;
  precio: number;
  recargoLlevar: number;
  activo: boolean;
}
