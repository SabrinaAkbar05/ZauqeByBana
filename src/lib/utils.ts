export const money = (value: number | string | null | undefined) =>
  `PKR ${Number(value ?? 0).toLocaleString('en-PK', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
export const dateLabel = (value: string | null | undefined) =>
  value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const customerName = (value: unknown): string => {
  if (Array.isArray(value)) return String(value[0]?.full_name ?? 'Unknown');
  if (value && typeof value === 'object' && 'full_name' in value) return String(value.full_name ?? 'Unknown');
  return 'Unknown';
};
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong';
export const calcQuoteTotal = (lines: Array<{quantity: number | string; unit_price: number | string}>, discount = 0, taxRate = 0) => {
  const subtotal = lines.reduce((sum, row) => sum + Number(row.quantity) * Number(row.unit_price), 0);
  return Math.round(Math.max(0, subtotal - Number(discount)) * (1 + Number(taxRate) / 100) * 100) / 100;
};
