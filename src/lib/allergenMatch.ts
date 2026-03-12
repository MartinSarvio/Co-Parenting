// ── Bidirektionel allergen-mapping: OFF tags ↔ dansk ─────────────────────────

export interface AllergenMatch {
  allergenTag: string;       // OFF format: "en:milk"
  allergenLabel: string;     // Dansk: "Mælk"
  affectedMembers: string[]; // Navne: ["Emma", "Oliver"]
}

/** OFF tag → dansk label */
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

/** Dansk label (lowercase) → OFF tag */
const ALLERGEN_REVERSE: Record<string, string> = {
  'mælk': 'en:milk',
  'laktose': 'en:milk',
  'gluten': 'en:gluten',
  'æg': 'en:eggs',
  'nødder': 'en:nuts',
  'jordnødder': 'en:peanuts',
  'soja': 'en:soybeans',
  'selleri': 'en:celery',
  'sennep': 'en:mustard',
  'sesam': 'en:sesame-seeds',
  'fisk': 'en:fish',
  'krebsdyr': 'en:crustaceans',
  'bløddyr': 'en:molluscs',
  'lupin': 'en:lupin',
  'sulfit': 'en:sulphur-dioxide-and-sulphites',
};

/** All 14 EU allergens as Danish labels (for settings UI). */
export const EU_ALLERGENS_DA = [
  'Mælk', 'Gluten', 'Æg', 'Nødder', 'Jordnødder', 'Soja', 'Selleri',
  'Sennep', 'Sesam', 'Fisk', 'Krebsdyr', 'Bløddyr', 'Lupin', 'Sulfit',
];

/** Convert OFF tag to Danish label. */
export function allergenTagToLabel(tag: string): string {
  return ALLERGEN_LABELS[tag] ?? tag.replace(/^en:/, '').replace(/-/g, ' ');
}

/** Convert Danish label to OFF tag. */
function danishToTag(label: string): string | undefined {
  return ALLERGEN_REVERSE[label.toLowerCase()];
}

/**
 * Match a product's allergens (OFF format) against family members' allergens (Danish format).
 * Returns only actual matches with affected member names.
 */
export function matchFamilyAllergens(
  itemAllergens: string[],
  familyProfiles: { name: string; allergens: string[] }[],
): AllergenMatch[] {
  if (!itemAllergens.length || !familyProfiles.length) return [];

  const matches: AllergenMatch[] = [];

  for (const tag of itemAllergens) {
    const label = ALLERGEN_LABELS[tag];
    if (!label) continue;

    const affected: string[] = [];
    for (const profile of familyProfiles) {
      for (const allergy of profile.allergens) {
        const allergyTag = danishToTag(allergy);
        if (allergyTag === tag) {
          affected.push(profile.name);
          break;
        }
      }
    }

    if (affected.length > 0) {
      matches.push({ allergenTag: tag, allergenLabel: label, affectedMembers: affected });
    }
  }

  return matches;
}
