import { supabase } from './supabase';
import { fetchFromOpenFoodFacts } from './openFoodFacts';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse Danish price string ("29,95" or "29.95") to number. Returns null if invalid. */
function parseDanishPrice(s: string | null): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/** Small delay to respect OFF API rate limits */
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Upsert product from Open Food Facts ──────────────────────────────────────

/**
 * Fetch product from OFF API by barcode and upsert into Supabase `products` table.
 * Returns the product UUID if successful, null otherwise.
 */
export async function upsertProductFromOFF(barcode: string): Promise<string | null> {
  try {
    const off = await fetchFromOpenFoodFacts(barcode);
    if (!off) return null;

    const row = {
      barcode,
      product_name: off.name,
      brand: off.brand ?? null,
      categories: off.categories ? off.categories.split(',').map(s => s.trim()) : [],
      nutriscore_grade: off.nutriscoreGrade ?? null,
      nova_group: off.novaGroup ?? null,
      energy_kcal_100g: off.kcalPer100g,
      fat_100g: off.fatPer100g,
      saturated_fat_100g: off.saturatedFatPer100g ?? null,
      carbohydrates_100g: off.carbsPer100g,
      sugars_100g: off.sugarPer100g ?? null,
      fiber_100g: off.fiberPer100g ?? null,
      proteins_100g: off.proteinPer100g,
      salt_100g: off.saltPer100g ?? null,
      allergens: off.allergens ?? [],
      image_url: off.imageUrl ?? null,
      quantity: off.quantity ?? null,
      synced_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('products')
      .upsert(row, { onConflict: 'barcode' })
      .select('id')
      .single();

    if (error) {
      console.error('upsertProductFromOFF error:', error);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error('upsertProductFromOFF exception:', err);
    return null;
  }
}

// ── Save confirmed import items to product_prices ────────────────────────────

export interface SaveItemsParams {
  batchId: string;
  store: string;
  fileName: string;
  validFrom: string | null;
  validTo: string | null;
  items: Array<{
    title: string;
    price: string | null;
    original_price: string | null;
    barcode?: string | null;
  }>;
}

export interface SaveItemsResult {
  saved: number;
  linked: number;
}

/**
 * Write confirmed import items to `product_prices`.
 * For items with barcodes, also upsert the product from OFF.
 */
export async function saveItemsToProductPrices(params: SaveItemsParams): Promise<SaveItemsResult> {
  const { batchId, store, fileName, validFrom, validTo, items } = params;

  // 1. Collect unique barcodes and resolve product IDs from OFF
  const barcodeToProductId = new Map<string, string | null>();
  const itemsWithBarcodes = items.filter(it => it.barcode);

  for (let i = 0; i < itemsWithBarcodes.length; i++) {
    const bc = itemsWithBarcodes[i].barcode!;
    if (!barcodeToProductId.has(bc)) {
      const productId = await upsertProductFromOFF(bc);
      barcodeToProductId.set(bc, productId);
      // Rate-limit: 200ms between OFF API calls
      if (i < itemsWithBarcodes.length - 1) {
        await delay(200);
      }
    }
  }

  // 2. Build product_prices rows (skip items without valid price)
  const rows = items
    .filter(it => parseDanishPrice(it.price) !== null)
    .map(it => ({
      product_id: it.barcode ? barcodeToProductId.get(it.barcode) ?? null : null,
      barcode: it.barcode ?? null,
      product_name: it.title,
      price: parseDanishPrice(it.price)!,
      original_price: parseDanishPrice(it.original_price),
      store,
      source: fileName,
      batch_id: batchId,
      valid_from: validFrom,
      valid_to: validTo,
    }));

  if (rows.length === 0) {
    return { saved: 0, linked: 0 };
  }

  // 3. Bulk insert
  const { error } = await supabase.from('product_prices').insert(rows);
  if (error) {
    console.error('saveItemsToProductPrices insert error:', error);
    throw new Error(`Kunne ikke gemme priser: ${error.message}`);
  }

  const linked = rows.filter(r => r.product_id !== null).length;
  return { saved: rows.length, linked };
}
