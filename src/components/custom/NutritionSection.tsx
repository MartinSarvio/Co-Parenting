import { NutriScoreBadge, NovaGroupBadge } from './NutriScoreBadge';
import type { ProductRecord } from '@/lib/productLookup';

// ── Allergen labels (OFF format → Danish) ────────────────────────────────────

const ALLERGEN_LABELS: Record<string, string> = {
  'en:milk': 'Mælk',
  'en:gluten': 'Gluten',
  'en:eggs': 'Æg',
  'en:nuts': 'Nødder',
  'en:peanuts': 'Jordnødder',
  'en:soybeans': 'Soja',
  'en:celery': 'Selleri',
  'en:mustard': 'Sennep',
  'en:sesame-seeds': 'Sesam',
  'en:fish': 'Fisk',
  'en:crustaceans': 'Krebsdyr',
  'en:molluscs': 'Bløddyr',
  'en:lupin': 'Lupin',
  'en:sulphur-dioxide-and-sulphites': 'Sulfit',
};

function getAllergenLabel(tag: string): string {
  return ALLERGEN_LABELS[tag] ?? tag.replace(/^en:/, '').replace(/-/g, ' ');
}

// ── Component ────────────────────────────────────────────────────────────────

interface NutritionSectionProps {
  product: ProductRecord;
  compact?: boolean;
}

export function NutritionSection({ product, compact }: NutritionSectionProps) {
  const hasBadges = product.nutriscore_grade || product.nova_group;
  const hasNutrition = product.energy_kcal_100g != null;
  const hasAllergens = product.allergens && product.allergens.length > 0;

  if (!hasBadges && !hasNutrition && !hasAllergens) return null;

  const macros = [
    { label: 'Kcal', value: Math.round(product.energy_kcal_100g ?? 0), color: '#f58a2d' },
    { label: 'Protein', value: `${(product.proteins_100g ?? 0).toFixed(1)}g`, color: '#3b82f6' },
    { label: 'Kulh.', value: `${(product.carbohydrates_100g ?? 0).toFixed(1)}g`, color: '#f59e0b' },
    { label: 'Fedt', value: `${(product.fat_100g ?? 0).toFixed(1)}g`, color: '#ef4444' },
  ];

  const detailNutrients = compact ? [] : [
    product.saturated_fat_100g != null && { label: 'Mættet fedt', value: `${product.saturated_fat_100g.toFixed(1)}g` },
    product.fiber_100g != null && { label: 'Fiber', value: `${product.fiber_100g.toFixed(1)}g` },
    product.sugars_100g != null && { label: 'Sukker', value: `${product.sugars_100g.toFixed(1)}g` },
    product.salt_100g != null && { label: 'Salt', value: `${product.salt_100g.toFixed(1)}g` },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className={`rounded-[8px] bg-[#f2f1ed] p-3 ${compact ? 'space-y-2' : 'space-y-3'}`}>
      <p className="text-[12px] font-semibold text-[#78766d]">Næringsindhold pr. 100g</p>

      {/* Badges */}
      {hasBadges && (
        <div className="flex items-center gap-2">
          {product.nutriscore_grade && (
            <NutriScoreBadge grade={product.nutriscore_grade} size="md" />
          )}
          {product.nova_group && (
            <NovaGroupBadge group={product.nova_group} size="md" />
          )}
        </div>
      )}

      {/* Macro grid */}
      {hasNutrition && (
        <div className="grid grid-cols-4 gap-2">
          {macros.map(n => (
            <div key={n.label} className="text-center">
              <p className="text-[14px] font-black" style={{ color: n.color }}>{n.value}</p>
              <p className="text-[10px] text-[#9a978f]">{n.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Detail nutrients */}
      {detailNutrients.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {detailNutrients.map(n => (
            <div key={n.label} className="flex items-center justify-between">
              <span className="text-[12px] text-[#78766d]">{n.label}</span>
              <span className="text-[12px] font-semibold text-[#2f2f2d]">{n.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Allergens */}
      {hasAllergens && (
        <div className="flex flex-wrap gap-1.5">
          {product.allergens.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-[#e8e7e0] px-2 py-0.5 text-[10px] font-semibold text-[#78766d]"
            >
              {getAllergenLabel(tag)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
