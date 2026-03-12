import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Module-scope cache — only fetch once per session
let cachedMap: Map<string, string[]> | null = null;
let fetchPromise: Promise<Map<string, string[]>> | null = null;

async function loadAllergens(): Promise<Map<string, string[]>> {
  if (cachedMap) return cachedMap;

  const { data, error } = await supabase
    .from('products')
    .select('product_name, allergens')
    .not('allergens', 'eq', '{}');

  const map = new Map<string, string[]>();
  if (!error && data) {
    for (const row of data) {
      if (row.product_name && row.allergens?.length) {
        map.set(row.product_name.toLowerCase(), row.allergens);
      }
    }
  }
  cachedMap = map;
  return map;
}

/** Hook: returns a Map<lowercase_product_name, allergens_array> from the products table. */
export function useAllergenMap(): Map<string, string[]> {
  const [map, setMap] = useState<Map<string, string[]>>(cachedMap ?? new Map());

  useEffect(() => {
    if (cachedMap) {
      setMap(cachedMap);
      return;
    }
    if (!fetchPromise) {
      fetchPromise = loadAllergens();
    }
    fetchPromise.then(m => setMap(m));
  }, []);

  return map;
}

/** Match a product/offer name against the allergen map. */
export function matchAllergens(name: string, map: Map<string, string[]>): string[] {
  if (map.size === 0) return [];
  const lower = name.toLowerCase();

  // Exact match
  const exact = map.get(lower);
  if (exact) return exact;

  // Substring match
  for (const [productName, allergens] of map) {
    if (productName.includes(lower) || lower.includes(productName)) {
      return allergens;
    }
  }

  return [];
}
