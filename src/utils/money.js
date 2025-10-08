// Money and formatting utilities shared across the app

export function formatCurrency(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function parseCurrencyValue(input) {
  if (input == null) return 0;
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0;
  // Remove currency symbol and locale separators
  const normalized = String(input)
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
}

export function formatCurrencyNoSymbol(value) {
  return formatCurrency(value).replace('$', '').trim();
}



