// ============================================================
// UTILS — Formateo de precios en pesos colombianos (COP)
// ============================================================

/**
 * Formatea un número como precio en pesos colombianos.
 * Ejemplo: formatCOP(150000) → "$150.000"
 */
export function formatCOP(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Extrae el precio numérico desde un valor Decimal de Prisma (que llega como string).
 */
export function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}
