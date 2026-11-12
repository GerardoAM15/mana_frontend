export function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function sumar(valores: number[]): number {
  return redondear(valores.reduce((total, valor) => total + valor, 0));
}
