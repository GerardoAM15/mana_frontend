const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "2026-11" -> "nov 2026"; "2026-11-03" -> "03/11/2026"; otro texto se devuelve igual.
export function etiquetaPeriodo(periodo: string): string {
  const mes = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (mes) return `${MESES[Number(mes[2]) - 1]} ${mes[1]}`;
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(periodo);
  if (dia) return `${dia[3]}/${dia[2]}/${dia[1]}`;
  return periodo;
}
