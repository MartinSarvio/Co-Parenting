/**
 * Kilopris / literpris / stk-pris beregning
 *
 * Parser unit-strenge som "500g", "1.5L", "4 pk", "12 stk"
 * og beregner enhedspris for prissammenligning.
 */

export interface UnitPriceResult {
  unitPrice: number;
  unitLabel: string;
  formatted: string;
}

export function calculateUnitPrice(price: number, unit?: string): UnitPriceResult | null {
  if (!unit || price <= 0) return null;

  const n = unit.trim().toLowerCase();

  // Weight: grams → kilopris
  const gMatch = n.match(/^(\d+(?:[.,]\d+)?)\s*g$/);
  if (gMatch) {
    const grams = parseFloat(gMatch[1].replace(',', '.'));
    if (grams > 0) {
      const kp = price / (grams / 1000);
      return { unitPrice: kp, unitLabel: 'pr. kg', formatted: `${fmt(kp)} kr/kg` };
    }
  }

  // Weight: kilograms → kilopris
  const kgMatch = n.match(/^(\d+(?:[.,]\d+)?)\s*kg$/);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1].replace(',', '.'));
    if (kg > 0) {
      const kp = price / kg;
      return { unitPrice: kp, unitLabel: 'pr. kg', formatted: `${fmt(kp)} kr/kg` };
    }
  }

  // Volume: centiliters → literpris
  const clMatch = n.match(/^(\d+(?:[.,]\d+)?)\s*cl$/);
  if (clMatch) {
    const cl = parseFloat(clMatch[1].replace(',', '.'));
    if (cl > 0) {
      const lp = price / (cl / 100);
      return { unitPrice: lp, unitLabel: 'pr. L', formatted: `${fmt(lp)} kr/L` };
    }
  }

  // Volume: milliliters → literpris
  const mlMatch = n.match(/^(\d+(?:[.,]\d+)?)\s*ml$/);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1].replace(',', '.'));
    if (ml > 0) {
      const lp = price / (ml / 1000);
      return { unitPrice: lp, unitLabel: 'pr. L', formatted: `${fmt(lp)} kr/L` };
    }
  }

  // Volume: liters → literpris
  const lMatch = n.match(/^(\d+(?:[.,]\d+)?)\s*l$/);
  if (lMatch) {
    const liters = parseFloat(lMatch[1].replace(',', '.'));
    if (liters > 0) {
      const lp = price / liters;
      return { unitPrice: lp, unitLabel: 'pr. L', formatted: `${fmt(lp)} kr/L` };
    }
  }

  // Count: "N stk", "N pk", "N ruller", "N pakker"
  const countMatch = n.match(/^(\d+)\s*(stk|pk|ruller|pakker)$/);
  if (countMatch) {
    const count = parseInt(countMatch[1]);
    if (count > 1) {
      const sp = price / count;
      return { unitPrice: sp, unitLabel: 'pr. stk.', formatted: `${fmt(sp)} kr/stk.` };
    }
  }

  return null;
}

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',');
}
