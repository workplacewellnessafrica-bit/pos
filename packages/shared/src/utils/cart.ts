import type { CartItem, CartTotals } from '../types/index.js';

/**
 * Calculate cart totals given line items and a tax rate.
 * Tax rate is a percentage, e.g. 16 for 16% VAT.
 * taxInclusive = true  → tax is embedded in the unit price
 * taxInclusive = false → tax is added on top of subtotal
 */
export function calculateCartTotals(
  items: CartItem[],
  taxRate: number,
  taxInclusive: boolean,
): CartTotals {
  const subtotal = items.reduce((sum, item) => {
    const lineSubtotal = item.unitPrice * item.quantity;
    return sum + lineSubtotal - item.discount;
  }, 0);

  const discountTotal = items.reduce((sum, item) => sum + item.discount, 0);

  let taxAmount: number;
  let total: number;

  if (taxInclusive) {
    // VAT already in the price: taxAmount = subtotal * rate / (100 + rate)
    taxAmount = subtotal * taxRate / (100 + taxRate);
    total = subtotal;
  } else {
    taxAmount = subtotal * taxRate / 100;
    total = subtotal + taxAmount;
  }

  return {
    subtotal: round2(subtotal),
    discountTotal: round2(discountTotal),
    taxAmount: round2(taxAmount),
    total: round2(total),
  };
}

/** Round to 2 decimal places (avoid floating point drift) */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Calculate change due for cash payment */
export function calculateChange(total: number, amountTendered: number): number {
  return round2(Math.max(0, amountTendered - total));
}

/** Format currency for display (defaults to KES) */
export function formatCurrency(
  amount: number | string,
  currency = 'KES',
  locale = 'en-KE',
): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}
