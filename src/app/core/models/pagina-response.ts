export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
  ultima: boolean;
}

export function normalizarPagina<T>(
  respuesta: PaginaResponse<T> | T[],
  pagina: number,
  tamanio: number,
): PaginaResponse<T> {
  if (!Array.isArray(respuesta)) return respuesta;

  const totalElementos = respuesta.length;
  const totalPaginas = Math.ceil(totalElementos / tamanio);
  const inicio = pagina * tamanio;
  return {
    contenido: respuesta.slice(inicio, inicio + tamanio),
    pagina,
    tamanio,
    totalElementos,
    totalPaginas,
    ultima: pagina + 1 >= totalPaginas,
  };
}
