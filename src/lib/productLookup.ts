import { supabase } from './supabase';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProductRecord {
  id: string;
  barcode: string;
  product_name: string;
  brand: string | null;
  categories: string[];
  nutriscore_grade: string | null;
  nova_group: number | null;
  energy_kcal_100g: number | null;
  fat_100g: number | null;
  saturated_fat_100g: number | null;
  carbohydrates_100g: number | null;
  sugars_100g: number | null;
  fiber_100g: number | null;
  proteins_100g: number | null;
  salt_100g: number | null;
  allergens: string[];
  image_url: string | null;
  quantity: string | null;
}

export interface PriceSummary {
  lowestPrice: number | null;
  lowestPriceStore: string | null;
  averagePrice: number | null;
  priceCount: number;
  latestPrice: number | null;
  latestStore: string | null;
}

export interface PriceHistoryPoint {
  price: number;
  originalPrice: number | null;
  store: string;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
}

export interface ProductLookupResult {
  product: ProductRecord | null;
  priceSummary: PriceSummary | null;
  priceHistory: PriceHistoryPoint[];
}

// ── Cache ────────────────────────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 50;
const cache = new Map<string, { result: ProductLookupResult; timestamp: number }>();

function getCached(key: string): ProductLookupResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(key: string, result: ProductLookupResult) {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { result, timestamp: Date.now() });
}

// ── Price summary ────────────────────────────────────────────────────────────

export async function fetchPriceSummary(productId: string): Promise<PriceSummary | null> {
  try {
    const { data, error } = await supabase.rpc('get_price_summary', {
      p_product_id: productId,
    });
    if (error || !data || (Array.isArray(data) && data.length === 0)) return null;

    const row = Array.isArray(data) ? data[0] : data;
    return {
      lowestPrice: row.out_lowest_price ?? null,
      lowestPriceStore: row.out_lowest_price_store ?? null,
      averagePrice: row.out_average_price ?? null,
      priceCount: Number(row.out_price_count) || 0,
      latestPrice: row.out_latest_price ?? null,
      latestStore: row.out_latest_store ?? null,
    };
  } catch {
    return null;
  }
}

// ── Price history (for sparkline) ────────────────────────────────────────────

export async function fetchPriceHistory(productId: string, monthsBack = 6): Promise<PriceHistoryPoint[]> {
  try {
    const { data, error } = await supabase.rpc('get_price_history', {
      p_product_id: productId,
      p_months_back: monthsBack,
    });
    if (error || !data || !Array.isArray(data)) return [];

    return data.map((row: Record<string, unknown>) => ({
      price: Number(row.out_price) || 0,
      originalPrice: row.out_original_price != null ? Number(row.out_original_price) : null,
      store: String(row.out_store || ''),
      validFrom: row.out_valid_from ? String(row.out_valid_from) : null,
      validTo: row.out_valid_to ? String(row.out_valid_to) : null,
      createdAt: String(row.out_created_at || ''),
    }));
  } catch {
    return [];
  }
}

// ── Product click tracking (fire-and-forget) ─────────────────────────────────

export function trackProductClick(
  productId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): void {
  supabase
    .from('product_clicks')
    .insert({
      product_id: productId,
      event_type: eventType,
      metadata: metadata ?? {},
    })
    .then(() => {}, () => {});
}

// ── Lookup by barcode ────────────────────────────────────────────────────────

export async function lookupProductByBarcode(barcode: string): Promise<ProductLookupResult> {
  const cacheKey = `bc:${barcode}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error || !data) {
      const empty: ProductLookupResult = { product: null, priceSummary: null, priceHistory: [] };
      setCache(cacheKey, empty);
      return empty;
    }

    const product = data as ProductRecord;
    const [priceSummary, priceHistory] = await Promise.all([
      fetchPriceSummary(product.id),
      fetchPriceHistory(product.id),
    ]);
    const result: ProductLookupResult = { product, priceSummary, priceHistory };
    setCache(cacheKey, result);
    return result;
  } catch {
    return { product: null, priceSummary: null, priceHistory: [] };
  }
}

// ── Lookup by name (fuzzy) ───────────────────────────────────────────────────

export async function lookupProductByName(name: string): Promise<ProductLookupResult> {
  if (!name.trim()) return { product: null, priceSummary: null, priceHistory: [] };

  const cacheKey = `name:${name.toLowerCase().trim()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('match_product_by_name', {
      p_search_name: name,
      p_threshold: 0.3,
    });

    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      const empty: ProductLookupResult = { product: null, priceSummary: null, priceHistory: [] };
      setCache(cacheKey, empty);
      return empty;
    }

    const match = Array.isArray(data) ? data[0] : data;
    const productId = match.out_id as string;

    // Fetch full product row
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !productData) {
      const empty: ProductLookupResult = { product: null, priceSummary: null, priceHistory: [] };
      setCache(cacheKey, empty);
      return empty;
    }

    const product = productData as ProductRecord;
    const [priceSummary, priceHistory] = await Promise.all([
      fetchPriceSummary(productId),
      fetchPriceHistory(productId),
    ]);
    const result: ProductLookupResult = { product, priceSummary, priceHistory };
    setCache(cacheKey, result);
    return result;
  } catch {
    return { product: null, priceSummary: null, priceHistory: [] };
  }
}

// ── Search by name (multiple results) ───────────────────────────────────────

export async function searchProductsByName(
  query: string,
  limit = 20,
): Promise<ProductRecord[]> {
  if (!query.trim() || query.length < 2) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('product_name', `%${query}%`)
      .limit(limit);

    if (error || !data) return [];
    return data as ProductRecord[];
  } catch {
    return [];
  }
}
