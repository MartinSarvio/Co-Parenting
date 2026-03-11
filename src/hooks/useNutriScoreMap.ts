import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Module-scope cache — only fetch once per session
let cachedMap: Map<string, string> | null = null;
let fetchPromise: Promise<Map<string, string>> | null = null;

async function loadNutriScores(): Promise<Map<string, string>> {
  if (cachedMap) return cachedMap;

  const { data, error } = await supabase
    .from('products')
    .select('product_name, nutriscore_grade')
    .not('nutriscore_grade', 'is', null);

  const map = new Map<string, string>();
  if (!error && data) {
    for (const row of data) {
      if (row.product_name && row.nutriscore_grade) {
        map.set(row.product_name.toLowerCase(), row.nutriscore_grade.toLowerCase());
      }
    }
  }
  cachedMap = map;
  return map;
}

/** Hook: returns a Map<lowercase_product_name, grade> from the products table. */
export function useNutriScoreMap(): Map<string, string> {
  const [map, setMap] = useState<Map<string, string>>(cachedMap ?? new Map());

  useEffect(() => {
    if (cachedMap) {
      setMap(cachedMap);
      return;
    }
    if (!fetchPromise) {
      fetchPromise = loadNutriScores();
    }
    fetchPromise.then(m => setMap(m));
  }, []);

  return map;
}

/** Match an offer/product name against the nutri-score map. */
export function matchNutriScore(name: string, map: Map<string, string>): string | undefined {
  if (map.size === 0) return undefined;
  const lower = name.toLowerCase();

  // Exact match
  const exact = map.get(lower);
  if (exact) return exact;

  // Substring match: product name contains offer title or vice versa
  for (const [productName, grade] of map) {
    if (productName.includes(lower) || lower.includes(productName)) {
      return grade;
    }
  }

  return undefined;
}

/** Convert nutriscore grade to a numeric score for sorting (a=1 best, e=5 worst, unknown=6). */
export function nutriScoreToNumber(grade: string | undefined): number {
  if (!grade) return 6;
  const scores: Record<string, number> = { a: 1, b: 2, c: 3, d: 4, e: 5 };
  return scores[grade.toLowerCase()] ?? 6;
}
