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

  let s = String(input).replace(/\$/g, '').trim();
  if (!s) return 0;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    // Ej: 1.700.000,50 (AR) o 1,700,000.50 (US)
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (lastComma > -1) {
    const commaCount = (s.match(/,/g) || []).length;
    const decimalPos = s.length - lastComma - 1;
    if (commaCount > 1 || (commaCount === 1 && decimalPos > 2)) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
  } else if (lastDot > -1) {
    const dotCount = (s.match(/\./g) || []).length;
    const decimalPos = s.length - lastDot - 1;
    if (dotCount > 1 || (dotCount === 1 && decimalPos > 2)) {
      s = s.replace(/\./g, '');
    }
  }

  s = s.replace(/[.,]$/, '');

  const num = parseFloat(s);
  return Number.isFinite(num) ? num : 0;
}

export function formatCurrencyNoSymbol(value) {
  return formatCurrency(value).replace('$', '').trim();
}

// Redondeo de boletas al millar más cercano hacia arriba — uso comercial informal
// (no bancario) para poder cobrar en efectivo sin necesitar monedas/billetes chicos.
export function roundUpToThousand(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const safe = Number.isFinite(num) ? num : 0;
  return Math.ceil(safe / 1000) * 1000;
}



