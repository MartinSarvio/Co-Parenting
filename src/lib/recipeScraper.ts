import { CapacitorHttp } from '@capacitor/core';

export interface ScrapedRecipe {
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  tags?: string[];
}

function parseISO8601Duration(duration: string): number | undefined {
  if (!duration) return undefined;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  return hours * 60 + minutes || undefined;
}

function extractJsonLdRecipe(html: string): ScrapedRecipe | null {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      let data = JSON.parse(match[1]);

      // Handle @graph arrays
      if (data['@graph']) {
        data = data['@graph'].find((item: Record<string, unknown>) =>
          item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
        );
        if (!data) continue;
      }

      // Check if this is a Recipe
      const type = data['@type'];
      const isRecipe = type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
      if (!isRecipe) continue;

      const ingredients: string[] = Array.isArray(data.recipeIngredient)
        ? data.recipeIngredient.map((i: string) => i.trim())
        : [];

      let steps: string[] = [];
      if (Array.isArray(data.recipeInstructions)) {
        steps = data.recipeInstructions.map((s: string | { text?: string; '@type'?: string }) => {
          if (typeof s === 'string') return s.trim();
          if (s && typeof s === 'object' && s.text) return s.text.trim();
          return '';
        }).filter(Boolean);
      }

      let servings: number | undefined;
      if (data.recipeYield) {
        const yieldStr = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield;
        const num = parseInt(String(yieldStr), 10);
        if (!isNaN(num)) servings = num;
      }

      let tags: string[] = [];
      if (data.keywords) {
        if (typeof data.keywords === 'string') {
          tags = data.keywords.split(',').map((t: string) => t.trim()).filter(Boolean);
        } else if (Array.isArray(data.keywords)) {
          tags = data.keywords;
        }
      }

      return {
        name: data.name || '',
        description: data.description || '',
        ingredients,
        steps,
        prepTime: parseISO8601Duration(data.prepTime),
        cookTime: parseISO8601Duration(data.cookTime),
        servings,
        tags,
      };
    } catch {
      continue;
    }
  }

  return null;
}

function extractFallback(html: string): ScrapedRecipe | null {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);

  if (!titleMatch) return null;

  return {
    name: titleMatch[1].replace(/\s*[-|–].*$/, '').trim(),
    description: descMatch ? descMatch[1].trim() : '',
    ingredients: [],
    steps: [],
  };
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe | null> {
  try {
    const response = await CapacitorHttp.get({
      url,
      headers: { 'User-Agent': 'HverdagApp/1.0' },
    });

    const html = response.data as string;
    if (!html || typeof html !== 'string') return null;

    // Try JSON-LD first (most reliable)
    const jsonLd = extractJsonLdRecipe(html);
    if (jsonLd && jsonLd.name) return jsonLd;

    // Fallback: basic meta parsing
    return extractFallback(html);
  } catch {
    return null;
  }
}
