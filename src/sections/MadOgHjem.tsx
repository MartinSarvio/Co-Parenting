import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format, isToday, isTomorrow, parseISO, setDay, startOfToday } from 'date-fns';
import { da } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '@/components/custom/BottomSheet';
import { ConfirmCloseDialog } from '@/components/custom/ConfirmCloseDialog';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { KaloriedagbogView } from './KaloriedagbogView';
import { KoleskabView } from './KoleskabView';
import {
  Baby,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Home,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Repeat2,
  ScanLine,
  ShoppingCart,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  BookOpen,
  ChefHat,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  Minus,
  Share2,
  Timer,
  ArrowLeft,
  Search,
  Soup,
  Salad,
  Cookie,
  Sandwich,
  Coffee,
  Beef,
  CakeSlice,
  LayoutGrid,
  Package,
  X,
  Globe,
  Play,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { cn, getMealTypeLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Tabs replaced by underline-style tabs
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { Checkbox } from '@/components/ui/checkbox';
import { notificationId } from '@/lib/id';
import { recipes, recipeCategories } from '@/data/recipes';
import { getRecipeVideoUrl } from '@/data/recipeVideos';
import { MadOgHjemSidePanel } from '@/components/custom/MadOgHjemSidePanel';
import { startBarcodeScanner, fetchFromOpenFoodFacts, searchProducts, type OFFResult } from '@/lib/openFoodFacts';
import type { ProductCardData } from '@/components/custom/ProductCard';
import { scrapeRecipe } from '@/lib/recipeScraper';
import type { Recipe, MealType, ShoppingItem } from '@/types';
import { FOOD_ITEMS } from '@/data/foodItems';
import { useNutriScoreMap, matchNutriScore } from '@/hooks/useNutriScoreMap';
import { useAllergenMap, matchAllergens } from '@/hooks/useAllergenMap';
import { matchFamilyAllergens } from '@/lib/allergenMatch';
import { NutriScoreBadge } from '@/components/custom/NutriScoreBadge';
import { AlertTriangle } from 'lucide-react';

// Category → Lucide icon map for recipe browser
const recipeCategoryIcons: Record<string, LucideIcon> = {
  Alle: LayoutGrid,
  Aftensmad: UtensilsCrossed,
  Frokost: Sandwich,
  Morgenmad: Coffee,
  Snacks: Cookie,
  Bagværk: CakeSlice,
  Supper: Soup,
  Salater: Salad,
  Grill: Beef,
  Dessert: CakeSlice,
};

type MealSuggestion = {
  title: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: string[];
  instructions: string;
};

type WeekTemplate = {
  id: string;
  name: string;
  description: string;
  meals: Array<{
    dayOffset: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    title: string;
    ingredients: string[];
    instructions: string;
    notes?: string;
  }>;
  cleaning: Array<{
    title: string;
    area: string;
    weekday: number;
    recurringPattern: 'weekly' | 'biweekly' | 'monthly';
  }>;
};

type AutoMealCandidate = {
  title: string;
  ingredients: string[];
  instructions: string;
  childFriendly: boolean;
};

type FoodLogEntry = {
  id: string;
  meal: string;
  food: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  time?: string;
};

const mealSuggestions: MealSuggestion[] = [
  {
    title: 'Pastagratin med grønt',
    mealType: 'dinner',
    ingredients: ['400 g pasta', '1 squash', '1 løg', '2 dl madlavningsfløde', 'Revet ost'],
    instructions: 'Kog pasta. Steg løg og squash. Vend med fløde og pasta, drys ost og bag i ovn ved 200 grader i 15 min.'
  },
  {
    title: 'Wraps med kylling og grønt',
    mealType: 'dinner',
    ingredients: ['6 tortillas', '300 g kylling', '1 avocado', 'Agurk', 'Creme fraiche'],
    instructions: 'Steg kylling i strimler. Snit grønt og saml wraps med creme fraiche.'
  },
  {
    title: 'Havregrød med banan',
    mealType: 'breakfast',
    ingredients: ['2 dl havregryn', '4 dl mælk', '1 banan', 'Kanel'],
    instructions: 'Kog havregryn med mælk til cremet konsistens. Top med banan og kanel.'
  },
  {
    title: 'Linsesuppe med brød',
    mealType: 'dinner',
    ingredients: ['2 dl røde linser', '1 løg', '2 gulerødder', '1 liter bouillon', 'Fuldkornsbrød'],
    instructions: 'Svits løg og gulerødder, tilsæt linser og bouillon, kog 20 min og blend let.'
  },
  {
    title: 'Rugbrød med æg og grønt',
    mealType: 'lunch',
    ingredients: ['6 skiver rugbrød', '4 æg', 'Tomat', 'Agurk', 'Smør'],
    instructions: 'Kog æg hårdkogte, anret rugbrød med skiver af æg og grønt.'
  }
];

const weekTemplates: WeekTemplate[] = [
  {
    id: 'quick-family-week',
    name: 'Hurtig familieuge',
    description: 'Fokus på nemme retter, der tager under 30 minutter.',
    meals: [
      { dayOffset: 0, mealType: 'dinner', title: 'Pasta med kødsovs', ingredients: ['Pasta', 'Hakket oksekød', 'Tomatsauce'], instructions: 'Kog pasta. Steg kødet og vend med tomatsauce.', notes: 'Barn-venlig klassiker' },
      { dayOffset: 1, mealType: 'dinner', title: 'Kyllingewraps', ingredients: ['Tortillas', 'Kylling', 'Salat', 'Creme fraiche'], instructions: 'Steg kylling i strimler og saml wraps.' },
      { dayOffset: 2, mealType: 'dinner', title: 'Fiskefrikadeller med kartofler', ingredients: ['Fiskefrikadeller', 'Kartofler', 'Gulerødder'], instructions: 'Kog kartofler, steg fiskefrikadeller, server med råkost.' },
      { dayOffset: 3, mealType: 'dinner', title: 'Tomatsuppe med brød', ingredients: ['Tomater', 'Løg', 'Bouillon', 'Brød'], instructions: 'Kog suppe og blend. Server med brød.' },
      { dayOffset: 4, mealType: 'dinner', title: 'Rugbrød + æg og grønt', ingredients: ['Rugbrød', 'Æg', 'Tomat', 'Agurk'], instructions: 'Kog æg, anret rugbrød med grønt.' },
      { dayOffset: 5, mealType: 'dinner', title: 'One pot risret', ingredients: ['Ris', 'Kylling', 'Ærter', 'Majs'], instructions: 'Svits, tilsæt ris og væske, lad simre til mørt.' },
      { dayOffset: 6, mealType: 'dinner', title: 'Pizza toast aften', ingredients: ['Toastbrød', 'Tomatsauce', 'Ost', 'Skinke'], instructions: 'Byg toast og bag i ovn i 8-10 minutter.' }
    ],
    cleaning: [
      { title: 'Støvsug fællesrum', area: 'Stue', weekday: 5, recurringPattern: 'weekly' },
      { title: 'Ryd op i børneværelse', area: 'Børneværelse', weekday: 6, recurringPattern: 'weekly' }
    ]
  },
  {
    id: 'budget-week',
    name: 'Budgetvenlig uge',
    description: 'Billige råvarer, rester på tværs af flere dage.',
    meals: [
      { dayOffset: 0, mealType: 'dinner', title: 'Linsesuppe med brød', ingredients: ['Røde linser', 'Løg', 'Gulerødder', 'Bouillon'], instructions: 'Kog alle ingredienser i 20 min og blend let.' },
      { dayOffset: 1, mealType: 'dinner', title: 'Ris med grøntsager og æg', ingredients: ['Ris', 'Æg', 'Frosne grøntsager', 'Soja'], instructions: 'Kog ris, steg grøntsager og vend med æg.' },
      { dayOffset: 2, mealType: 'dinner', title: 'Kartoffelomelet', ingredients: ['Kartofler', 'Æg', 'Løg'], instructions: 'Steg kartofler og løg, hæld æg over og bag færdig.' },
      { dayOffset: 3, mealType: 'dinner', title: 'Pasta med grøntsagssauce', ingredients: ['Pasta', 'Tomat', 'Løg', 'Gulerod'], instructions: 'Kog pasta. Blend sauce og varm op.' },
      { dayOffset: 4, mealType: 'dinner', title: 'Hjemmelavet pitabrød med falafel', ingredients: ['Pitabrød', 'Falafel', 'Salat'], instructions: 'Varm falafel og fyld pitabrød.' },
      { dayOffset: 5, mealType: 'dinner', title: 'Rugbrødsaften', ingredients: ['Rugbrød', 'Makrel', 'Æg', 'Grønt'], instructions: 'Anret rugbrød med forskelligt pålæg.' },
      { dayOffset: 6, mealType: 'dinner', title: 'Grøntsagsfrikadeller', ingredients: ['Squash', 'Gulerod', 'Æg', 'Havregryn'], instructions: 'Rør fars, form deller og steg gyldne.' }
    ],
    cleaning: [
      { title: 'Tjek køleskab og undgå madspild', area: 'Køkken', weekday: 0, recurringPattern: 'weekly' },
      { title: 'Tøm og vask skraldespande', area: 'Køkken + bad', weekday: 3, recurringPattern: 'weekly' }
    ]
  }
];

const autoMealCandidates: AutoMealCandidate[] = [
  { title: 'Kylling i karry med ris', ingredients: ['Kylling', 'Karry', 'Løg', 'Ris'], instructions: 'Steg kylling og løg, tilsæt karry og server med ris.', childFriendly: true },
  { title: 'Pasta med tun og majs', ingredients: ['Pasta', 'Tun', 'Majs', 'Creme fraiche'], instructions: 'Kog pasta og vend med tun, majs og creme fraiche.', childFriendly: true },
  { title: 'Ovnbagt laks med kartofler', ingredients: ['Laks', 'Kartofler', 'Broccoli'], instructions: 'Bag kartofler og laks i ovn, server med broccoli.', childFriendly: true },
  { title: 'Tomat-linsegryde', ingredients: ['Linser', 'Tomater', 'Løg', 'Gulerod'], instructions: 'Kog linser med tomat og grønt til en tyk gryde.', childFriendly: false },
  { title: 'Mild chili sin carne', ingredients: ['Bønner', 'Majs', 'Tomat', 'Ris'], instructions: 'Kog sammen til en mild chili og server med ris.', childFriendly: true },
  { title: 'Frikadeller med rodfrugter', ingredients: ['Hakket svin/kalv', 'Æg', 'Rodfrugter'], instructions: 'Steg frikadeller og bag rodfrugter i ovn.', childFriendly: true },
  { title: 'Pitabrød med kalkunfyld', ingredients: ['Pitabrød', 'Kalkun', 'Salat', 'Yoghurt'], instructions: 'Steg kalkunstrimler og fyld pitabrød.', childFriendly: true },
  { title: 'One-pot tomatpasta', ingredients: ['Pasta', 'Tomat', 'Løg', 'Spinat'], instructions: 'Kog alt i samme gryde til cremet pasta.', childFriendly: true },
  { title: 'Kikærte-curry', ingredients: ['Kikærter', 'Kokosmælk', 'Løg', 'Ris'], instructions: 'Kog karry med kikærter og kokosmælk, server med ris.', childFriendly: false },
  { title: 'Æggekage med grønt', ingredients: ['Æg', 'Kartofler', 'Peberfrugt'], instructions: 'Bag æggekage på pande/ovn med grøntsager.', childFriendly: true },
  { title: 'Kødboller i tomatsauce', ingredients: ['Hakket oksekød', 'Tomatsauce', 'Pasta'], instructions: 'Form kødboller, steg og kog i tomatsauce.', childFriendly: true },
  { title: 'Wok med nudler og grønt', ingredients: ['Nudler', 'Grøntsager', 'Soja'], instructions: 'Wok grønt hurtigt og vend med nudler.', childFriendly: true }
];


/* Cleaning templates — reserved for future cleaning tab UI
const cleaningTemplates = [
  { title: 'Støvsug fællesrum', area: 'Stue', weekday: 5, recurringPattern: 'weekly' },
  { title: 'Tør støv af overflader', area: 'Hele hjemmet', weekday: 2, recurringPattern: 'weekly' },
  { title: 'Vask bad og toilet', area: 'Badeværelse', weekday: 6, recurringPattern: 'weekly' }
];
const weekdays = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
*/

const todayString = format(new Date(), 'yyyy-MM-dd');

function sortMealType(a: string, b: string): number {
  const order: Record<string, number> = {
    breakfast: 0,
    lunch: 1,
    dinner: 2,
    snack: 3
  };
  return (order[a] ?? 99) - (order[b] ?? 99);
}

/* Reserved for future cleaning tab UI
function getRecurringLabel(pattern?: string): string {
  const labels: Record<string, string> = {
    weekly: 'Hver uge',
    biweekly: 'Hver 2. uge',
    monthly: 'Månedlig'
  };
  return labels[pattern || ''] || 'Efter behov';
}
*/

function normalizeLegacyAiText(value?: string): string | undefined {
  if (!value) return value;
  return value.replace(/^AI:\s*/i, 'Forslag: ');
}

type RichStep = {
  title: string;
  description: string;
  duration?: number;
  tip?: string;
  ingredients?: string[];
  temperature?: string;
  technique?: string;
};

/**
 * Try to match a meal plan to a full recipe in the database for richer step data.
 */
function findMatchingRecipe(mealTitle: string): Recipe | null {
  const normalised = mealTitle.toLowerCase().trim();
  return recipes.find(r => r.name.toLowerCase() === normalised)
    || recipes.find(r => normalised.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(normalised))
    || null;
}

/**
 * Extract time mentions from a step string e.g. "15 min", "20 minutter"
 */
function extractDuration(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(?:min(?:ut(?:t?er)?)?)/i);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Extract temperature mentions e.g. "200 grader", "180°C"
 */
function extractTemperature(text: string): string | undefined {
  const match = text.match(/(\d+)\s*(?:°[CF]?|grader)/i);
  return match ? `${match[1]}°` : undefined;
}

/**
 * Detect cooking technique keywords
 */
function extractTechnique(text: string): string | undefined {
  const techniques: [RegExp, string][] = [
    [/\bsteg\b/i, '🍳 Stegning'],
    [/\bkog\b/i, '♨️ Kogning'],
    [/\bbag\b|ovn/i, '🔥 Ovn'],
    [/\bblend/i, '🔄 Blending'],
    [/\bgratiné?r/i, '🧀 Gratinering'],
    [/\bsimr/i, '🫕 Simring'],
    [/\bgrill/i, '🔥 Grill'],
    [/\bdamp/i, '💨 Dampning'],
    [/\bsauter?/i, '🍳 Sautering'],
    [/\bmarinér|marinér|marinade/i, '🍖 Marinering'],
  ];
  for (const [pattern, label] of techniques) {
    if (pattern.test(text)) return label;
  }
  return undefined;
}

/**
 * Identify which ingredients from the list are referenced in a step text
 */
function findReferencedIngredients(stepText: string, ingredients: string[]): string[] {
  const lower = stepText.toLowerCase();
  return ingredients.filter(ing => {
    // Extract the ingredient name (strip amounts like "400 g pasta" → "pasta")
    const nameOnly = ing.replace(/^[\d.,]+\s*(g|kg|ml|dl|l|stk|spsk|tsk|knivspids)\s+/i, '').toLowerCase();
    return nameOnly.length > 2 && lower.includes(nameOnly);
  });
}

/**
 * Generate a helpful tip for a step based on content
 */
function generateTip(text: string, _ingredients: string[]): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('kød') || lower.includes('hakket'))
    return 'Tip: Lad kødet nå stuetemperatur 15 min inden tilberedning for jævn stegning.';
  if (lower.includes('løg') && (lower.includes('steg') || lower.includes('svits')))
    return 'Tip: Svits løg på middel varme til de er gyldne og gennemsigtige.';
  if (lower.includes('kartof') && lower.includes('kog'))
    return 'Tip: Start med koldt vand og salt — så koger kartoflerne jævnt hele vejen igennem.';
  if (lower.includes('pasta') && lower.includes('kog'))
    return 'Tip: Brug rigeligt vand (1 liter pr. 100 g pasta) og salt godt.';
  if (lower.includes('ris') && lower.includes('kog'))
    return 'Tip: Skyl risene inden kogning for at fjerne overskydende stivelse.';
  if (lower.includes('sovs') || lower.includes('fløde'))
    return 'Tip: Rør jævnligt for at undgå klumper, og lad sovsen simre — aldrig koge over.';
  if (lower.includes('ovn') || lower.includes('bag'))
    return 'Tip: Forvarm altid ovnen — det sikrer jævn tilberedning fra start.';
  if (lower.includes('fisk') || lower.includes('laks'))
    return 'Tip: Laks er færdig når den flager let med en gaffel. Pas på ikke at overstege.';
  if (lower.includes('æg') && lower.includes('kog'))
    return 'Tip: Blødkogt 6 min, smilende 8 min, hårdkogt 10 min efter kogende vand.';
  if (lower.includes('krydder') || lower.includes('smag'))
    return 'Tip: Smag altid til løbende — du kan tilsætte, men ikke fjerne.';
  if (lower.includes('salat') || lower.includes('grønt'))
    return 'Tip: Skyl grønt grundigt og tør det i en salatslynge for sprødt resultat.';
  return undefined;
}

function buildRichPreparationSteps(instructions?: string, ingredients: string[] = [], mealTitle?: string): RichStep[] {
  // 1. Try to find a matching full recipe from the database for rich steps
  if (mealTitle) {
    const matchedRecipe = findMatchingRecipe(mealTitle);
    if (matchedRecipe && matchedRecipe.steps.length > 0) {
      return [
        {
          title: 'Forberedelse',
          description: `Gør alle ingredienser klar. Du skal bruge ${matchedRecipe.ingredients.length} ingredienser til denne ret.`,
          duration: matchedRecipe.prepTime || undefined,
          tip: 'Tip: Læs opskriften igennem, og mål alle ingredienser af inden du begynder at tilberede.',
          technique: '📋 Forberedelse',
        },
        ...matchedRecipe.steps.map((step) => {
          const ingNames = matchedRecipe.ingredients.map(i => i.name);
          return {
            title: `Trin ${step.step}`,
            description: step.description,
            duration: step.duration,
            tip: generateTip(step.description, ingNames),
            temperature: extractTemperature(step.description),
            technique: extractTechnique(step.description),
            ingredients: findReferencedIngredients(step.description, ingNames),
          };
        }),
        {
          title: 'Servering',
          description: 'Anret retten og server straks. Velbekomme! 🍽️',
          tip: matchedRecipe.nutrition
            ? `Pr. portion: ${matchedRecipe.nutrition.kcal} kcal · ${matchedRecipe.nutrition.protein}g protein · ${matchedRecipe.nutrition.carbs}g kulhydrat · ${matchedRecipe.nutrition.fat}g fedt`
            : undefined,
        },
      ];
    }
  }

  // 2. Parse the instruction text into enriched steps
  const normalized = (instructions || '').trim();
  if (normalized.length > 0) {
    const rawSteps = normalized
      .split(/\n+/)
      .flatMap((line) => {
        const trimmed = line.trim();
        if (trimmed.length === 0) return [];
        // If the line contains multiple sentences, split them
        const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
        return sentences.length > 1 ? sentences : [trimmed];
      })
      .map((step) => step.replace(/^(?:trin\s*\d+[:.]\s*|[-\d.)\s]+)/i, '').trim())
      .filter((step) => step.length > 3);

    if (rawSteps.length > 0) {
      const enriched: RichStep[] = [
        {
          title: 'Forberedelse',
          description: ingredients.length > 0
            ? `Gør følgende ingredienser klar: ${ingredients.slice(0, 6).join(', ')}${ingredients.length > 6 ? ` og ${ingredients.length - 6} mere` : ''}.`
            : 'Mål alle ingredienser af og gør dit køkkenudstyr klar.',
          tip: 'Tip: Læs alle trin igennem først, så du ved hvad der skal ske. Forbered ingredienserne inden du starter.',
          technique: '📋 Forberedelse',
          ingredients: ingredients.slice(0, 6),
        },
      ];

      rawSteps.forEach((step, i) => {
        enriched.push({
          title: `Trin ${i + 1}`,
          description: step.charAt(0).toUpperCase() + step.slice(1) + (step.endsWith('.') ? '' : '.'),
          duration: extractDuration(step),
          temperature: extractTemperature(step),
          technique: extractTechnique(step),
          tip: generateTip(step, ingredients),
          ingredients: findReferencedIngredients(step, ingredients),
        });
      });

      enriched.push({
        title: 'Servering',
        description: 'Anret retten pænt og server straks mens den er varm. Velbekomme! 🍽️',
        tip: 'Tip: Smag altid til en sidste gang inden servering — juster salt, peber eller syre.',
      });

      return enriched;
    }
  }

  // 3. Fallback: generate generic but rich steps based on ingredients
  const fallbackIngredients = ingredients.filter(Boolean);
  const hasProtein = fallbackIngredients.some(i => /kød|kylling|svin|okse|fisk|laks|torsk|ørred|æg/i.test(i));
  const hasVeg = fallbackIngredients.some(i => /løg|gulerod|kartof|tomat|broccoli|squash|peberfrugt|grønt/i.test(i));
  const hasPasta = fallbackIngredients.some(i => /pasta|ris|nudl/i.test(i));

  const steps: RichStep[] = [
    {
      title: 'Forberedelse',
      description: fallbackIngredients.length > 0
        ? `Gør følgende ingredienser klar: ${fallbackIngredients.join(', ')}.`
        : 'Saml alle ingredienser og gør dit køkkenudstyr klar.',
      tip: 'Tip: Skær alle grøntsager og mål krydderier af på forhånd — så går tilberedningen hurtigt.',
      technique: '📋 Forberedelse',
      ingredients: fallbackIngredients,
    },
  ];

  if (hasVeg) {
    steps.push({
      title: 'Forbered grøntsager',
      description: 'Skyl, skræl og skær grøntsagerne i passende stykker. Løg skæres i fine tern, rodfrugter i jævne stykker.',
      duration: 5,
      tip: 'Tip: Ensartede stykker giver jævn tilberedning — skær alt i nogenlunde samme størrelse.',
      technique: '🔪 Klargøring',
    });
  }

  if (hasProtein) {
    steps.push({
      title: 'Tilbered protein',
      description: 'Steg kødet/fisken/ægget ved middel-høj varme. Vend når den ene side er gylden.',
      duration: 10,
      tip: 'Tip: Lad kødet nå stuetemperatur inden stegning — det giver jævn tilberedning hele vejen igennem.',
      technique: '🍳 Stegning',
    });
  }

  if (hasPasta) {
    steps.push({
      title: 'Kog tilbehør',
      description: 'Kog pasta eller ris i rigeligt saltet vand ifølge anvisningerne på pakken.',
      duration: 10,
      tip: 'Tip: Gem lidt kogevand — det er perfekt til at justere saucens konsistens.',
      technique: '♨️ Kogning',
    });
  }

  steps.push({
    title: 'Saml retten',
    description: 'Vend alle ingredienser sammen, smag til med salt og peber, og varm igennem.',
    duration: 5,
    tip: 'Tip: Smag altid til lige inden servering og juster med salt, peber eller en sprøjt citron.',
    technique: '👨‍🍳 Samling',
  });

  steps.push({
    title: 'Servering',
    description: 'Anret retten på tallerkner og server straks. Velbekomme! 🍽️',
    tip: 'Tip: Et drys friske urter eller en skive citron gør enhver ret flottere.',
  });

  return steps;
}

export function MadOgHjem() {
  const {
    users,
    children,
    currentUser,
    household,
    mealPlans,
    shoppingItems,
    shoppingLists,
    tasks,
    notifications,
    addNotification,
    userRecipes,
    memberNutritionGoals,
    activeShoppingListId,
    setActiveShoppingListId,
  } = useAppStore();
  const {
    createEvent,
    createTask,
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
    createShoppingItem,
    deleteShoppingItem: apiDeleteShoppingItem,
    updateShoppingItem: apiUpdateShoppingItem,
    createShoppingList,
    deleteShoppingList,
    createUserRecipe,
  } = useApiActions();

  const nutriScoreMap = useNutriScoreMap();
  const allergenMap = useAllergenMap();
  const familyAllergenProfiles = useMemo(() => {
    const profiles: { name: string; allergens: string[] }[] = [];
    for (const child of children) {
      if (child.allergies?.length) profiles.push({ name: child.name, allergens: child.allergies });
    }
    for (const user of users) {
      if (user.allergies?.length) profiles.push({ name: user.name, allergens: user.allergies });
    }
    return profiles;
  }, [children, users]);

  const [activeTab, setActiveTab] = useState('meal-plan');
  const [kaloriedagbogOpen, setKaloriedagbogOpen] = useState(false);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isAddShoppingOpen, setIsAddShoppingOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [showAllLists, setShowAllLists] = useState(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateMeals, setNewTemplateMeals] = useState<Record<string, string>>({});
  const [isAddQuickSetupOpen, setIsAddQuickSetupOpen] = useState(false);
  const [newQuickSetup, setNewQuickSetup] = useState({ title: '', description: '' });
  const [newListName, setNewListName] = useState('Indkøbsliste');
  const [newListDate, setNewListDate] = useState('');
  const [detailItem, setDetailItem] = useState<ShoppingItem | null>(null);
  const [detailNutrition, setDetailNutrition] = useState<ShoppingItem['nutritionPer100g'] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<ProductCardData[]>([]);
  const [isProductSearching, setIsProductSearching] = useState(false);
  const searchCache = useRef<Record<string, ProductCardData[]>>({});
  const searchAbort = useRef<AbortController | null>(null);
  const [newMeal, setNewMeal] = useState({
    date: todayString,
    mealType: 'dinner',
    title: '',
    notes: '',
    ingredientsText: '',
    instructions: ''
  });
  const [newShopping, setNewShopping] = useState({
    name: '',
    quantity: '',
    category: 'Dagligvarer',
    neededForDate: '',
    priority: 'normal',
    neededForMealId: 'none'
  });
  const [autoPlannerSettings, setAutoPlannerSettings] = useState({
    childFriendly: true,
    replaceExisting: true,
    favoriteKeywords: '',
    avoidIngredients: '',
    useChildAllergies: true
  });
  const [liveSyncEnabled] = useState(true);
  const [selectedMealGuideId, setSelectedMealGuideId] = useState<string | null>(null);
  const [guideCompletedSteps, setGuideCompletedSteps] = useState<Set<number>>(new Set());
  const [mealGuideVideoPlaying, setMealGuideVideoPlaying] = useState(false);
  // Recipe browser
  const [recipeBrowserOpen, setRecipeBrowserOpen] = useState(false);
  const [recipeCategory, setRecipeCategory] = useState('Alle');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeServings, setRecipeServings] = useState(4);
  const [servingsInput, setServingsInput] = useState('4');
  const [nutritionUnit, setNutritionUnit] = useState<'portion' | '100g' | '1g' | 'total'>('portion');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  // Recipe creation
  const [createRecipeOpen, setCreateRecipeOpen] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '', description: '', category: 'Aftensmad', servings: 4,
    prepTime: 15, cookTime: 30, difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    ingredientsText: '', stepsText: '', tags: [] as string[], childFriendly: true, shareWithFamily: true,
  });
  const [recipeCategorySheetOpen, setRecipeCategorySheetOpen] = useState(false);
  const [recipeDifficultySheetOpen, setRecipeDifficultySheetOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [recipeHeaderVisible, setRecipeHeaderVisible] = useState(true);
  const recipeLastScrollY = useRef(0);
  // Madplan from recipe detail
  const [mealPlanDate, setMealPlanDate] = useState(todayString);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [addingToMealPlan, setAddingToMealPlan] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  // Kaloriedagbog state
  const [dagbogSelectedChild, setDagbogSelectedChild] = useState<string | null>(null);
  const [dagbogDate, setDagbogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [foodLog, setFoodLog] = useState<FoodLogEntry[]>([]);
  const dailyCalorieGoal = memberNutritionGoals[currentUser?.id ?? '']?.kcal || 2000;
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [addFoodMeal, setAddFoodMeal] = useState('morgenmad');
  const [newFoodEntry, setNewFoodEntry] = useState({ food: '', kcal: '', protein: '', carbs: '', fat: '' });
  const [shopScanLoading, setShopScanLoading] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<OFFResult | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  // Sync servingsInput string when recipeServings changes from +/- buttons or unit switch
  useEffect(() => { setServingsInput(String(recipeServings)); }, [recipeServings]);

  // Auto-select first shopping list (only if user hasn't explicitly opened "Alle lister")
  useEffect(() => {
    if (!activeShoppingListId && shoppingLists.length > 0 && !showAllLists) {
      setActiveShoppingListId(shoppingLists[0].id);
    }
  }, [shoppingLists, activeShoppingListId, showAllLists]);

  // Sync local activeTab to store so TopBar can read it
  useEffect(() => {
    useAppStore.getState().setMadSubTab(activeTab);
    return () => { useAppStore.getState().setMadSubTab(null); };
  }, [activeTab]);

  // Product search: FOOD_ITEMS first (instant), then OpenFoodFacts API (debounced)
  useEffect(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) {
      setProductResults([]);
      setIsProductSearching(false);
      return;
    }
    // 1. Instant local FOOD_ITEMS search
    const localMatches: ProductCardData[] = FOOD_ITEMS
      .filter(f => f.name.toLowerCase().includes(q) || (f.brand?.toLowerCase().includes(q) ?? false))
      .slice(0, 12)
      .map(f => ({
        id: f.id,
        name: f.name,
        brand: f.brand,
        category: f.category,
        nutritionPer100g: {
          energyKcal: f.kcalPer100g,
          protein: f.proteinPer100g,
          carbs: f.carbsPer100g,
          fat: f.fatPer100g,
          fiber: f.fiberPer100g,
          sugar: f.sugarPer100g,
          salt: f.saltPer100g,
        },
      }));
    if (localMatches.length > 0) {
      setProductResults(localMatches);
      setIsProductSearching(false);
      return;
    }
    // 2. Check cache
    if (searchCache.current[q]) {
      setProductResults(searchCache.current[q]);
      setIsProductSearching(false);
      return;
    }
    // 3. Debounced OpenFoodFacts API search
    const timer = setTimeout(async () => {
      searchAbort.current?.abort();
      const controller = new AbortController();
      searchAbort.current = controller;
      setIsProductSearching(true);
      const { products } = await searchProducts(q, 1, 8, controller.signal);
      if (controller.signal.aborted) return;
      const mapped = products.map((p, i) => ({
        id: p.barcode || `off-${i}-${Date.now()}`,
        name: p.name,
        brand: p.brand,
        imageUrl: p.imageUrl,
        quantity: p.quantity,
        category: p.categories?.split(',')[0]?.trim(),
        barcode: p.barcode,
        nutriscoreGrade: p.nutriscoreGrade,
        nutritionPer100g: {
          energyKcal: p.kcalPer100g,
          protein: p.proteinPer100g,
          carbs: p.carbsPer100g,
          fat: p.fatPer100g,
          fiber: p.fiberPer100g,
          sugar: p.sugarPer100g,
          salt: p.saltPer100g,
        },
      }));
      searchCache.current[q] = mapped;
      setProductResults(mapped);
      setIsProductSearching(false);
    }, 400);
    return () => { clearTimeout(timer); searchAbort.current?.abort(); };
  }, [productQuery]);

  // Auto-fetch nutrition when product detail opens
  useEffect(() => {
    if (!detailItem) {
      setDetailNutrition(null);
      setDetailLoading(false);
      return;
    }
    // 1. Check item's own nutrition
    if (detailItem.nutritionPer100g && detailItem.nutritionPer100g.energyKcal != null) {
      setDetailNutrition(detailItem.nutritionPer100g);
      setDetailLoading(false);
      return;
    }
    // 2. Check FOOD_ITEMS fuzzy match
    const itemName = detailItem.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
    const match = FOOD_ITEMS.find(f => {
      const fName = f.name.toLowerCase();
      const fFull = f.brand ? `${f.brand.toLowerCase()} ${fName}` : fName;
      return fName === itemName || itemName.includes(fName) || fFull === itemName || itemName.includes(fFull);
    });
    if (match) {
      const n = { energyKcal: match.kcalPer100g, protein: match.proteinPer100g, carbs: match.carbsPer100g, fat: match.fatPer100g, fiber: match.fiberPer100g, sugar: match.sugarPer100g, salt: match.saltPer100g };
      setDetailNutrition(n);
      setDetailLoading(false);
      return;
    }
    // 3. Search OpenFoodFacts by name
    let cancelled = false;
    setDetailLoading(true);
    setDetailNutrition(null);
    searchProducts(detailItem.name, 1, 3).then(({ products }) => {
      if (cancelled) return;
      const best = products[0];
      if (best && best.kcalPer100g > 0) {
        const n = { energyKcal: best.kcalPer100g, protein: best.proteinPer100g, carbs: best.carbsPer100g, fat: best.fatPer100g, fiber: best.fiberPer100g, sugar: best.sugarPer100g, salt: best.saltPer100g };
        setDetailNutrition(n);
        // Persist nutrition on the item so it's cached for next time
        apiUpdateShoppingItem(detailItem.id, { nutritionPer100g: n }).catch(() => {});
      }
      setDetailLoading(false);
    });
    return () => { cancelled = true; };
  }, [detailItem]); // eslint-disable-line react-hooks/exhaustive-deps

  const weekDates = useMemo(() => {
    const start = startOfToday();
    return Array.from({ length: 7 }, (_, index) => format(addDays(start, index), 'yyyy-MM-dd'));
  }, []);
  const currentChild = children[0];
  const parseKeywordList = (input: string): string[] => {
    return input
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  };

  const rehydrateSharedState = async () => {
    const storeWithPersist = useAppStore as typeof useAppStore & {
      persist?: { rehydrate?: () => Promise<void> | void };
    };
    await storeWithPersist.persist?.rehydrate?.();
  };

  useEffect(() => {
    if (!liveSyncEnabled) return;

    const syncNow = async (showToast = false) => {
      await rehydrateSharedState();
      if (showToast) {
        toast.message('Delt indkøbsliste synkroniseret');
      }
    };

    void syncNow();

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'familiekoordinering-storage') {
        void syncNow(true);
      }
    };
    const onFocus = () => {
      void syncNow();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [liveSyncEnabled]);

  const upcomingMealPlans = useMemo(() => {
    return mealPlans
      .filter((meal) => weekDates.includes(meal.date))
      .sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        return sortMealType(a.mealType, b.mealType);
      });
  }, [mealPlans, weekDates]);

  // Filter items by active list
  const activeListItems = useMemo(() => {
    if (!activeShoppingListId) return shoppingItems;
    return shoppingItems.filter((item) => item.listId === activeShoppingListId);
  }, [shoppingItems, activeShoppingListId]);

  const pendingShopping = useMemo(() => {
    return activeListItems.filter((item) => !item.purchased);
  }, [activeListItems]);

  const purchasedShopping = useMemo(() => {
    return activeListItems.filter((item) => item.purchased);
  }, [activeListItems]);

  const parseIngredients = (ingredientsText: string): string[] => {
    return ingredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const resetMealForm = () => {
    setNewMeal({
      date: todayString,
      mealType: 'dinner',
      title: '',
      notes: '',
      ingredientsText: '',
      instructions: ''
    });
  };

  const handleAddMeal = async () => {
    if (!newMeal.title.trim() || !newMeal.date) {
      toast.error('Skriv titel og vælg dag');
      return;
    }
    setIsSaving(true);
    try {
      const ingredients = parseIngredients(newMeal.ingredientsText);
      await createMealPlan({
        date: newMeal.date,
        mealType: newMeal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        title: newMeal.title.trim(),
        notes: newMeal.notes.trim() || undefined,
        recipe: ingredients.length > 0 || newMeal.instructions.trim()
          ? {
              name: newMeal.title.trim(),
              ingredients,
              instructions: newMeal.instructions.trim()
            }
          : undefined
      });
      toast.success('Ret tilføjet til madplanen');
      setIsAddMealOpen(false);
      resetMealForm();
    } catch {
      toast.error('Kunne ikke tilføje ret');
    } finally {
      setIsSaving(false);
    }
  };

  const fillMealFromSuggestion = () => {
    const suggestion = mealSuggestions[Math.floor(Math.random() * mealSuggestions.length)];
    setNewMeal((prev) => ({
      ...prev,
      title: suggestion.title,
      mealType: suggestion.mealType,
      ingredientsText: suggestion.ingredients.join('\n'),
      instructions: suggestion.instructions
    }));
    setIsAddMealOpen(true);
  };

  const repeatMealWeekly = (mealId: string, weeks: number = 4) => {
    const meal = mealPlans.find((entry) => entry.id === mealId);
    if (!meal) return;

    const originDate = parseISO(meal.date);
    const weekday = (originDate.getDay() + 6) % 7;
    void updateMealPlan(meal.id, {
      isRecurring: true,
      recurringPattern: 'weekly',
      recurringWeekday: weekday
    });

    let added = 0;
    for (let week = 1; week <= weeks; week += 1) {
      const targetDate = format(addDays(originDate, week * 7), 'yyyy-MM-dd');
      const exists = mealPlans.some((existing) => (
        existing.date === targetDate &&
        existing.mealType === meal.mealType &&
        existing.title.toLowerCase() === meal.title.toLowerCase()
      ));

      if (exists) continue;

      createMealPlan({
        date: targetDate,
        mealType: meal.mealType,
        title: meal.title,
        notes: meal.notes,
        isRecurring: true,
        recurringPattern: 'weekly',
        recurringWeekday: weekday,
        sourceMealId: meal.id,
        recipe: meal.recipe
          ? {
              name: meal.recipe.name,
              ingredients: [...meal.recipe.ingredients],
              instructions: meal.recipe.instructions
            }
          : undefined
      }).catch(() => {});
      added += 1;
    }

    if (added === 0) {
      toast.message('Retten er allerede lagt ind i de kommende uger');
      return;
    }
    toast.success(`Retten gentages nu ugentligt (${added} uger tilføjet)`);
  };

  const addIngredientsToShopping = (mealId: string): number => {
    const meal = mealPlans.find((entry) => entry.id === mealId);
    if (!meal || !meal.recipe || meal.recipe.ingredients.length === 0) return 0;

    let addedCount = 0;
    meal.recipe.ingredients.forEach((ingredient) => {
      const normalized = ingredient.trim().toLowerCase();
      if (!normalized) return;

      const alreadyExists = shoppingItems.some((item) => (
        item.name.trim().toLowerCase() === normalized && item.neededForDate === meal.date
      ));

      if (alreadyExists) return;

      createShoppingItem({
        name: ingredient.trim(),
        purchased: false,
        addedBy: currentUser?.id || users[0]?.id || 'p1',
        category: 'Dagligvarer',
        neededForDate: meal.date,
        neededForMealId: meal.id,
        priority: 'normal',
        listId: activeShoppingListId || shoppingLists[0]?.id || undefined,
      }).catch(() => {});
      addedCount += 1;
    });

    return addedCount;
  };

  const handleGenerateShoppingFromWeek = () => {
    const mealsThisWeek = mealPlans.filter((meal) => weekDates.includes(meal.date));
    let addedCount = 0;

    mealsThisWeek.forEach((meal) => {
      if (!meal.recipe) return;
      meal.recipe.ingredients.forEach((ingredient) => {
        const normalized = ingredient.trim().toLowerCase();
        if (!normalized) return;

        const alreadyExists = shoppingItems.some((item) => (
          item.name.trim().toLowerCase() === normalized && item.neededForDate === meal.date
        ));

        if (alreadyExists) return;

        createShoppingItem({
          name: ingredient.trim(),
          purchased: false,
          addedBy: currentUser?.id || users[0]?.id || 'p1',
          category: 'Dagligvarer',
          neededForDate: meal.date,
          neededForMealId: meal.id,
          priority: 'normal',
          listId: activeShoppingListId || shoppingLists[0]?.id || undefined,
        }).catch(() => {});
        addedCount += 1;
      });
    });

    if (addedCount === 0) {
      toast.message('Indkøbslisten er allerede opdateret');
      return;
    }

    toast.success(`${addedCount} varer tilføjet fra madplanen`);
  };

  const handleAddShopping = async () => {
    if (!newShopping.name.trim()) {
      toast.error('Skriv en vare');
      return;
    }
    setIsSaving(true);
    try {
      await createShoppingItem({
        name: newShopping.name.trim(),
        quantity: newShopping.quantity.trim() || undefined,
        purchased: false,
        addedBy: currentUser?.id || users[0]?.id || 'p1',
        category: newShopping.category,
        neededForDate: newShopping.neededForDate || undefined,
        neededForMealId: newShopping.neededForMealId !== 'none' ? newShopping.neededForMealId : undefined,
        priority: newShopping.priority as 'low' | 'normal' | 'high',
        listId: activeShoppingListId || shoppingLists[0]?.id || undefined,
      });
      toast.success('Vare tilføjet');
      setIsAddShoppingOpen(false);
      setNewShopping({
        name: '',
        quantity: '',
        category: 'Dagligvarer',
        neededForDate: '',
        priority: 'normal',
        neededForMealId: 'none'
      });
    } catch {
      toast.error('Kunne ikke tilføje vare');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleShoppingItem = (itemId: string, purchased: boolean) => {
    apiUpdateShoppingItem(itemId, {
      purchased,
      purchasedBy: purchased ? currentUser?.id : undefined,
      purchasedAt: purchased ? new Date().toISOString() : undefined
    }).catch(() => {});
  };

  const markAllVisibleShoppingPurchased = () => {
    if (visiblePendingShopping.length === 0) return;
    const purchasedAt = new Date().toISOString();
    const purchasedBy = currentUser?.id || users[0]?.id || 'p1';
    visiblePendingShopping.forEach((item) => {
      apiUpdateShoppingItem(item.id, { purchased: true, purchasedAt, purchasedBy }).catch(() => {});
    });
    toast.success(`${visiblePendingShopping.length} varer markeret som købt`);
  };

  const resetPurchasedShoppingItems = () => {
    if (purchasedShopping.length === 0) return;
    purchasedShopping.forEach((item) => {
      apiUpdateShoppingItem(item.id, {
        purchased: false,
        purchasedAt: undefined,
        purchasedBy: undefined
      }).catch(() => {});
    });
    toast.success('Købte varer nulstillet');
  };

  /* Cleaning handlers — reserved for cleaning tab UI
  const handleAddCleaningTask = () => { ... };
  const addTemplateCleaningTask = (template) => { ... };
  */

  const applyIdea = (ideaId: string) => {
    if (ideaId === 'weekly-check-in') {
      const baseDate = startOfToday();
      const sunday = setDay(baseDate, 0, { weekStartsOn: 1 });
      const targetDay = sunday < baseDate ? addDays(sunday, 7) : sunday;
      const startAt = new Date(targetDay);
      startAt.setHours(19, 30, 0, 0);
      const endAt = new Date(targetDay);
      endAt.setHours(20, 0, 0, 0);

      createEvent({
        title: 'Ugentlig familie check-in',
        type: 'meeting',
        startDate: startAt.toISOString(),
        endDate: endAt.toISOString(),
        createdBy: currentUser?.id || users[0]?.id || 'p1',
        description: 'Kort planlægningsmøde om ugeplan, måltider og overleveringer.'
      }).catch(() => {});
      toast.success('Check-in er lagt i kalenderen');
      return;
    }

    if (ideaId === 'meal-routine') {
      createTask({
        title: 'Lav madplan for næste uge',
        assignedTo: currentUser?.id || users[0]?.id || 'p1',
        createdBy: currentUser?.id || users[0]?.id || 'p1',
        completed: false,
        category: 'general',
        isRecurring: true,
        recurringPattern: 'weekly',
        plannedWeekday: 6
      }).catch(() => {});
      toast.success('Madplan-rutine oprettet');
      return;
    }

    if (ideaId === 'starter-shopping') {
      ['Havregryn', 'Mælk', 'Frugt', 'Rugbrød', 'Toiletpapir'].forEach((name) => {
        const exists = shoppingItems.some((item) => item.name.toLowerCase() === name.toLowerCase() && !item.purchased);
        if (exists) return;
        createShoppingItem({
          name,
          purchased: false,
          addedBy: currentUser?.id || users[0]?.id || 'p1',
          category: 'Basis',
          priority: 'normal',
          listId: activeShoppingListId || shoppingLists[0]?.id || undefined,
        }).catch(() => {});
      });
      toast.success('Basisliste tilføjet');
      return;
    }

    if (ideaId === 'monthly-deep-clean') {
      createTask({
        title: 'Månedlig dybderengøring af køkken og bad',
        area: 'Køkken + badeværelse',
        assignedTo: currentUser?.id || users[0]?.id || 'p1',
        createdBy: currentUser?.id || users[0]?.id || 'p1',
        completed: false,
        category: 'cleaning',
        isRecurring: true,
        recurringPattern: 'monthly',
        plannedWeekday: 5
      }).catch(() => {});
      toast.success('Månedlig rengøringsrutine oprettet');
    }
  };

  const pushNotification = (
    type: 'meal_plan' | 'shopping_reminder' | 'cleaning_reminder',
    title: string,
    message: string
  ) => {
    const nowMs = Date.now();
    const alreadyPushedRecently = notifications.some((notification) => (
      notification.type === type &&
      notification.title === title &&
      nowMs - new Date(notification.createdAt).getTime() < 6 * 60 * 60 * 1000
    ));

    if (alreadyPushedRecently) return false;

    addNotification({
      id: notificationId(),
      type,
      title,
      message,
      recipientId: currentUser?.id || users[0]?.id || 'p1',
      read: false,
      createdAt: new Date().toISOString()
    });
    return true;
  };

  /* setupHomeReminders — reserved for future reminders feature */

  const applyWeekTemplate = (templateId: string) => {
    const template = weekTemplates.find((entry) => entry.id === templateId);
    if (!template) return;

    const ownerId = currentUser?.id || users[0]?.id || 'p1';
    const baseDate = startOfToday();
    let mealsAdded = 0;
    let cleaningAdded = 0;

    template.meals.forEach((meal) => {
      const date = format(addDays(baseDate, meal.dayOffset), 'yyyy-MM-dd');
      const exists = mealPlans.some((existing) => (
        existing.date === date &&
        existing.mealType === meal.mealType &&
        existing.title.toLowerCase() === meal.title.toLowerCase()
      ));
      if (exists) return;

      createMealPlan({
        date,
        mealType: meal.mealType,
        title: meal.title,
        notes: meal.notes,
        recipe: {
          name: meal.title,
          ingredients: meal.ingredients,
          instructions: meal.instructions
        }
      }).catch(() => {});
      mealsAdded += 1;
    });

    template.cleaning.forEach((item) => {
      const exists = tasks.some((task) => (
        task.category === 'cleaning' &&
        task.title.toLowerCase() === item.title.toLowerCase() &&
        task.plannedWeekday === item.weekday
      ));
      if (exists) return;

      createTask({
        title: item.title,
        area: item.area,
        assignedTo: ownerId,
        createdBy: ownerId,
        completed: false,
        category: 'cleaning',
        isRecurring: true,
        recurringPattern: item.recurringPattern,
        plannedWeekday: item.weekday
      }).catch(() => {});
      cleaningAdded += 1;
    });

    if (mealsAdded === 0 && cleaningAdded === 0) {
      toast.message('Skabelonen er allerede lagt ind');
      return;
    }

    pushNotification(
      'meal_plan',
      `Skabelon tilføjet: ${template.name}`,
      'Ugens måltider og huslige rutiner er nu opdateret.'
    );
    toast.success(`Skabelon aktiveret: ${mealsAdded} retter og ${cleaningAdded} pligter`);
  };

  const scoreAutoPlanCandidate = (candidate: AutoMealCandidate): number => {
    let score = 0;
    const mealText = `${candidate.title} ${candidate.ingredients.join(' ')}`.toLowerCase();
    const favoriteKeywords = parseKeywordList(autoPlannerSettings.favoriteKeywords);
    const manualAvoidKeywords = parseKeywordList(autoPlannerSettings.avoidIngredients);
    const allergyKeywords = autoPlannerSettings.useChildAllergies
      ? (currentChild?.allergies || []).map((allergy) => allergy.toLowerCase())
      : [];
    const avoidKeywords = [...manualAvoidKeywords, ...allergyKeywords];

    if (autoPlannerSettings.childFriendly) {
      score += candidate.childFriendly ? 4 : -3;
    } else {
      score += candidate.childFriendly ? 1 : 2;
    }

    favoriteKeywords.forEach((keyword) => {
      if (mealText.includes(keyword)) {
        score += 3;
      }
    });

    avoidKeywords.forEach((keyword) => {
      if (mealText.includes(keyword)) {
        score -= 100;
      }
    });

    return score;
  };

  const generateAutoWeekPlan = () => {
    const baseDate = startOfToday();
    const favoriteKeywords = parseKeywordList(autoPlannerSettings.favoriteKeywords);
    const manualAvoidKeywords = parseKeywordList(autoPlannerSettings.avoidIngredients);
    const allergyKeywords = autoPlannerSettings.useChildAllergies
      ? (currentChild?.allergies || []).map((allergy) => allergy.toLowerCase())
      : [];
    const avoidKeywords = [...manualAvoidKeywords, ...allergyKeywords];

    const rankedCandidates = [...autoMealCandidates]
      .filter((candidate) => {
        if (avoidKeywords.length === 0) return true;
        const mealText = `${candidate.title} ${candidate.ingredients.join(' ')}`.toLowerCase();
        return !avoidKeywords.some((keyword) => mealText.includes(keyword));
      })
      .sort((a, b) => {
        const scoreDiff = scoreAutoPlanCandidate(b) - scoreAutoPlanCandidate(a);
        if (scoreDiff !== 0) return scoreDiff;
        return a.title.localeCompare(b.title);
      });
    if (rankedCandidates.length === 0) {
      toast.error('Ingen forslag fundet med de valgte allergi/ingredienstregler');
      return;
    }

    let added = 0;
    let replaced = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const date = format(addDays(baseDate, dayOffset), 'yyyy-MM-dd');
      const existingDinners = mealPlans.filter((meal) => meal.date === date && meal.mealType === 'dinner');

      if (existingDinners.length > 0 && !autoPlannerSettings.replaceExisting) {
        continue;
      }

      if (autoPlannerSettings.replaceExisting) {
        existingDinners.forEach((meal) => void deleteMealPlan(meal.id));
        replaced += existingDinners.length;
      }

      const suggestion = rankedCandidates[dayOffset % rankedCandidates.length];
      const suggestionText = `${suggestion.title} ${suggestion.ingredients.join(' ')}`.toLowerCase();
      const matchingFavorites = favoriteKeywords.filter((keyword) => suggestionText.includes(keyword));
      createMealPlan({
        date,
        mealType: 'dinner',
        title: suggestion.title,
        notes: matchingFavorites.length > 0
          ? `Auto-plan: matcher favoritter (${matchingFavorites.join(', ')})`
          : autoPlannerSettings.childFriendly
            ? 'Auto-plan: børnevenlig prioritering'
            : 'Auto-plan: baseret på dine valg',
        recipe: {
          name: suggestion.title,
          ingredients: suggestion.ingredients,
          instructions: suggestion.instructions
        }
      }).catch(() => {});
      added += 1;
    }

    if (added === 0) {
      toast.message('Ingen ændringer lavet. Slå "Erstat eksisterende retter" til for at opdatere.');
      return;
    }

    pushNotification(
      'meal_plan',
      'Ugeplan er klar',
      'Madplanen er nu udfyldt automatisk for de næste 7 dage.'
    );
    toast.success(`Auto-plan oprettet: ${added} middage` + (replaced > 0 ? ` (erstattede ${replaced})` : ''));
  };

  const mealsByDate = useMemo(() => {
    return weekDates.map((date) => ({
      date,
      meals: upcomingMealPlans.filter((meal) => meal.date === date)
    }));
  }, [upcomingMealPlans, weekDates]);

  const selectedMealGuide = useMemo(() => {
    if (!selectedMealGuideId) return null;
    return mealPlans.find((meal) => meal.id === selectedMealGuideId) || null;
  }, [selectedMealGuideId, mealPlans]);

  const visiblePendingShopping = useMemo(() => {
    return [...pendingShopping].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [pendingShopping]);

  // Filtered recipes for the browser
  const allRecipes = useMemo(() => [...recipes, ...userRecipes], [userRecipes]);
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((r: Recipe) => {
      const matchCat = recipeCategory === 'Alle' || r.category === recipeCategory;
      const matchSearch = !recipeSearch.trim() ||
        r.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
        r.tags.some((t: string) => t.toLowerCase().includes(recipeSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [recipeCategory, recipeSearch]);

  // Eligible household members for meal plan (respects family mode + GDPR)
  const eligibleMembers = useMemo(() => {
    const members: { id: string; name: string; isChild: boolean; canConfigure: boolean; kcalGoal?: number }[] = [];
    // Always add current user
    if (currentUser) {
      members.push({
        id: currentUser.id,
        name: 'Mig',
        isChild: false,
        canConfigure: true,
        kcalGoal: memberNutritionGoals[currentUser.id]?.kcal,
      });
    }
    // Add children
    children.forEach(c => {
      members.push({
        id: c.id,
        name: c.name,
        isChild: true,
        canConfigure: true, // Parents can configure children's goals
        kcalGoal: memberNutritionGoals[c.id]?.kcal,
      });
    });
    // Other adults: only if not co_parenting, OR co-parent has opted in
    if (household?.familyMode !== 'co_parenting' || household?.sharedMeals) {
      users.filter(u => u.id !== currentUser?.id && u.role !== 'professional').forEach(u => {
        members.push({
          id: u.id,
          name: u.name,
          isChild: false,
          canConfigure: false, // GDPR: cannot configure other adults
          kcalGoal: memberNutritionGoals[u.id]?.kcal,
        });
      });
    }
    return members;
  }, [currentUser, children, users, household, memberNutritionGoals]);

  // Approximate gram weights for non-gram units
  const UNIT_TO_GRAMS: Record<string, number> = {
    g: 1, kg: 1000, ml: 1, dl: 100, l: 1000,
    stk: 80, spsk: 12, tsk: 5, knivspids: 1,
  };

  // Base portion weight (from recipe ingredients at base serving count)
  const basePortionWeight = useMemo(() => {
    if (!selectedRecipe) return 0;
    return selectedRecipe.ingredients.reduce(
      (sum, ing) => sum + ing.amount * (UNIT_TO_GRAMS[ing.unit] ?? 10), 0
    ) / selectedRecipe.servings;
  }, [selectedRecipe]);

  // Total grams for current selection (unit × recipeServings)
  const totalGrams = useMemo(() => {
    switch (nutritionUnit) {
      case 'portion': return basePortionWeight * recipeServings;
      case '100g': return 100 * recipeServings;
      case '1g': return recipeServings;
      case 'total': return basePortionWeight * (selectedRecipe?.servings ?? 4);
    }
  }, [nutritionUnit, recipeServings, basePortionWeight, selectedRecipe]);

  // Equivalent recipe servings for ingredient scaling
  const equivalentServings = basePortionWeight > 0
    ? totalGrams / basePortionWeight
    : recipeServings;

  // Nutrition for the selected amount (unit × portioner)
  function getNutritionValue(perServing: number): number | string {
    const perGram = basePortionWeight > 0 ? perServing / basePortionWeight : 0;
    switch (nutritionUnit) {
      case 'portion': return Math.round(perServing * recipeServings);
      case '100g': return Math.round(perGram * 100 * recipeServings);
      case '1g': return Math.round(perGram * recipeServings * 10) / 10;
      case 'total': {
        const baseTotal = selectedRecipe ? perServing * selectedRecipe.servings : 0;
        return Math.round(baseTotal);
      }
    }
  }

  // Portion calculation based on calorie goals — uses total nutrition
  const portionCalculation = useMemo(() => {
    if (!selectedRecipe || basePortionWeight <= 0) return [];
    const selected = eligibleMembers.filter(m => selectedMembers.includes(m.id));
    if (selected.length === 0) return [];

    const kcalPerGram = selectedRecipe.nutrition.kcal / basePortionWeight;
    const protPerGram = selectedRecipe.nutrition.protein / basePortionWeight;
    const carbsPerGram = selectedRecipe.nutrition.carbs / basePortionWeight;
    const fatPerGram = selectedRecipe.nutrition.fat / basePortionWeight;
    const totalRecipeKcal = kcalPerGram * totalGrams;

    const maaltidsAndel = 0.33;
    const allHaveGoals = selected.every(m => m.kcalGoal);

    if (!allHaveGoals) {
      const equalPercent = Math.round(100 / selected.length);
      return selected.map(m => ({
        name: m.name,
        kcal: Math.round(totalRecipeKcal / selected.length),
        protein: Math.round(protPerGram * totalGrams / selected.length),
        carbs: Math.round(carbsPerGram * totalGrams / selected.length),
        fat: Math.round(fatPerGram * totalGrams / selected.length),
        grams: Math.round(totalGrams / selected.length),
        percent: equalPercent,
      }));
    }

    const personsWithNeeds = selected.map(m => ({
      ...m,
      mealKcal: (m.kcalGoal ?? 2000) * maaltidsAndel,
    }));
    const totalMealKcal = personsWithNeeds.reduce((s, p) => s + p.mealKcal, 0);

    return personsWithNeeds.map(p => {
      const share = p.mealKcal / totalMealKcal;
      return {
        name: p.name,
        kcal: Math.round(totalRecipeKcal * share),
        protein: Math.round(protPerGram * totalGrams * share),
        carbs: Math.round(carbsPerGram * totalGrams * share),
        fat: Math.round(fatPerGram * totalGrams * share),
        grams: Math.round(totalGrams * share),
        percent: Math.round(share * 100),
      };
    });
  }, [selectedMembers, eligibleMembers, selectedRecipe, recipeServings, basePortionWeight, totalGrams]);

  // Handle TopBar-triggered actions via store
  const madAction = useAppStore(s => s.madAction);
  useEffect(() => {
    if (!madAction) return;
    switch (madAction) {
      case 'open-recipes': setRecipeBrowserOpen(true); break;
      case 'add-meal': setIsAddMealOpen(true); break;
      case 'generate-shopping': handleGenerateShoppingFromWeek(); break;
      case 'from-meal-plan': { setNewShopping({ name: '', quantity: '', category: 'Dagligvarer', neededForDate: '', priority: 'normal', neededForMealId: 'none' }); setIsAddShoppingOpen(true); break; }
      case 'templates-add': { setNewTemplateName(''); setNewTemplateMeals({}); setIsAddTemplateOpen(true); break; }
      case 'quick-setup-add': { setNewQuickSetup({ title: '', description: '' }); setIsAddQuickSetupOpen(true); break; }
    }
    useAppStore.getState().setMadAction(null);
  }, [madAction]);

  // Fullscreen barcode scan for shopping list (same as Køleskab)
  async function handleScanShopping() {
    setShopScanLoading(true);
    const barcode = await startBarcodeScanner();
    if (!barcode) { setShopScanLoading(false); return; }
    const product = await fetchFromOpenFoodFacts(barcode);
    setShopScanLoading(false);
    if (product) {
      setScannedProduct(product);
      setScannedBarcode(barcode);
    } else {
      toast.error(`Vare ikke fundet for stregkode ${barcode}`);
      setIsAddShoppingOpen(true);
    }
  }

  function handleAddScannedToShopping() {
    if (!scannedProduct) return;
    const productName = scannedProduct.brand
      ? `${scannedProduct.brand} ${scannedProduct.name}`
      : scannedProduct.name;
    createShoppingItem({
      name: productName,
      quantity: scannedProduct.quantity || undefined,
      purchased: false,
      addedBy: currentUser?.id || users[0]?.id || 'p1',
      category: 'Dagligvarer',
      priority: 'normal',
      listId: activeShoppingListId || undefined,
    }).catch(() => {});
    toast.success(`${productName} tilføjet til indkøbslisten`);
    setScannedProduct(null);
    setScannedBarcode(null);
  }

  return (
    <div className="space-y-1.5 py-1">
      <MadOgHjemSidePanel activeSubTab={activeTab} onSelectSubTab={setActiveTab} />

      {/* Confirm close dialog for all forms */}
      <ConfirmCloseDialog
        open={confirmClose}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          if (isAddMealOpen) { setIsAddMealOpen(false); resetMealForm(); }
          if (isAddShoppingOpen) { setIsAddShoppingOpen(false); setNewShopping({ name: '', quantity: '', category: 'Dagligvarer', neededForDate: '', priority: 'normal', neededForMealId: 'none' }); }
        }}
      />

      {/* Full-screen product detail after barcode scan */}
      <AnimatePresence>
        {scannedProduct && (
          <motion.div
            key="product-detail"
            className="fixed inset-0 z-[55] bg-[#faf9f6] flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: { offset: { x: number } }) => { if (info.offset.x > 100) { setScannedProduct(null); setScannedBarcode(null); } }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6]">
              <button
                onClick={() => { setScannedProduct(null); setScannedBarcode(null); }}
                className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] active:scale-[0.92] transition-transform"
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </button>
              <h1 className="text-[17px] font-bold text-[#2f2f2d]">Produktdetaljer</h1>
              <div className="w-9" />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pt-4 pb-8 max-w-[430px] mx-auto space-y-5">

                {/* Product image */}
                {scannedProduct.imageUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={scannedProduct.imageUrl}
                      alt={scannedProduct.name}
                      className="h-48 w-48 rounded-[8px] object-contain bg-white border border-[#e5e3dc]"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="flex h-48 w-48 items-center justify-center rounded-[8px] bg-[#f2f1ed] border border-[#e5e3dc]">
                      <Package className="h-16 w-16 text-[#b0ada4]" />
                    </div>
                  </div>
                )}

                {/* Name + brand + quantity */}
                <div className="text-center space-y-1">
                  <h2 className="text-[20px] font-black text-[#2f2f2d] leading-tight">
                    {scannedProduct.name}
                  </h2>
                  {scannedProduct.brand && (
                    <p className="text-[14px] text-[#78766d]">{scannedProduct.brand}</p>
                  )}
                  {scannedProduct.quantity && (
                    <p className="text-[13px] text-[#9a978f]">{scannedProduct.quantity}</p>
                  )}
                </div>

                {/* Nutrition per 100g label */}
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#75736b]">
                  Næringsindhold pr. 100g
                </p>

                {/* 4-column nutrition grid */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Kcal', value: Math.round(scannedProduct.kcalPer100g), unit: '', color: '#f58a2d' },
                    { label: 'Protein', value: Math.round(scannedProduct.proteinPer100g * 10) / 10, unit: 'g', color: '#3b82f6' },
                    { label: 'Kulh.', value: Math.round(scannedProduct.carbsPer100g * 10) / 10, unit: 'g', color: '#f59e0b' },
                    { label: 'Fedt', value: Math.round(scannedProduct.fatPer100g * 10) / 10, unit: 'g', color: '#ef4444' },
                  ].map(n => (
                    <div key={n.label} className="rounded-[8px] bg-white border border-[#e5e3dc] p-2.5 text-center">
                      <p className="text-[16px] font-black leading-tight" style={{ color: n.color }}>{n.value}{n.unit}</p>
                      <p className="text-[10px] text-[#9a978f] mt-0.5">{n.label}</p>
                    </div>
                  ))}
                </div>

                {/* Additional nutrition (fiber, sugar, salt) */}
                {(scannedProduct.fiberPer100g != null || scannedProduct.sugarPer100g != null || scannedProduct.saltPer100g != null) && (
                  <div className="rounded-[8px] border border-[#e5e3dc] bg-white p-4 space-y-2.5">
                    {[
                      { label: 'Kostfibre', value: scannedProduct.fiberPer100g, unit: 'g' },
                      { label: 'Sukker', value: scannedProduct.sugarPer100g, unit: 'g' },
                      { label: 'Salt', value: scannedProduct.saltPer100g, unit: 'g' },
                    ].filter(n => n.value != null).map(n => (
                      <div key={n.label} className="flex items-center justify-between">
                        <span className="text-[13px] text-[#78766d]">{n.label}</span>
                        <span className="text-[13px] font-semibold text-[#2f2f2d]">
                          {Math.round(n.value! * 10) / 10}{n.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Barcode display */}
                {scannedBarcode && (
                  <p className="text-[11px] text-[#b0ada4] text-center">Stregkode: {scannedBarcode}</p>
                )}
              </div>
            </div>

            {/* Fixed bottom button */}
            <div className="shrink-0 px-4 pb-[env(safe-area-inset-bottom,24px)] pt-3 bg-[#faf9f6]">
              <button
                onClick={handleAddScannedToShopping}
                className="w-full rounded-[8px] bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform"
              >
                Tilføj til indkøbsliste
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen new meal page — triggered from TopBar */}
      <AnimatePresence>
        {isAddMealOpen && (
          <motion.div
            key="new-meal"
            className="fixed inset-0 z-[55] bg-[#faf9f6] flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: { offset: { x: number } }) => {
              if (info.offset.x > 100) {
                if (newMeal.title.trim()) { setConfirmClose(true); } else { setIsAddMealOpen(false); resetMealForm(); }
              }
            }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6]">
              <button
                onClick={() => {
                  if (newMeal.title.trim()) { setConfirmClose(true); } else { setIsAddMealOpen(false); resetMealForm(); }
                }}
                className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] active:scale-[0.92] transition-transform"
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </button>
              <h1 className="text-[17px] font-bold text-[#2f2f2d]">Ny ret</h1>
              <div className="w-9" />
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pt-4 pb-8 max-w-[430px] mx-auto space-y-4">
                {/* Date + Meal type */}
                <div className="grid grid-cols-2 gap-3 overflow-hidden">
                  <div className="space-y-1.5 min-w-0 overflow-hidden">
                    <label className="text-[12px] font-semibold text-[#78766d]">Dag</label>
                    <input
                      type="date"
                      value={newMeal.date}
                      onChange={(e) => setNewMeal((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full min-w-0 max-w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] outline-none focus:border-[#f58a2d]"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0 overflow-hidden">
                    <label className="text-[12px] font-semibold text-[#78766d]">Måltid</label>
                    <SelectSheet
                      value={newMeal.mealType}
                      onValueChange={(value) => setNewMeal((prev) => ({ ...prev, mealType: value }))}
                      title="Måltid"
                      options={[
                        { value: 'breakfast', label: 'Morgenmad' },
                        { value: 'lunch', label: 'Frokost' },
                        { value: 'dinner', label: 'Aftensmad' },
                        { value: 'snack', label: 'Snack' },
                      ]}
                      className="rounded-[8px] border border-[#e5e3dc] bg-white text-[#2f2f2d]"
                    />
                  </div>
                </div>

                {/* Dish title */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Ret *</label>
                  <input
                    type="text"
                    value={newMeal.title}
                    onChange={(e) => setNewMeal((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Fx lasagne med salat"
                    autoFocus
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                  />
                </div>

                {/* Ingredients */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Ingredienser (én pr. linje)</label>
                  <textarea
                    value={newMeal.ingredientsText}
                    onChange={(e) => setNewMeal((prev) => ({ ...prev, ingredientsText: e.target.value }))}
                    rows={4}
                    placeholder={'500 g hakket oksekød\n1 løg\n2 dåser tomat'}
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d] resize-none"
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Opskrift / fremgangsmåde</label>
                  <textarea
                    value={newMeal.instructions}
                    onChange={(e) => setNewMeal((prev) => ({ ...prev, instructions: e.target.value }))}
                    rows={3}
                    placeholder="Skriv korte trin..."
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d] resize-none"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Noter</label>
                  <input
                    type="text"
                    value={newMeal.notes}
                    onChange={(e) => setNewMeal((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Fx barnets favorit, kan fryses osv."
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={fillMealFromSuggestion}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[8px] border-2 border-[#e5e3dc] bg-white py-4 text-[14px] font-bold text-[#2f2f2d] active:scale-[0.98] transition-transform"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Foreslå ret
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMeal}
                    disabled={!newMeal.title.trim() || isSaving}
                    className="flex-1 flex items-center justify-center gap-2 rounded-[8px] bg-[#2f2f2f] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
                  >
                    Gem ret
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'meal-plan' && (
        <div className="space-y-2">
          <div className="grid gap-3">
            {mealsByDate.map(({ date, meals }) => {
              const parsedDate = parseISO(date);
              return (
                <Card key={date} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{format(parsedDate, 'EEEE d. MMM', { locale: da })}</span>
                      <div className="flex items-center gap-2">
                        {isToday(parsedDate) && <Badge>I dag</Badge>}
                        {isTomorrow(parsedDate) && <Badge variant="secondary">I morgen</Badge>}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {meals.length === 0 && (
                      <p className="text-sm text-slate-500">Ingen ret planlagt endnu.</p>
                    )}
                    {meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="rounded-[8px] border border-slate-200 p-3"
                        onClick={() => setSelectedMealGuideId(meal.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedMealGuideId(meal.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{getMealTypeLabel(meal.mealType)}</Badge>
                              {meal.isRecurring ? (
                                <Badge variant="secondary">Gentager ugentligt</Badge>
                              ) : null}
                            </div>
                            <p className="mt-2 font-semibold text-slate-900">{meal.title}</p>
                            {meal.notes && <p className="text-sm text-slate-500">{normalizeLegacyAiText(meal.notes)}</p>}
                            {meal.recipe?.ingredients?.length ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {meal.recipe.ingredients.length} ingredienser
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs font-medium text-[#a8662f]">
                              Tryk for trin-for-trin guide
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                repeatMealWeekly(meal.id);
                              }}
                              title="Gentag ugentligt"
                            >
                              <Repeat2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                const added = addIngredientsToShopping(meal.id);
                                if (added === 0) {
                                  toast.message('Ingen nye ingredienser at tilføje');
                                  return;
                                }
                                toast.success(`${added} ingredienser tilføjet`);
                              }}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                void deleteMealPlan(meal.id);
                              }}
                              className="text-rose-500 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {meal.recipe?.instructions ? (
                          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{meal.recipe.instructions}</p>
                        ) : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedMealGuide && (() => {
              const richSteps = buildRichPreparationSteps(
                selectedMealGuide.recipe?.instructions,
                selectedMealGuide.recipe?.ingredients || [],
                selectedMealGuide.title
              );
              const totalDuration = richSteps.reduce((sum, s) => sum + (s.duration || 0), 0);
              const completedCount = guideCompletedSteps.size;
              const progressPercent = richSteps.length > 0 ? Math.round((completedCount / richSteps.length) * 100) : 0;
              const matchedRecipe = findMatchingRecipe(selectedMealGuide.title);
              const guideVideoUrl = matchedRecipe ? getRecipeVideoUrl(matchedRecipe.id) : null;

              return (
                <motion.div
                  key="meal-guide"
                  className="fixed inset-0 z-[55] bg-[#faf9f6] flex flex-col overflow-hidden"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_: unknown, info: { offset: { x: number } }) => {
                    if (info.offset.x > 100) {
                      setSelectedMealGuideId(null);
                      setGuideCompletedSteps(new Set());
                      setMealGuideVideoPlaying(false);
                    }
                  }}
                >
                  {/* Header */}
                  <div className="shrink-0 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6]">
                    <button
                      onClick={() => {
                        setSelectedMealGuideId(null);
                        setGuideCompletedSteps(new Set());
                        setMealGuideVideoPlaying(false);
                      }}
                      className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] active:scale-[0.92] transition-transform"
                    >
                      <ArrowLeft className="h-[18px] w-[18px]" />
                    </button>
                    <h1 className="text-[17px] font-bold text-[#2f2f2d] truncate max-w-[260px]">
                      {selectedMealGuide.title}
                    </h1>
                    <div className="w-9" />
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="px-4 pt-2 pb-8 max-w-[430px] mx-auto space-y-3">
                      {/* Badges + time estimate */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-[#e8e7e0] bg-white text-[#4a4944]">
                          {getMealTypeLabel(selectedMealGuide.mealType)}
                        </Badge>
                        <Badge variant="secondary" className="bg-[#ecebe5] text-[#4a4944]">
                          {format(parseISO(selectedMealGuide.date), 'EEEE d. MMMM', { locale: da })}
                        </Badge>
                        {totalDuration > 0 && (
                          <Badge className="bg-[#fff2e6] text-[#a8662f]">
                            <Clock className="mr-1 h-3 w-3" />
                            ca. {totalDuration} min
                          </Badge>
                        )}
                        {selectedMealGuide.notes?.toLowerCase().includes('auto-plan') && (
                          <Badge className="bg-[#e6f0ff] text-[#2563eb]">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Auto-plan
                          </Badge>
                        )}
                      </div>

                      {/* Video card — only shown if recipe has a video */}
                      {guideVideoUrl && (
                        mealGuideVideoPlaying ? (
                          <div className="rounded-[8px] overflow-hidden border-2 border-[#e5e3dc] bg-black">
                            <video
                              src={guideVideoUrl}
                              controls
                              autoPlay
                              playsInline
                              className="w-full aspect-video"
                              onEnded={() => setMealGuideVideoPlaying(false)}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setMealGuideVideoPlaying(true)}
                            className="flex w-full items-center gap-3 rounded-[8px] border-2 border-[#e5e3dc] bg-[#2f2f2d] px-4 py-3.5 text-left transition-all active:scale-[0.98]"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f58a2d]">
                              <Play className="h-5 w-5 text-white ml-0.5" />
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-white">Se tilberedningsvideo</p>
                              <p className="text-[11px] text-[#9a978f]">Trin-for-trin video</p>
                            </div>
                          </button>
                        )
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[#78766d]">
                          <span>Fremskridt</span>
                          <span>{completedCount} af {richSteps.length} trin · {progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#ecebe5]">
                          <div
                            className="h-full rounded-full bg-[#f58a2d] transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Ingredients card */}
                      {selectedMealGuide.recipe?.ingredients?.length ? (
                        <div className="rounded-[8px] border border-[#e8e7e0] bg-white p-3">
                          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">
                            Ingredienser ({selectedMealGuide.recipe.ingredients.length})
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {selectedMealGuide.recipe.ingredients.map((ingredient, index) => (
                              <div
                                key={`${selectedMealGuide.id}-ingredient-${index}`}
                                className="flex items-center gap-2 py-0.5 text-[12px] text-[#2f2f2d]"
                              >
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f58a2d]" />
                                {ingredient}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Rich step-by-step guide */}
                      <div>
                        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">
                          Trin-for-trin tilberedning
                        </p>
                        <div className="space-y-2">
                          {richSteps.map((step, index) => {
                            const isCompleted = guideCompletedSteps.has(index);
                            return (
                              <div
                                key={`${selectedMealGuide.id}-rstep-${index}`}
                                className={cn(
                                  "rounded-[8px] border bg-white p-3.5 transition-all duration-300",
                                  isCompleted
                                    ? "border-green-200 bg-green-50/50 opacity-75"
                                    : "border-[#e8e7e0]"
                                )}
                              >
                                {/* Step header */}
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() => {
                                      setGuideCompletedSteps(prev => {
                                        const next = new Set(prev);
                                        if (next.has(index)) next.delete(index);
                                        else next.add(index);
                                        return next;
                                      });
                                    }}
                                    className={cn(
                                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition-all",
                                      isCompleted
                                        ? "bg-green-500 text-white"
                                        : "bg-[#f58a2d] text-white"
                                    )}
                                  >
                                    {isCompleted ? '✓' : index + 1}
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className={cn(
                                        "text-[13px] font-semibold",
                                        isCompleted ? "text-green-700 line-through" : "text-[#2f2f2d]"
                                      )}>
                                        {step.title}
                                      </p>
                                      {step.duration && (
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#f0efe8] px-2 py-0.5 text-[10px] font-medium text-[#5f5d56]">
                                          <Timer className="h-2.5 w-2.5" />
                                          {step.duration} min
                                        </span>
                                      )}
                                      {step.temperature && (
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                                          <Flame className="h-2.5 w-2.5" />
                                          {step.temperature}
                                        </span>
                                      )}
                                    </div>

                                    {/* Technique badge */}
                                    {step.technique && (
                                      <span className="mt-1 inline-block rounded-md bg-[#f0efe8] px-1.5 py-0.5 text-[10px] text-[#67645c]">
                                        {step.technique}
                                      </span>
                                    )}

                                    {/* Step description */}
                                    <p className={cn(
                                      "mt-1.5 text-[12px] leading-relaxed",
                                      isCompleted ? "text-green-600" : "text-[#4a4945]"
                                    )}>
                                      {step.description}
                                    </p>

                                    {/* Referenced ingredients */}
                                    {step.ingredients && step.ingredients.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {step.ingredients.map((ing, i) => (
                                          <span
                                            key={i}
                                            className="rounded-full bg-[#fff8f0] px-2 py-0.5 text-[10px] font-medium text-[#a8662f]"
                                          >
                                            {ing}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Helpful tip */}
                                    {step.tip && (
                                      <div className="mt-2 flex items-start gap-1.5 rounded-[8px] bg-[#fdf8ef] px-2.5 py-2">
                                        <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-[#e5a73b]" />
                                        <p className="text-[11px] leading-relaxed text-[#7a6b3e]">{step.tip}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Done message */}
                      {progressPercent === 100 && (
                        <div className="rounded-[8px] border border-green-200 bg-green-50 p-4 text-center">
                          <p className="text-sm font-semibold text-green-700">Alle trin fuldført!</p>
                          <p className="mt-0.5 text-xs text-green-600">Velbekomme — nyd maden!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'fridge' && (
        <KoleskabView />
      )}

      {/* Add shopping item — bottom sheet popup */}
      <AnimatePresence>
        {isAddShoppingOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => {
                if (newShopping.name.trim()) { setConfirmClose(true); } else { setIsAddShoppingOpen(false); }
              }}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom,24px)] max-h-[90vh] flex flex-col"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-[#d8d7cf]" />
              </div>
              <div className="text-center pb-2">
                <h2 className="text-[17px] font-bold text-[#2f2f2d]">Tilføj til indkøbsliste</h2>
              </div>
              <div className="px-4 pt-4 pb-[300px] space-y-4 flex-1 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Vare *</label>
                  <input
                    type="text"
                    value={newShopping.name}
                    onChange={(e) => setNewShopping((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Fx gulerødder"
                    autoFocus
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#78766d]">Mængde</label>
                    <input
                      type="text"
                      value={newShopping.quantity}
                      onChange={(e) => setNewShopping((prev) => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Fx 1 kg"
                      className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#78766d]">Prioritet</label>
                    <SelectSheet
                      value={newShopping.priority}
                      onValueChange={(value) => setNewShopping((prev) => ({ ...prev, priority: value }))}
                      title="Prioritet"
                      options={[
                        { value: 'low', label: 'Lav' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'high', label: 'Høj' },
                      ]}
                      className="rounded-[8px] border-[#e5e3dc] bg-[#faf9f6] text-[#2f2f2d]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#78766d]">Kategori</label>
                    <input
                      type="text"
                      value={newShopping.category}
                      onChange={(e) => setNewShopping((prev) => ({ ...prev, category: e.target.value }))}
                      placeholder="Fx Dagligvarer"
                      className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[#78766d]">Dag</label>
                    <input
                      type="date"
                      value={newShopping.neededForDate}
                      onChange={(e) => setNewShopping((prev) => ({ ...prev, neededForDate: e.target.value }))}
                      className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-3 text-[14px] text-[#2f2f2d] outline-none focus:border-[#f58a2d]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Knyt til ret</label>
                  <SelectSheet
                    value={newShopping.neededForMealId}
                    onValueChange={(value) => setNewShopping((prev) => ({ ...prev, neededForMealId: value }))}
                    title="Knyt til ret"
                    placeholder="Vælg ret"
                    options={[
                      { value: 'none', label: 'Ingen ret valgt' },
                      ...upcomingMealPlans.map((meal) => ({
                        value: meal.id,
                        label: `${format(parseISO(meal.date), 'd. MMM', { locale: da })} - ${meal.title}`,
                      })),
                    ]}
                    className="rounded-[8px] border-[#e5e3dc] bg-[#faf9f6] text-[#2f2f2d]"
                  />
                </div>
                <button
                  onClick={handleAddShopping}
                  disabled={!newShopping.name.trim() || isSaving}
                  className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  Tilføj vare
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {activeTab === 'shopping' && (
        <div className="space-y-3">

          {/* ── Shopping list selector ── */}
          {shoppingLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-[#f2f1ed]">
                <ShoppingCart className="h-8 w-8 text-[#b0ada4]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#2f2f2d]">Ingen indkøbsliste endnu</p>
                <p className="text-[13px] text-[#9a978f] mt-1">Opret en indkøbsliste for at samle dine varer</p>
              </div>
              <button
                onClick={() => { setNewListName('Indkøbsliste'); setNewListDate(''); setCreateListOpen(true); }}
                className="flex items-center gap-2 rounded-[8px] bg-[#f58a2d] px-6 py-3 text-[15px] font-bold text-white active:scale-[0.98] transition-transform"
              >
                <Plus className="h-4 w-4" /> Opret indkøbsliste
              </button>
            </div>
          ) : !activeShoppingListId ? (
            /* ── Card-based list overview (no list selected) ── */
            <div className="space-y-3">
              {/* Create new list */}
              <button
                onClick={() => { setNewListName('Indkøbsliste'); setNewListDate(''); setCreateListOpen(true); }}
                className="flex w-full items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-[#d8d7cf] py-4 text-[14px] font-semibold text-[#9a978f] transition-all active:scale-[0.98] hover:border-[#f58a2d] hover:text-[#f58a2d]"
              >
                <Plus className="h-4 w-4" /> Opret indkøbsliste
              </button>

              {/* List cards */}
              {shoppingLists.map(list => {
                const listItems = shoppingItems.filter(i => i.listId === list.id);
                const totalCount = listItems.length;
                const purchasedCount = listItems.filter(i => i.purchased).length;
                const pct = totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0;
                return (
                  <div key={list.id} className="relative overflow-hidden rounded-[8px]">
                    {/* Swipe-to-delete background */}
                    <div className="absolute inset-0 flex items-center justify-end bg-red-500 px-4 rounded-[8px]">
                      <Trash2 className="h-5 w-5 text-white" />
                    </div>
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: -120, right: 0 }}
                      dragElastic={0.1}
                      onDragEnd={(_: unknown, info: { offset: { x: number } }) => {
                        if (info.offset.x < -100) {
                          deleteShoppingList(list.id).catch(() => {});
                          toast.success(`"${list.name}" slettet`);
                        }
                      }}
                    >
                      <button
                        onClick={() => setActiveShoppingListId(list.id)}
                        className="relative w-full rounded-[8px] border border-[#e5e3dc] bg-white px-4 py-4 text-left transition-all active:scale-[0.99]"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[15px] font-bold text-[#2f2f2d]">{list.name}</p>
                            <p className="text-[12px] text-[#9a978f] mt-0.5">{purchasedCount}/{totalCount} varer afkrydset</p>
                          </div>
                          <span className="text-[14px] font-semibold text-[#9a978f]">{pct}%</span>
                        </div>
                        <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#f0efe8] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#f58a2d] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* ── Back to list overview ── */}
              <button
                onClick={() => { setShowAllLists(true); setActiveShoppingListId(null); }}
                className="flex items-center gap-1.5 text-[13px] font-medium text-[#78766d] transition-colors active:text-[#2f2f2d]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Alle lister
              </button>

          {/* ── Scan stregkode button ── */}
          <button
            onClick={handleScanShopping}
            disabled={shopScanLoading}
            className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#2f2f2d] py-3.5 text-[14px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {shopScanLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScanLine className="h-4 w-4" />
            )}
            Scan stregkode
          </button>

          {/* ── Product search ── */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a978f]" />
            <input
              value={productQuery}
              onChange={e => setProductQuery(e.target.value)}
              placeholder="Søg produkter..."
              className="w-full rounded-[8px] border border-[#e5e3dc] bg-white py-3 pl-9 pr-3 text-[14px] text-[#2f2f2d] placeholder:text-[#9a978f] outline-none focus:border-[#c5c3bb]"
            />
            {productQuery && (
              <button
                onClick={() => { setProductQuery(''); setProductResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-[#9a978f]" />
              </button>
            )}
          </div>

          {/* Product search results */}
          {isProductSearching && (
            <p className="text-[12px] text-[#9a978f] py-2">Søger produkter...</p>
          )}
          {!isProductSearching && productResults.length > 0 && (
            <div className="rounded-[8px] border border-[#e5e3dc] bg-white divide-y divide-[#f2f1ed]">
              {productResults.map(product => (
                <button
                  key={product.id}
                  onClick={() => {
                    createShoppingItem({
                      name: product.brand ? `${product.brand} ${product.name}` : product.name,
                      quantity: product.quantity || undefined,
                      purchased: false,
                      addedBy: currentUser?.id || users[0]?.id || 'p1',
                      category: product.category || 'Dagligvarer',
                      priority: 'normal',
                      listId: activeShoppingListId || undefined,
                    }).catch(() => {});
                    toast.success(`${product.name} tilføjet`);
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-[#faf9f6] transition-colors active:bg-[#f2f1ed]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-[#2f2f2d] truncate">{product.name}</p>
                      {product.brand && <span className="shrink-0 text-[10px] text-[#9a978f]">{product.brand}</span>}
                    </div>
                    {product.nutritionPer100g && (
                      <p className="text-[10px] text-[#9a978f] mt-0.5">
                        {product.category ?? ''}{product.category ? ' · ' : ''}P {product.nutritionPer100g.protein?.toFixed(0) ?? '?'}g · K {product.nutritionPer100g.carbs?.toFixed(0) ?? '?'}g · F {product.nutritionPer100g.fat?.toFixed(0) ?? '?'}g per 100g
                      </p>
                    )}
                  </div>
                  {product.nutritionPer100g?.energyKcal != null && (
                    <div className="text-right ml-2 shrink-0">
                      <p className="text-[14px] font-black text-[#f58a2d]">{Math.round(product.nutritionPer100g.energyKcal)}</p>
                      <p className="text-[9px] text-[#b0ada4]">kcal/100g</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Count + bulk actions ── */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#2f2f2d]">
              {visiblePendingShopping.length} vare{visiblePendingShopping.length !== 1 ? 'r' : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {visiblePendingShopping.length > 1 && (
                <button onClick={markAllVisibleShoppingPurchased} className="rounded-full bg-[#2f2f2f] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#1a1a1a]">
                  Afkryds alle
                </button>
              )}
              {purchasedShopping.length > 0 && (
                <button onClick={resetPurchasedShoppingItems} className="rounded-full border border-[#e5e3dc] px-3 py-1.5 text-xs font-medium text-[#75736b] transition-all hover:border-[#cccbc3]">
                  Nulstil købte
                </button>
              )}
            </div>
          </div>

          {visiblePendingShopping.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-[#f2f1ed]">
                <ShoppingCart className="h-8 w-8 text-[#b0ada4]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#2f2f2d]">Ingen varer på listen</p>
                <p className="text-[13px] text-[#9a978f] mt-1">Scan en stregkode eller tilføj varer manuelt</p>
              </div>
            </div>
          ) : (
            <div className="rounded border border-[#e5e3dc] bg-white overflow-hidden">
              {visiblePendingShopping.map((item) => {
                const meal = item.neededForMealId ? mealPlans.find((m) => m.id === item.neededForMealId) : null;
                const nutriGrade = matchNutriScore(item.name, nutriScoreMap);
                const itemAllergens = item.allergens ?? matchAllergens(item.name, allergenMap);
                const allergenMatches = matchFamilyAllergens(itemAllergens, familyAllergenProfiles);
                return (
                  <div key={item.id} className="relative overflow-hidden">
                    {/* Swipe-to-delete background */}
                    <div className="absolute inset-0 flex items-center justify-end bg-red-500 px-4">
                      <Trash2 className="h-4 w-4 text-white" />
                    </div>
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: -100, right: 0 }}
                      dragElastic={0.1}
                      onDragEnd={(_: unknown, info: { offset: { x: number } }) => {
                        if (info.offset.x < -80) apiDeleteShoppingItem(item.id).catch(() => {});
                      }}
                      className="relative bg-white"
                    >
                      <div className="p-3 flex items-start gap-2">
                        <Checkbox
                          checked={item.purchased}
                          onCheckedChange={(checked) => toggleShoppingItem(item.id, checked as boolean)}
                          className="size-4 shrink-0 rounded-[8px] mt-0.5"
                        />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetailItem(item)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setDetailItem(item); }}>
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "text-[14px] font-semibold text-[#2f2f2d]",
                              item.purchased && "line-through text-[#9b9a93]"
                            )}>
                              {item.name}
                            </span>
                            {item.quantity && (
                              <span className="text-[11px] text-[#78766d]">{item.quantity}</span>
                            )}
                            {nutriGrade && <NutriScoreBadge grade={nutriGrade} size="sm" />}
                            {item.priority === 'high' && (
                              <span className="text-[10px] font-semibold text-[#f58a2d]">!</span>
                            )}
                          </div>
                          {allergenMatches.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                              <span className="text-[10px] font-semibold text-amber-600 truncate">
                                {allergenMatches.map(m => `${m.allergenLabel} (${m.affectedMembers.join(', ')})`).join(' · ')}
                              </span>
                            </div>
                          )}
                          {(item.category || meal) && (
                            <p className="text-[11px] text-[#9a978f] mt-0.5">
                              {item.category}{item.category && meal ? ' · ' : ''}{meal ? `Til: ${meal.title}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}

          {purchasedShopping.length > 0 ? (
            <Card className="bg-slate-50/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Købt ({purchasedShopping.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {purchasedShopping.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-[8px] border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div>
                        <span className="text-sm text-slate-600 line-through">{item.name}</span>
                        {(item.purchasedBy || item.purchasedAt) && (
                          <p className="text-[11px] text-slate-500">
                            {item.purchasedBy ? `Markeret af ${users.find((user) => user.id === item.purchasedBy)?.name || 'ukendt'}` : 'Markeret'}
                            {item.purchasedAt ? ` · ${format(parseISO(item.purchasedAt), 'HH:mm')}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => apiUpdateShoppingItem(item.id, { purchased: false, purchasedAt: undefined, purchasedBy: undefined }).catch(() => {})}
                    >
                      Gendan
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
            </>
          )}
        </div>
      )}

      {/* Dagbog — vis KaloriedagbogView direkte */}
      {activeTab === 'dagbog' && (
        <KaloriedagbogView onBack={() => setActiveTab('meal-plan')} />
      )}

      {/* Dagbog intermediary (kept for variable references) */}
      {activeTab === '__disabled_dagbog__' && (() => {
        const meals = [
          { key: 'morgenmad', label: 'Morgenmad', emoji: '☀️' },
          { key: 'mellemmåltid', label: 'Mellemmåltid', emoji: '🍎' },
          { key: 'frokost', label: 'Frokost', emoji: '🥗' },
          { key: 'mellemmåltid2', label: 'Eftermiddagssnack', emoji: '🍌' },
          { key: 'aftensmad', label: 'Aftensmad', emoji: '🍽️' },
          { key: 'snack', label: 'Aftensnack', emoji: '🌙' },
        ];
        const todayEntries = foodLog.filter(e => e.meal !== undefined);
        const totalKcal = todayEntries.reduce((sum, e) => sum + e.kcal, 0);
        const remainingKcal = dailyCalorieGoal - totalKcal;
        const progressPct = Math.min(100, Math.round((totalKcal / dailyCalorieGoal) * 100));
        const progressColor = progressPct >= 100 ? '#ef4444' : progressPct >= 80 ? '#f59e0b' : '#34C759';

        // For family view — show all children + self
        const familyMembers = [
          { id: currentUser?.id || 'self', name: currentUser?.name || 'Mig', type: 'user' as const },
          ...children.map(c => ({ id: c.id, name: c.name, type: 'child' as const })),
        ];

        return (
          <div className="space-y-2">
            {/* Family member chips */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {familyMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => setDagbogSelectedChild(member.id === currentUser?.id ? null : member.id)}
                  className={cn(
                    "shrink-0 rounded-[8px] border-2 px-4 py-2 text-[13px] font-semibold transition-all",
                    (member.id === currentUser?.id ? dagbogSelectedChild === null : dagbogSelectedChild === member.id)
                      ? "border-[#f58a2d] bg-[#fff2e6] text-[#b96424]"
                      : "border-[#e5e3dc] bg-white text-[#78766d]"
                  )}
                >
                  {member.name}
                </button>
              ))}
            </div>

            {/* Dato-vælger */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDagbogDate(format(addDays(new Date(dagbogDate), -1), 'yyyy-MM-dd'))}
                className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#e5e3dc] bg-white text-[#78766d] transition-all active:scale-95"
              >
                ‹
              </button>
              <div className="flex-1 rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-2 text-center text-[14px] font-semibold text-[#2f2f2d]">
                {dagbogDate === format(new Date(), 'yyyy-MM-dd') ? 'I dag' :
                  dagbogDate === format(addDays(new Date(), -1), 'yyyy-MM-dd') ? 'I går' :
                  format(new Date(dagbogDate), 'd. MMMM', { locale: da })}
              </div>
              <button
                onClick={() => setDagbogDate(format(addDays(new Date(dagbogDate), 1), 'yyyy-MM-dd'))}
                disabled={dagbogDate >= format(new Date(), 'yyyy-MM-dd')}
                className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#e5e3dc] bg-white text-[#78766d] transition-all active:scale-95 disabled:opacity-30"
              >
                ›
              </button>
            </div>

            {/* Kalorieoverigt — tryk for fuld kaloriedagbog */}
            <button onClick={() => setKaloriedagbogOpen(true)} className="w-full text-left rounded-[8px] border border-[#e5e3dc] bg-white p-4 active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[13px] text-[#78766d]">Kalorier i dag</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[28px] font-bold text-[#2f2f2d]">{totalKcal}</span>
                    <span className="text-[14px] text-[#78766d]">/ {dailyCalorieGoal} kcal</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-[#78766d]">Tilbage</p>
                  <p className={cn("text-[22px] font-bold mt-0.5", remainingKcal < 0 ? "text-red-500" : "text-[#34C759]")}>
                    {remainingKcal < 0 ? `+${Math.abs(remainingKcal)}` : remainingKcal}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2.5 w-full rounded-full bg-[#f2f1ed] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, backgroundColor: progressColor }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <p className="text-[11px] text-[#9a978f]">{progressPct}% af dagsmål</p>
                {progressPct >= 100 && (
                  <p className="text-[11px] font-semibold text-red-500">Dagsmål overskredet</p>
                )}
              </div>

              {/* Makronæringsstoffer */}
              {todayEntries.some(e => e.protein || e.carbs || e.fat) && (
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#f2f1ed]">
                  {[
                    { label: 'Protein', value: todayEntries.reduce((s, e) => s + (e.protein || 0), 0), unit: 'g', color: '#3b82f6' },
                    { label: 'Kulhydrat', value: todayEntries.reduce((s, e) => s + (e.carbs || 0), 0), unit: 'g', color: '#f59e0b' },
                    { label: 'Fedt', value: todayEntries.reduce((s, e) => s + (e.fat || 0), 0), unit: 'g', color: '#ef4444' },
                  ].map(macro => (
                    <div key={macro.label} className="text-center">
                      <p className="text-[11px] text-[#78766d]">{macro.label}</p>
                      <p className="text-[16px] font-bold mt-0.5" style={{ color: macro.color }}>{macro.value}<span className="text-[11px] font-normal text-[#9a978f]"> {macro.unit}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </button>

            {/* Måltider */}
            <div className="space-y-2">
              {meals.map(meal => {
                const mealEntries = todayEntries.filter(e => e.meal === meal.key);
                const mealKcal = mealEntries.reduce((s, e) => s + e.kcal, 0);
                return (
                  <div key={meal.key} className="rounded-[8px] border border-[#e5e3dc] bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{meal.emoji}</span>
                        <div>
                          <p className="text-[14px] font-semibold text-[#2f2f2d]">{meal.label}</p>
                          {mealKcal > 0 && (
                            <p className="text-[12px] text-[#78766d]">{mealKcal} kcal</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => { setAddFoodMeal(meal.key); setIsAddFoodOpen(true); }}
                        className="flex h-8 w-8 items-center justify-center text-[#78766d] transition-all active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {mealEntries.length > 0 && (
                      <div className="border-t border-[#f2f1ed] divide-y divide-[#f2f1ed]">
                        {mealEntries.map(entry => (
                          <div key={entry.id} className="flex items-center justify-between px-4 py-2.5">
                            <div>
                              <p className="text-[13px] font-medium text-[#2f2f2d]">{entry.food}</p>
                              {entry.time && <p className="text-[11px] text-[#9a978f]">{entry.time}</p>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[13px] font-semibold text-[#2f2f2d]">{entry.kcal} kcal</span>
                              <button
                                onClick={() => setFoodLog(prev => prev.filter(e => e.id !== entry.id))}
                                className="text-[#c0bdb4] hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {mealEntries.length === 0 && (
                      <p className="px-4 pb-3 text-[12px] text-[#b0ada4]">Ingen mad logget endnu</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tilføj mad dialog */}
            <Dialog open={isAddFoodOpen} onOpenChange={setIsAddFoodOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log mad</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 pt-2">
                  <div className="space-y-1.5">
                    <Label>Måltid</Label>
                    <SelectSheet
                      value={addFoodMeal}
                      onValueChange={setAddFoodMeal}
                      title="Måltid"
                      options={meals.map(m => ({ value: m.key, label: `${m.emoji} ${m.label}` }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mad / Drik</Label>
                    <Input
                      placeholder="fx Rugbrød med ost, Havregrød..."
                      value={newFoodEntry.food}
                      onChange={e => setNewFoodEntry(prev => ({ ...prev, food: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Kalorier (kcal) *</Label>
                      <Input
                        type="number"
                        placeholder="350"
                        value={newFoodEntry.kcal}
                        onChange={e => setNewFoodEntry(prev => ({ ...prev, kcal: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Protein (g)</Label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={newFoodEntry.protein}
                        onChange={e => setNewFoodEntry(prev => ({ ...prev, protein: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Kulhydrat (g)</Label>
                      <Input
                        type="number"
                        placeholder="45"
                        value={newFoodEntry.carbs}
                        onChange={e => setNewFoodEntry(prev => ({ ...prev, carbs: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fedt (g)</Label>
                      <Input
                        type="number"
                        placeholder="12"
                        value={newFoodEntry.fat}
                        onChange={e => setNewFoodEntry(prev => ({ ...prev, fat: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <button
                    disabled={!newFoodEntry.food || !newFoodEntry.kcal}
                    onClick={() => {
                      if (!newFoodEntry.food || !newFoodEntry.kcal) return;
                      const entry: FoodLogEntry = {
                        id: `food-${Date.now()}`,
                        meal: addFoodMeal,
                        food: newFoodEntry.food,
                        kcal: parseInt(newFoodEntry.kcal),
                        protein: newFoodEntry.protein ? parseFloat(newFoodEntry.protein) : undefined,
                        carbs: newFoodEntry.carbs ? parseFloat(newFoodEntry.carbs) : undefined,
                        fat: newFoodEntry.fat ? parseFloat(newFoodEntry.fat) : undefined,
                        time: format(new Date(), 'HH:mm'),
                      };
                      setFoodLog(prev => [...prev, entry]);
                      setNewFoodEntry({ food: '', kcal: '', protein: '', carbs: '', fat: '' });
                      setIsAddFoodOpen(false);
                      toast.success('Mad logget!');
                    }}
                    className="w-full rounded-[8px] bg-[#f58a2d] py-3 text-[14px] font-bold text-white disabled:opacity-40 transition-all active:scale-[0.98]"
                  >
                    Log mad
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      })()}

      {activeTab === 'templates' && (
        <div className="space-y-3">
          {weekTemplates.map((template) => (
            <div key={template.id} className="flex items-center gap-3.5 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#f2f1ed]">
                <CalendarDays className="h-5 w-5 text-[#7a786f]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#2f2f2d]">{template.name}</p>
                <p className="text-[11px] text-[#9a978f] mt-0.5 line-clamp-1">{template.description}</p>
              </div>
              <button
                onClick={() => applyWeekTemplate(template.id)}
                className="shrink-0 rounded-[8px] bg-[#2f2f2d] px-4 py-2 text-[12px] font-semibold text-white transition-all active:scale-[0.96]"
              >
                Brug
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'auto-plan' && (
        <div className="space-y-4">
          <p className="text-[11px] text-[#9a978f]">Regelbaseret madplan-generator</p>

          <div className="space-y-1.5">
            <p className="text-[12px] font-semibold text-[#5f5d56]">Favoritter (kommasepareret)</p>
            <Input
              value={autoPlannerSettings.favoriteKeywords}
              onChange={(e) => setAutoPlannerSettings((prev) => ({ ...prev, favoriteKeywords: e.target.value }))}
              placeholder="fx pasta, frikadeller, kylling"
              className="rounded-[8px] border-[#e5e3dc] bg-white text-[13px] placeholder:text-[#c5c4be]"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[12px] font-semibold text-[#5f5d56]">Undgå ingredienser (kommasepareret)</p>
            <Input
              value={autoPlannerSettings.avoidIngredients}
              onChange={(e) => setAutoPlannerSettings((prev) => ({ ...prev, avoidIngredients: e.target.value }))}
              placeholder="fx nødder, svampe"
              className="rounded-[8px] border-[#e5e3dc] bg-white text-[13px] placeholder:text-[#c5c4be]"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 rounded-[8px] bg-[#f2f1ed] px-3 py-2.5 text-[13px] text-[#2f2f2d]">
              <Checkbox
                checked={autoPlannerSettings.childFriendly}
                onCheckedChange={(checked) => setAutoPlannerSettings((prev) => ({ ...prev, childFriendly: checked as boolean }))}
                className="size-4 rounded-[8px] border-[#d8d7cf] data-[state=checked]:bg-[#2f2f2d] data-[state=checked]:border-[#2f2f2d]"
              />
              Prioritér børnevenlige retter
            </label>
            <label className="flex items-center gap-3 rounded-[8px] bg-[#f2f1ed] px-3 py-2.5 text-[13px] text-[#2f2f2d]">
              <Checkbox
                checked={autoPlannerSettings.replaceExisting}
                onCheckedChange={(checked) => setAutoPlannerSettings((prev) => ({ ...prev, replaceExisting: checked as boolean }))}
                className="size-4 rounded-[8px] border-[#d8d7cf] data-[state=checked]:bg-[#2f2f2d] data-[state=checked]:border-[#2f2f2d]"
              />
              Erstat eksisterende middage i denne uge
            </label>
            <label className="flex items-center gap-3 rounded-[8px] bg-[#f2f1ed] px-3 py-2.5 text-[13px] text-[#2f2f2d]">
              <Checkbox
                checked={autoPlannerSettings.useChildAllergies}
                onCheckedChange={(checked) => setAutoPlannerSettings((prev) => ({ ...prev, useChildAllergies: checked as boolean }))}
                className="size-4 rounded-[8px] border-[#d8d7cf] data-[state=checked]:bg-[#2f2f2d] data-[state=checked]:border-[#2f2f2d]"
              />
              Tag hensyn til barnets allergier
            </label>
            {autoPlannerSettings.useChildAllergies && (
              <p className="text-[11px] text-[#b98b5a] pl-8">
                Aktive allergier: {currentChild?.allergies?.length ? currentChild.allergies.join(', ') : 'Ingen registreret'}
              </p>
            )}
          </div>

          <button
            onClick={generateAutoWeekPlan}
            className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#f58a2d] px-4 py-3.5 text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(245,138,45,0.25)] transition-all active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            Generer ugeplan automatisk
          </button>
          <p className="text-[11px] text-[#9a978f] text-center">
            Planneren vælger 7 middage ud fra dine regler og opretter dem i madplanen.
          </p>
        </div>
      )}

      {activeTab === 'quick-setup' && (
        <div className="space-y-3">
          {[
            { id: 'weekly-check-in', title: 'Ugentlig familie check-in', desc: 'Automatisk møde i kalenderen hver søndag aften.', icon: CalendarDays },
            { id: 'meal-routine', title: 'Fast madplan-rutine', desc: 'Gentagende opgave, så I husker næste uges måltider.', icon: Repeat2 },
            { id: 'starter-shopping', title: 'Basis-indkøbsliste', desc: 'Fyld listen med faste basisvarer med ét klik.', icon: ShoppingCart },
            { id: 'monthly-deep-clean', title: 'Månedlig dybderengøring', desc: 'Fast plan for de tungere huslige opgaver.', icon: Home },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center gap-3.5 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#fff2e6]">
                  <Icon className="h-5 w-5 text-[#f58a2d]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#2f2f2d]">{item.title}</p>
                  <p className="text-[11px] text-[#9a978f] leading-snug mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => applyIdea(item.id)}
                  className="shrink-0 rounded-[8px] bg-[#f58a2d] px-4 py-2 text-[12px] font-bold text-white transition-all active:scale-[0.96]"
                >
                  Tilføj
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-screen "Ny uge-skabelon" page */}
      <AnimatePresence>
        {isAddTemplateOpen && (
          <motion.div
            key="new-template"
            className="fixed inset-0 z-[55] bg-[#faf9f6] flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: { offset: { x: number } }) => {
              if (info.offset.x > 100) setIsAddTemplateOpen(false);
            }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6]">
              <button
                onClick={() => setIsAddTemplateOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] active:scale-[0.92] transition-transform"
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </button>
              <h1 className="text-[17px] font-bold text-[#2f2f2d]">Ny uge-skabelon</h1>
              <button
                onClick={() => {
                  if (!newTemplateName.trim()) { toast.error('Angiv et navn til skabelonen'); return; }
                  const meals = Object.entries(newTemplateMeals)
                    .filter(([, v]) => v.trim())
                    .map(([dayStr, title]) => ({
                      dayOffset: parseInt(dayStr),
                      mealType: 'dinner' as const,
                      title: title.trim(),
                      ingredients: [] as string[],
                      instructions: '',
                    }));
                  const newT: WeekTemplate = {
                    id: `custom-${Date.now()}`,
                    name: newTemplateName.trim(),
                    description: `${meals.length} retter planlagt`,
                    meals,
                    cleaning: [],
                  };
                  weekTemplates.push(newT);
                  toast.success('Uge-skabelon oprettet!');
                  setIsAddTemplateOpen(false);
                  setNewTemplateName('');
                  setNewTemplateMeals({});
                }}
                className="text-[15px] font-bold text-[#f58a2d] active:opacity-60 transition-opacity"
              >
                Gem
              </button>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pt-4 pb-8 max-w-[430px] mx-auto space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Navn *</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Fx Hurtig familieuge"
                    autoFocus
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                  />
                </div>

                <p className="text-[12px] font-semibold text-[#78766d]">Aftensmad for hver dag</p>

                {['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'].map((day, i) => (
                  <div key={day} className="space-y-1">
                    <label className="text-[11px] font-medium text-[#9a978f]">{day}</label>
                    <input
                      type="text"
                      value={newTemplateMeals[i] || ''}
                      onChange={(e) => setNewTemplateMeals((prev) => ({ ...prev, [i]: e.target.value }))}
                      placeholder="Fx pasta med kødsovs"
                      className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-2.5 text-[13px] text-[#2f2f2d] placeholder:text-[#c5c4be] outline-none focus:border-[#f58a2d]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen "Nyt hurtig valg" page */}
      <AnimatePresence>
        {isAddQuickSetupOpen && (
          <motion.div
            key="new-quick-setup"
            className="fixed inset-0 z-[55] bg-[#faf9f6] flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: { offset: { x: number } }) => {
              if (info.offset.x > 100) setIsAddQuickSetupOpen(false);
            }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6]">
              <button
                onClick={() => setIsAddQuickSetupOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] active:scale-[0.92] transition-transform"
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </button>
              <h1 className="text-[17px] font-bold text-[#2f2f2d]">Nyt hurtig valg</h1>
              <button
                onClick={() => {
                  if (!newQuickSetup.title.trim()) { toast.error('Angiv en titel'); return; }
                  toast.success(`Hurtig valg "${newQuickSetup.title}" oprettet!`);
                  setIsAddQuickSetupOpen(false);
                  setNewQuickSetup({ title: '', description: '' });
                }}
                className="text-[15px] font-bold text-[#f58a2d] active:opacity-60 transition-opacity"
              >
                Gem
              </button>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pt-4 pb-8 max-w-[430px] mx-auto space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Titel *</label>
                  <input
                    type="text"
                    value={newQuickSetup.title}
                    onChange={(e) => setNewQuickSetup((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Fx Ugentlig check-in"
                    autoFocus
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Beskrivelse</label>
                  <textarea
                    value={newQuickSetup.description}
                    onChange={(e) => setNewQuickSetup((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Beskriv hvad dette hurtige valg gør..."
                    rows={4}
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d] resize-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Browser — Full-screen page (z-[60] to cover BottomNav) */}
      <AnimatePresence>
        {recipeBrowserOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: { offset: { x: number } }) => { if (info.offset.x > 100) setRecipeBrowserOpen(false); }}
            className="fixed inset-0 z-[60] bg-[#faf9f6] overflow-hidden flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="shrink-0 px-4 pt-3 pb-2">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setRecipeBrowserOpen(false)}
                  className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] transition-all active:scale-[0.92]"
                >
                  <ArrowLeft className="h-[18px] w-[18px] text-[#2f2f2d]" />
                </button>
                <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#2f2f2d]">Opskrifter</h1>
              </div>

              <motion.div
                animate={{ height: recipeHeaderVisible ? 'auto' : 0, opacity: recipeHeaderVisible ? 1 : 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b0ada4]" />
                  <Input
                    value={recipeSearch}
                    onChange={e => setRecipeSearch(e.target.value)}
                    placeholder="Søg opskrift..."
                    className="pl-9 rounded-[8px] border-[#e5e3dc] bg-white text-[14px]"
                  />
                </div>

                {/* Category filter pills with icons */}
                <div className="flex gap-1.5 sm:gap-3 overflow-x-auto pb-1 -mx-4 px-4">
                  {['Alle', ...recipeCategories].map((cat: string) => {
                    const CatIcon = recipeCategoryIcons[cat] || UtensilsCrossed;
                    const isActive = recipeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setRecipeCategory(cat)}
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                          isActive ? "bg-[#2f2f2f] text-white" : "bg-[#f2f1ed] text-[#5f5d56]"
                        )}
                      >
                        <CatIcon className="h-3.5 w-3.5" />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Recipe list */}
            <div
              className="flex-1 overflow-y-auto px-4 pb-8"
              onScroll={(e) => {
                const y = e.currentTarget.scrollTop;
                if (y > recipeLastScrollY.current + 10) setRecipeHeaderVisible(false);
                else if (y < recipeLastScrollY.current - 10) setRecipeHeaderVisible(true);
                recipeLastScrollY.current = y;
              }}
            >
              <div className="space-y-2 pt-2">
                {filteredRecipes.map((recipe: Recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => { setSelectedRecipe(recipe); setRecipeServings(recipe.servings); setNutritionUnit('portion'); setSelectedMembers(eligibleMembers.map(m => m.id)); setMealPlanDate(todayString); setActiveStepIndex(0); setVideoPlaying(false); const catMap: Record<string, MealType> = { 'Morgenmad': 'breakfast', 'Frokost': 'lunch', 'Aftensmad': 'dinner', 'Snacks': 'snack' }; setSelectedMealType(catMap[recipe.category] || 'dinner'); }}
                    className="flex w-full items-center gap-3 rounded-[8px] border-2 border-[#e5e3dc] bg-white px-4 py-3.5 text-left transition-all active:scale-[0.98] hover:border-[#d8d7cf]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-[#2f2f2d]">{recipe.name}</p>
                        {recipe.childFriendly && (
                          <span className="inline-flex items-center gap-0.5 rounded-[8px] bg-[#fff2e6] border border-[#f3c59d] px-1.5 py-0.5 text-[10px] font-semibold text-[#cc6f1f]">
                            <Baby className="h-3 w-3" /> Børnevenlig
                          </span>
                        )}
                        {recipe.isUserRecipe && (
                          <span className="rounded-[8px] bg-[#e8f4fd] border border-[#b3d4f0] px-1.5 py-0.5 text-[10px] font-semibold text-[#4a90d9]">Din</span>
                        )}
                      </div>
                      <p className="mt-1 text-[12px] text-[#78766d] line-clamp-1">{recipe.description}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#9a978f]">
                        <span className="flex items-center gap-1">
                          <span className={cn("h-2 w-2 rounded-full", recipe.difficulty === 'easy' ? "bg-[#4caf50]" : recipe.difficulty === 'medium' ? "bg-[#f5a623]" : "bg-[#e53935]")} />
                          {recipe.difficulty === 'easy' ? 'Nem' : recipe.difficulty === 'medium' ? 'Medium' : 'Svær'}
                        </span>
                        <span>·</span>
                        <span>{recipe.prepTime + recipe.cookTime} min</span>
                        <span>·</span>
                        <span>{recipe.servings} pers.</span>
                        <span>·</span>
                        <span>{recipe.nutrition.kcal} kcal</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#c8c6bc] shrink-0" />
                  </button>
                ))}
                {filteredRecipes.length === 0 && (
                  <div className="py-12 text-center">
                    <BookOpen className="mx-auto h-8 w-8 text-[#d8d7cf] mb-2" />
                    <p className="text-[13px] text-[#9a978f]">Ingen opskrifter fundet</p>
                  </div>
                )}
              </div>
            </div>

            {/* FAB — Ny opskrift */}
            <button
              onClick={() => setCreateRecipeOpen(true)}
              className="absolute bottom-4 left-4 z-10 flex items-center justify-center h-12 w-12 rounded-full bg-[#f58a2d] text-white shadow-lg transition-all active:scale-[0.95]"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 16px) + 12px)' }}
            >
              <Plus className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Recipe — Full-screen page */}
      <AnimatePresence>
        {createRecipeOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: { offset: { x: number } }) => { if (info.offset.x > 100) setCreateRecipeOpen(false); }}
            className="fixed inset-0 z-[60] bg-[#faf9f6] overflow-hidden flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="shrink-0 px-4 pt-3 pb-3 flex items-center gap-3">
              <button
                onClick={() => setCreateRecipeOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] transition-all active:scale-[0.92]"
              >
                <ArrowLeft className="h-[18px] w-[18px] text-[#2f2f2d]" />
              </button>
              <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#2f2f2d]">Opret ny opskrift</h1>
            </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-8">
            {/* URL scrape field */}
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Hent fra hjemmeside</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#b0ada4]" />
                  <Input
                    value={scrapeUrl}
                    onChange={e => setScrapeUrl(e.target.value)}
                    placeholder="Indsæt link til opskrift..."
                    className="pl-8 rounded-[8px] border-[#d8d7cf] text-[13px]"
                  />
                </div>
                <Button
                  disabled={!scrapeUrl.trim() || scrapeLoading}
                  className="rounded-[8px] bg-[#f58a2d] text-white hover:bg-[#e47921] px-4 shrink-0"
                  onClick={async () => {
                    setScrapeLoading(true);
                    try {
                      const result = await scrapeRecipe(scrapeUrl.trim());
                      if (result && result.name) {
                        setNewRecipe(prev => ({
                          ...prev,
                          name: result.name || prev.name,
                          description: result.description || prev.description,
                          ingredientsText: result.ingredients.length > 0 ? result.ingredients.join('\n') : prev.ingredientsText,
                          stepsText: result.steps.length > 0 ? result.steps.join('\n') : prev.stepsText,
                          servings: result.servings || prev.servings,
                          prepTime: result.prepTime || prev.prepTime,
                          cookTime: result.cookTime || prev.cookTime,
                          tags: result.tags && result.tags.length > 0 ? result.tags : prev.tags,
                        }));
                        toast.success('Opskrift hentet!');
                      } else {
                        toast.error('Kunne ikke finde opskrift på siden');
                      }
                    } catch {
                      toast.error('Fejl ved hentning af opskrift');
                    } finally {
                      setScrapeLoading(false);
                    }
                  }}
                >
                  {scrapeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hent'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Navn</Label>
              <Input
                value={newRecipe.name}
                onChange={e => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Fx. Bedstemors kyllingesuppe"
                className="rounded-[8px] border-[#d8d7cf]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Beskrivelse</Label>
              <Input
                value={newRecipe.description}
                onChange={e => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kort beskrivelse..."
                className="rounded-[8px] border-[#d8d7cf]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#78766d]">Kategori</Label>
                <button
                  type="button"
                  onClick={() => setRecipeCategorySheetOpen(true)}
                  className="flex h-10 w-full items-center justify-between rounded-[8px] border border-[#d8d7cf] bg-white px-3 text-sm text-[#2f2f2d]"
                >
                  {newRecipe.category}
                  <ChevronDown className="h-4 w-4 text-[#78766d]" />
                </button>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#78766d]">Sværhedsgrad</Label>
                <button
                  type="button"
                  onClick={() => setRecipeDifficultySheetOpen(true)}
                  className="flex h-10 w-full items-center justify-between rounded-[8px] border border-[#d8d7cf] bg-white px-3 text-sm text-[#2f2f2d]"
                >
                  {{ easy: 'Nem', medium: 'Medium', hard: 'Svær' }[newRecipe.difficulty]}
                  <ChevronDown className="h-4 w-4 text-[#78766d]" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#78766d]">Portioner</Label>
                <Input type="number" value={newRecipe.servings || ''} onChange={e => setNewRecipe(prev => ({ ...prev, servings: e.target.value === '' ? 0 : +e.target.value }))} className="rounded-[8px] border-[#d8d7cf]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#78766d]">Forberedelse</Label>
                <Input type="number" value={newRecipe.prepTime || ''} onChange={e => setNewRecipe(prev => ({ ...prev, prepTime: e.target.value === '' ? 0 : +e.target.value }))} className="rounded-[8px] border-[#d8d7cf]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#78766d]">Tilberedning</Label>
                <Input type="number" value={newRecipe.cookTime || ''} onChange={e => setNewRecipe(prev => ({ ...prev, cookTime: e.target.value === '' ? 0 : +e.target.value }))} className="rounded-[8px] border-[#d8d7cf]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Ingredienser (én per linje, fx "500 g hakket kød")</Label>
              <Textarea
                value={newRecipe.ingredientsText}
                onChange={e => setNewRecipe(prev => ({ ...prev, ingredientsText: e.target.value }))}
                placeholder={"500 g hakket oksekød\n1 stk løg\n2 dl fløde\n..."}
                rows={5}
                className="rounded-[8px] border-[#d8d7cf]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Tilberedning trin for trin (ét trin per linje)</Label>
              <Textarea
                value={newRecipe.stepsText}
                onChange={e => setNewRecipe(prev => ({ ...prev, stepsText: e.target.value }))}
                placeholder={"Hak løget fint og svits i olie.\nTilsæt hakket kød og brun det.\nTilsæt fløde og lad simre 20 min."}
                rows={5}
                className="rounded-[8px] border-[#d8d7cf]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Tags</Label>
              <div className="flex flex-wrap gap-1.5 rounded-[8px] border border-[#d8d7cf] bg-white p-2 min-h-[42px] items-center">
                {newRecipe.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center justify-center gap-0.5 rounded-full bg-[#fff2e6] border border-[#f3c59d] px-2 py-0.5 text-[11px] font-medium text-[#cc6f1f] leading-none">
                    {tag}
                    <button type="button" onClick={() => setNewRecipe(prev => ({ ...prev, tags: prev.tags.filter((_, idx) => idx !== i) }))}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === ' ' || e.key === 'Enter') && tagInput.trim()) {
                      e.preventDefault();
                      const tag = tagInput.trim();
                      if (!newRecipe.tags.includes(tag)) {
                        setNewRecipe(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                      }
                      setTagInput('');
                    } else if (e.key === 'Backspace' && !tagInput && newRecipe.tags.length > 0) {
                      setNewRecipe(prev => ({ ...prev, tags: prev.tags.slice(0, -1) }));
                    }
                  }}
                  placeholder={newRecipe.tags.length === 0 ? "Skriv et tag..." : ""}
                  className="flex-1 min-w-[60px] text-sm outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-[8px] border border-[#e8e7e0] bg-white px-3 py-2.5">
              <span className="text-[12px] font-semibold text-[#2f2f2d]">Børnevenlig</span>
              <Checkbox checked={newRecipe.childFriendly} onCheckedChange={(v) => setNewRecipe(prev => ({ ...prev, childFriendly: !!v }))} />
            </div>
            <div className="flex items-center justify-between rounded-[8px] border border-[#e8e7e0] bg-white px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[#22c55e]" />
                <div>
                  <p className="text-[12px] font-semibold text-[#2f2f2d]">Del med familien</p>
                  <p className="text-[10px] text-[#78766d]">Opskriften deles automatisk med alle i husstanden</p>
                </div>
              </div>
              <Checkbox checked={newRecipe.shareWithFamily} onCheckedChange={(v) => setNewRecipe(prev => ({ ...prev, shareWithFamily: !!v }))} />
            </div>
            <Button
              className="w-full rounded-[8px] bg-[#f58a2d] text-white hover:bg-[#e47921]"
              disabled={!newRecipe.name.trim() || !newRecipe.stepsText.trim()}
              onClick={() => {
                const parseIngredients = (text: string) => {
                  return text.split('\n').filter(l => l.trim()).map(line => {
                    const match = line.trim().match(/^([\d.,]+)\s*(g|kg|ml|dl|l|stk|spsk|tsk|knivspids)\s+(.+)$/i);
                    if (match) return { amount: parseFloat(match[1].replace(',', '.')), unit: match[2].toLowerCase() as Recipe['ingredients'][0]['unit'], name: match[3] };
                    return { amount: 1, unit: 'stk' as const, name: line.trim() };
                  });
                };
                const parseSteps = (text: string) => {
                  return text.split('\n').filter(l => l.trim()).map((s, i) => ({
                    step: i + 1,
                    description: s.trim().replace(/^\d+[\.\):\-]\s*/, ''),
                  }));
                };
                const recipe: Recipe = {
                  id: `user-recipe-${Date.now()}`,
                  name: newRecipe.name.trim(),
                  description: newRecipe.description.trim() || newRecipe.name.trim(),
                  category: newRecipe.category,
                  servings: newRecipe.servings,
                  prepTime: newRecipe.prepTime,
                  cookTime: newRecipe.cookTime,
                  difficulty: newRecipe.difficulty,
                  ingredients: parseIngredients(newRecipe.ingredientsText),
                  steps: parseSteps(newRecipe.stepsText),
                  nutrition: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
                  tags: newRecipe.tags,
                  childFriendly: newRecipe.childFriendly,
                  isUserRecipe: true,
                  createdBy: currentUser?.id,
                  isShared: newRecipe.shareWithFamily,
                };
                createUserRecipe(recipe).catch(() => {});
                setCreateRecipeOpen(false);
                setNewRecipe({ name: '', description: '', category: 'Aftensmad', servings: 4, prepTime: 15, cookTime: 30, difficulty: 'easy', ingredientsText: '', stepsText: '', tags: [], childFriendly: true, shareWithFamily: true }); setTagInput(''); setScrapeUrl('');
                toast.success(newRecipe.shareWithFamily ? 'Opskrift oprettet og delt med familien' : 'Opskrift gemt');
              }}
            >
              <ChefHat className="mr-2 h-4 w-4" />
              Gem opskrift
            </Button>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kategori bottom sheet */}
      <BottomSheet open={recipeCategorySheetOpen} onOpenChange={setRecipeCategorySheetOpen} title="Kategori">
        <div className="space-y-1 pb-4">
          {recipeCategories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => { setNewRecipe(prev => ({ ...prev, category: cat })); setRecipeCategorySheetOpen(false); }}
              className={cn(
                "w-full rounded-lg px-4 py-3 text-left text-[15px] font-medium transition-colors",
                newRecipe.category === cat ? "bg-[#fff2e6] text-[#2f2f2d]" : "text-[#4a4945]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Sværhedsgrad bottom sheet */}
      <BottomSheet open={recipeDifficultySheetOpen} onOpenChange={setRecipeDifficultySheetOpen} title="Sværhedsgrad">
        <div className="space-y-1 pb-4">
          {([['easy', 'Nem'], ['medium', 'Medium'], ['hard', 'Svær']] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => { setNewRecipe(prev => ({ ...prev, difficulty: value })); setRecipeDifficultySheetOpen(false); }}
              className={cn(
                "w-full rounded-lg px-4 py-3 text-left text-[15px] font-medium transition-colors",
                newRecipe.difficulty === value ? "bg-[#fff2e6] text-[#2f2f2d]" : "text-[#4a4945]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Recipe Detail — Full-screen page (z-[60] to cover BottomNav) */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: { offset: { x: number } }) => { if (info.offset.x > 100) setSelectedRecipe(null); }}
            className="fixed inset-0 z-[60] bg-[#faf9f6] overflow-hidden flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="shrink-0 px-4 pt-3 pb-3 flex items-center gap-3">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] transition-all active:scale-[0.92]"
              >
                <ArrowLeft className="h-[18px] w-[18px] text-[#2f2f2d]" />
              </button>
              <h1 className="flex-1 text-[20px] font-bold tracking-[-0.02em] text-[#2f2f2d] truncate">{selectedRecipe.name}</h1>
              <button
                onClick={() => setDatePickerOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-[#f2f1ed] px-3 py-1.5 text-[12px] font-semibold text-[#2f2f2d] shrink-0"
              >
                <Calendar className="h-3.5 w-3.5 text-[#78766d]" />
                {format(parseISO(mealPlanDate), 'd. MMM', { locale: da })}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              <div className="space-y-2">
                <p className="text-[13px] text-[#4a4945] leading-relaxed">{selectedRecipe.description}</p>

                {/* Nutrition bar */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Kcal', val: getNutritionValue(selectedRecipe.nutrition.kcal), color: 'bg-[#f58a2d]' },
                    { label: 'Protein', val: `${getNutritionValue(selectedRecipe.nutrition.protein)}g`, color: 'bg-[#4a90d9]' },
                    { label: 'Kulhydrat', val: `${getNutritionValue(selectedRecipe.nutrition.carbs)}g`, color: 'bg-[#22c55e]' },
                    { label: 'Fedt', val: `${getNutritionValue(selectedRecipe.nutrition.fat)}g`, color: 'bg-[#ef4444]' },
                  ].map(n => (
                    <div key={n.label} className="rounded-[8px] border-2 border-[#e5e3dc] bg-white p-3 text-center">
                      <div className={cn("mx-auto mb-1.5 h-1.5 w-10 rounded-full", n.color)} />
                      <p className="text-[14px] font-bold text-[#2f2f2d]">{n.val}</p>
                      <p className="text-[10px] text-[#9a978f]">{n.label}</p>
                    </div>
                  ))}
                </div>
                {/* Portionskontrol — to rækker */}
                <div className="rounded-[8px] border-2 border-[#e5e3dc] bg-white">
                  {/* Række 1: Portionsstørrelse */}
                  <button
                    onClick={() => {
                      const units = ['portion', '100g', '1g', 'total'] as const;
                      const idx = units.indexOf(nutritionUnit);
                      const next = units[(idx + 1) % units.length];
                      setNutritionUnit(next);
                      if (next === 'portion') setRecipeServings(selectedRecipe?.servings ?? 4);
                      else if (next === '100g') setRecipeServings(Math.round(basePortionWeight * (selectedRecipe?.servings ?? 4) / 100));
                      else if (next === '1g') setRecipeServings(Math.round(basePortionWeight * (selectedRecipe?.servings ?? 4)));
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 active:bg-[#fafaf8] transition-colors"
                  >
                    <span className="text-[13px] font-medium text-[#2f2f2d]">Portionsstørrelse</span>
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-[#5f5d56]">
                      {nutritionUnit === 'portion' ? 'Per portion' : nutritionUnit === '100g' ? 'Per 100 g' : nutritionUnit === '1g' ? 'Per gram' : 'Hele retten'}
                      <ChevronDown className="h-3.5 w-3.5 text-[#9a978f]" />
                    </span>
                  </button>
                  {/* Række 2: Antal */}
                  {nutritionUnit !== 'total' && (
                    <>
                      <div className="border-t border-[#e5e3dc]" />
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[13px] font-medium text-[#2f2f2d]">
                          {nutritionUnit === 'portion' ? 'Antal portioner' : nutritionUnit === '100g' ? 'Antal (×100g)' : 'Gram'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRecipeServings(Math.max(1, recipeServings - (nutritionUnit === '1g' ? 50 : 1)))}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f2f1ed] text-[#5f5d56] active:scale-[0.92]"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={servingsInput}
                            onChange={e => {
                              setServingsInput(e.target.value);
                              const v = parseInt(e.target.value);
                              if (!isNaN(v) && v >= 1) setRecipeServings(v);
                            }}
                            onBlur={() => {
                              const v = parseInt(servingsInput);
                              if (isNaN(v) || v < 1) setServingsInput(String(recipeServings));
                            }}
                            className="w-10 text-center text-[14px] font-bold text-[#2f2f2d] bg-transparent outline-none border-none"
                          />
                          <button
                            onClick={() => setRecipeServings(recipeServings + (nutritionUnit === '1g' ? 50 : 1))}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f2f1ed] text-[#5f5d56] active:scale-[0.92]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Måltidsvælger */}
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Måltid</p>
                  <div className="flex gap-2">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(mt => (
                      <button
                        key={mt}
                        onClick={() => setSelectedMealType(mt)}
                        className={cn(
                          "flex-1 rounded-[8px] py-2 text-[12px] font-semibold transition-all active:scale-[0.96]",
                          selectedMealType === mt
                            ? "bg-[#2f2f2d] text-white"
                            : "bg-[#f2f1ed] text-[#5f5d56]"
                        )}
                      >
                        {getMealTypeLabel(mt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Household member selection — moved above Ingredienser */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Hvem spiser med?</p>
                    <button
                      type="button"
                      onClick={() => setSelectedMembers(eligibleMembers.map(m => m.id))}
                      className="text-[11px] text-[#f58a2d] font-semibold"
                    >
                      Vælg alle
                    </button>
                  </div>
                  <div className="rounded-[8px] border-2 border-[#e5e3dc] bg-white p-2 space-y-0.5">
                    {eligibleMembers.map(member => (
                      <label key={member.id} className="flex items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-[13px] hover:bg-[#faf9f6] transition-colors cursor-pointer">
                        <Checkbox
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={(checked) => {
                            setSelectedMembers(prev => checked
                              ? [...prev, member.id]
                              : prev.filter(id => id !== member.id));
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-[#2f2f2d]">{member.name}</span>
                        {member.kcalGoal ? (
                          <span className="text-[10px] text-[#9a978f] ml-auto">{member.kcalGoal} kcal/dag</span>
                        ) : member.canConfigure ? (
                          <span className="text-[10px] text-[#f5a623] ml-auto">Ikke konfigureret</span>
                        ) : (
                          <span className="text-[10px] text-[#9a978f] ml-auto">Bed {member.name} konfigurere</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Portionsfordeling — visuelt per person */}
                {portionCalculation.length > 0 && (
                  <div className="rounded-[8px] border-2 border-[#e5e3dc] bg-white p-4">
                    <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Portionsfordeling</p>
                    <div className="space-y-0">
                      {portionCalculation.map((p, i) => (
                        <div key={p.name} className={cn(i > 0 && "border-t border-[#e5e3dc] pt-3", i > 0 ? "mt-3" : "")}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13px] font-semibold text-[#2f2f2d]">{p.name}</span>
                            <span className="text-[18px] font-bold text-[#2f2f2d]">{p.percent}%</span>
                          </div>
                          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[#f2f1ed]">
                            <div
                              className="h-full rounded-full bg-[#f58a2d] transition-all"
                              style={{ width: `${p.percent}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-3 text-[12px] text-[#5f5d56]">
                            <span className="font-semibold">{p.kcal} kcal</span>
                            <span>{p.protein}g protein</span>
                            <span className="text-[#9a978f]">{p.carbs}g kulhydrat · {p.fat}g fedt</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ingredients */}
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Ingredienser</p>
                  <div className="rounded-[8px] border-2 border-[#e5e3dc] bg-white p-4 space-y-2">
                    {selectedRecipe.ingredients.map((ing, i) => {
                      const scale = equivalentServings / selectedRecipe.servings;
                      const amount = Math.round(ing.amount * scale * 10) / 10;
                      return (
                        <div key={i} className="flex justify-between text-[13px]">
                          <span className="text-[#2f2f2d]">{ing.name}</span>
                          <span className="text-[#9a978f] font-medium">{amount} {ing.unit}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Steps + Video */}
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Tilberedning</p>

                  {/* Video card — only shown if recipe has a video */}
                  {(() => {
                    const videoUrl = getRecipeVideoUrl(selectedRecipe.id);
                    if (!videoUrl) return null;
                    return videoPlaying ? (
                      <div className="mb-3 rounded-[8px] overflow-hidden border-2 border-[#e5e3dc] bg-black">
                        <video
                          src={videoUrl}
                          controls
                          autoPlay
                          playsInline
                          className="w-full aspect-video"
                          onEnded={() => setVideoPlaying(false)}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setVideoPlaying(true)}
                        className="mb-3 flex w-full items-center gap-3 rounded-[8px] border-2 border-[#e5e3dc] bg-[#2f2f2d] px-4 py-3.5 text-left transition-all active:scale-[0.98]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f58a2d]">
                          <Play className="h-5 w-5 text-white ml-0.5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-white">Se tilberedningsvideo</p>
                          <p className="text-[11px] text-[#9a978f]">Trin-for-trin video</p>
                        </div>
                      </button>
                    );
                  })()}

                  {/* Swipeable step carousel */}
                  <div className="relative overflow-hidden rounded-[8px] border-2 border-[#e5e3dc] bg-white">
                    <div
                      className="flex transition-transform duration-300 ease-out"
                      style={{ transform: `translateX(-${activeStepIndex * 100}%)` }}
                    >
                      {selectedRecipe.steps.map(step => (
                        <div key={step.step} className="w-full shrink-0 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f58a2d] text-[12px] font-bold text-white">
                              {step.step}
                            </span>
                            <div className="pt-0.5">
                              <p className="text-[13px] text-[#2f2f2d] leading-relaxed">{step.description}</p>
                              {step.duration && (
                                <p className="mt-1 text-[11px] text-[#9a978f] flex items-center gap-1">
                                  <Timer className="h-3 w-3" /> {step.duration} min
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Swipe detection overlay */}
                    <div
                      className="absolute inset-0"
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        (e.currentTarget as HTMLDivElement).dataset.startX = String(touch.clientX);
                      }}
                      onTouchEnd={(e) => {
                        const startX = Number((e.currentTarget as HTMLDivElement).dataset.startX || 0);
                        const endX = e.changedTouches[0].clientX;
                        const diff = startX - endX;
                        if (diff > 50 && activeStepIndex < selectedRecipe.steps.length - 1) {
                          setActiveStepIndex(activeStepIndex + 1);
                        } else if (diff < -50 && activeStepIndex > 0) {
                          setActiveStepIndex(activeStepIndex - 1);
                        }
                      }}
                    />
                    {/* Dots */}
                    {selectedRecipe.steps.length > 1 && (
                      <div className="flex justify-center gap-1.5 pb-3">
                        {selectedRecipe.steps.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveStepIndex(i)}
                            className={cn(
                              "h-2 w-2 rounded-full transition-all",
                              i === activeStepIndex ? "bg-[#f58a2d] w-4" : "bg-[#d8d7cf]"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Add to meal plan button — direct save */}
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#f58a2d] px-4 py-3.5 text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(245,138,45,0.25)] transition-all active:scale-[0.98] disabled:opacity-50"
                  disabled={addingToMealPlan}
                  onClick={async () => {
                    if (!selectedRecipe) return;
                    setAddingToMealPlan(true);
                    try {
                      const scale = recipeServings / selectedRecipe.servings;
                      const ingredients = selectedRecipe.ingredients.map(ing =>
                        `${Math.round(ing.amount * scale * 10) / 10} ${ing.unit} ${ing.name}`
                      );

                      await createMealPlan({
                        date: mealPlanDate,
                        mealType: selectedMealType,
                        title: selectedRecipe.name,
                        notes: selectedMembers.length > 0
                          ? `${Math.round(selectedRecipe.nutrition.kcal * scale)} kcal · ${recipeServings} portioner · ${selectedMembers.length} personer`
                          : `${Math.round(selectedRecipe.nutrition.kcal * scale)} kcal · ${recipeServings} portioner`,
                        recipe: {
                          name: selectedRecipe.name,
                          ingredients,
                          instructions: selectedRecipe.steps.map(s => `${s.step}. ${s.description}`).join('\n'),
                        },
                      });

                      toast.success(`${selectedRecipe.name} tilføjet til ${format(parseISO(mealPlanDate), 'd. MMM', { locale: da })}`);
                      setSelectedRecipe(null);
                    } catch {
                      toast.error('Kunne ikke tilføje til madplan');
                    } finally {
                      setAddingToMealPlan(false);
                    }
                  }}
                >
                  {addingToMealPlan ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChefHat className="h-4 w-4" />
                  )}
                  Tilføj til madplan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date picker BottomSheet for recipe → madplan */}
      <BottomSheet open={datePickerOpen} onOpenChange={setDatePickerOpen} title="Vælg dato">
        <div className="space-y-1 pb-4">
          {Array.from({ length: 8 }, (_, i) => {
            const d = addDays(new Date(), i);
            const dateStr = format(d, 'yyyy-MM-dd');
            const label = isToday(d) ? 'I dag' : isTomorrow(d) ? 'I morgen' : format(d, 'EEEE d. MMM', { locale: da });
            const isSelected = mealPlanDate === dateStr;
            return (
              <button
                key={dateStr}
                onClick={() => { setMealPlanDate(dateStr); setDatePickerOpen(false); }}
                className={cn(
                  "w-full rounded-lg px-4 py-3 text-left text-[15px] font-medium transition-colors capitalize",
                  isSelected ? "bg-[#fff2e6] text-[#2f2f2d]" : "text-[#4a4945]"
                )}
              >
                {label}
              </button>
            );
          })}
          <div className="pt-2">
            <label className="flex items-center gap-2 px-4 py-2 text-[13px] text-[#78766d]">
              Anden dato:
              <input
                type="date"
                value={mealPlanDate}
                onChange={e => { setMealPlanDate(e.target.value); setDatePickerOpen(false); }}
                className="flex-1 rounded-[8px] border border-[#d8d7cf] bg-white px-2 py-1.5 text-[13px] text-[#2f2f2d]"
              />
            </label>
          </div>
        </div>
      </BottomSheet>

      {/* Kaloriedagbog overlay */}
      <AnimatePresence>
        {kaloriedagbogOpen && (
          <KaloriedagbogView onBack={() => setKaloriedagbogOpen(false)} />
        )}
      </AnimatePresence>

      {/* Product detail overlay */}
      <AnimatePresence>
        {detailItem && (
          <motion.div
            className="fixed inset-0 z-[60] bg-[#faf9f6] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            {/* Minimal header: back + title + close */}
            <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-3">
              <button onClick={() => setDetailItem(null)} className="p-1 -ml-1 text-[#2f2f2d] active:scale-95">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <p className="text-[16px] font-bold text-[#2f2f2d] truncate mx-4 text-center flex-1">
                {detailItem.name}
              </p>
              <button onClick={() => setDetailItem(null)} className="p-1 -mr-1 text-[#78766d] active:scale-95">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {/* Product info */}
              <div className="mt-4 text-center">
                <p className="text-[20px] font-black text-[#2f2f2d]">{detailItem.name}</p>
                {detailItem.quantity && (
                  <p className="text-[14px] text-[#78766d] mt-1">{detailItem.quantity}</p>
                )}
                {(() => {
                  const detailNutriGrade = matchNutriScore(detailItem.name, nutriScoreMap);
                  return detailNutriGrade ? (
                    <div className="flex justify-center mt-2">
                      <NutriScoreBadge grade={detailNutriGrade} size="md" />
                    </div>
                  ) : null;
                })()}
                {detailItem.category && (
                  <span className="inline-block mt-2 rounded-full bg-[#f2f1ed] px-3 py-1 text-[12px] font-medium text-[#5f5d56]">
                    {detailItem.category}
                  </span>
                )}
                {(() => {
                  const detailItemAllergens = detailItem.allergens ?? matchAllergens(detailItem.name, allergenMap);
                  const detailAllergenMatches = matchFamilyAllergens(detailItemAllergens, familyAllergenProfiles);
                  return detailAllergenMatches.length > 0 ? (
                    <div className="flex items-center justify-center gap-1.5 mt-3 px-3 py-2 rounded-[8px] bg-amber-50 border border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-[12px] font-semibold text-amber-700">
                        {detailAllergenMatches.map(m => `${m.allergenLabel} (${m.affectedMembers.join(', ')})`).join(' · ')}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Nutrition */}
              {detailLoading ? (
                <div className="mt-8 flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-8 w-8 text-[#f58a2d] animate-spin" />
                  <p className="text-[13px] text-[#9a978f]">Henter næringsdata...</p>
                </div>
              ) : detailNutrition && detailNutrition.energyKcal != null ? (
                <div className="mt-8">
                  <p className="text-[14px] font-bold text-[#2f2f2d] text-center mb-4">Næringsindhold pr. 100g</p>

                  {/* Macro grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Kalorier', value: `${Math.round(detailNutrition.energyKcal ?? 0)}`, unit: 'kcal', color: '#f58a2d' },
                      { label: 'Protein', value: `${(detailNutrition.protein ?? 0).toFixed(1)}`, unit: 'g', color: '#3b82f6' },
                      { label: 'Kulhydrater', value: `${(detailNutrition.carbs ?? 0).toFixed(1)}`, unit: 'g', color: '#f59e0b' },
                      { label: 'Fedt', value: `${(detailNutrition.fat ?? 0).toFixed(1)}`, unit: 'g', color: '#ef4444' },
                    ].map(macro => (
                      <div key={macro.label} className="rounded-[12px] bg-white border border-[#e5e3dc] p-3 text-center">
                        <p className="text-[22px] font-black" style={{ color: macro.color }}>{macro.value}</p>
                        <p className="text-[10px] text-[#9a978f] mt-0.5">{macro.unit}</p>
                        <p className="text-[11px] font-medium text-[#78766d] mt-1">{macro.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-8 text-center py-8">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-[8px] bg-[#f2f1ed]">
                    <UtensilsCrossed className="h-7 w-7 text-[#b0ada4]" />
                  </div>
                  <p className="text-[15px] font-semibold text-[#2f2f2d] mt-3">Ingen næringsdata tilgængelig</p>
                  <p className="text-[13px] text-[#9a978f] mt-1">Scan stregkoden for at hente næringsdata</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Opret indkøbsliste Fullscreen ── */}
      <AnimatePresence>
        {createListOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex flex-col bg-[#faf9f6]"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e3dc] bg-white">
              <button
                onClick={() => { setCreateListOpen(false); setNewListName('Indkøbsliste'); setNewListDate(''); }}
                className="flex items-center text-[#78766d] active:opacity-70"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-[16px] font-bold text-[#2f2f2d]">Opret indkøbsliste</h2>
              <button
                onClick={async () => {
                  if (!newListName.trim()) return;
                  try {
                    const list = await createShoppingList({
                      name: newListName.trim(),
                      scheduledDate: newListDate || undefined,
                    });
                    setActiveShoppingListId(list.id);
                    setCreateListOpen(false);
                    toast.success(`"${newListName.trim()}" oprettet`);
                  } catch { /* handled by useApiActions */ }
                }}
                disabled={!newListName.trim()}
                className="text-[15px] font-bold text-[#f58a2d] disabled:opacity-40 active:opacity-70"
              >
                Gem
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 px-4 pt-6 space-y-4">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-[#5f5d56]">Listenavn</label>
                <input
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="Indkøbsliste"
                  className="w-full rounded-[8px] border border-[#d8d7cf] bg-white px-3 py-2.5 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#c5c3bb]"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-[#5f5d56]">Dato for indkøb (valgfrit)</label>
                <input
                  type="date"
                  value={newListDate}
                  onChange={e => setNewListDate(e.target.value)}
                  className="w-full rounded-[8px] border border-[#d8d7cf] bg-white px-3 py-2.5 text-[14px] text-[#2f2f2d] outline-none focus:border-[#c5c3bb]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Alle lister Fullscreen ── */}
      <AnimatePresence>
        {showAllLists && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex flex-col bg-[#faf9f6]"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e3dc] bg-white">
              <button
                onClick={() => { setShowAllLists(false); if (shoppingLists.length > 0) setActiveShoppingListId(shoppingLists[0].id); }}
                className="flex items-center text-[#78766d] active:opacity-70"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-[16px] font-bold text-[#2f2f2d]">Indkøbslister</h2>
              <button
                onClick={() => { setNewListName('Indkøbsliste'); setNewListDate(''); setCreateListOpen(true); }}
                className="text-[15px] font-bold text-[#f58a2d] active:opacity-70"
              >
                Ny
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-3" style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>
              {shoppingLists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-[#f2f1ed]">
                    <ShoppingCart className="h-8 w-8 text-[#b0ada4]" />
                  </div>
                  <p className="text-[15px] font-semibold text-[#2f2f2d]">Ingen indkøbslister</p>
                  <p className="text-[13px] text-[#9a978f]">Tryk "Ny" for at oprette en liste</p>
                </div>
              ) : (
                shoppingLists.map(list => {
                  const listItems = shoppingItems.filter(i => i.listId === list.id);
                  const totalCount = listItems.length;
                  const purchasedCount = listItems.filter(i => i.purchased).length;
                  const pct = totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0;
                  return (
                    <div key={list.id} className="relative overflow-hidden rounded-[8px]">
                      {/* Swipe-to-delete background */}
                      <div className="absolute inset-0 flex items-center justify-end bg-red-500 px-4 rounded-[8px]">
                        <Trash2 className="h-5 w-5 text-white" />
                      </div>
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: -120, right: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(_: unknown, info: { offset: { x: number } }) => {
                          if (info.offset.x < -100) {
                            deleteShoppingList(list.id).catch(() => {});
                            toast.success(`"${list.name}" slettet`);
                          }
                        }}
                      >
                        <button
                          onClick={() => { setActiveShoppingListId(list.id); setShowAllLists(false); }}
                          className="relative w-full rounded-[8px] border border-[#e5e3dc] bg-white px-4 py-4 text-left transition-all active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[15px] font-bold text-[#2f2f2d]">{list.name}</p>
                              <p className="text-[12px] text-[#9a978f] mt-0.5">{purchasedCount}/{totalCount} varer afkrydset</p>
                            </div>
                            <span className="text-[14px] font-semibold text-[#9a978f]">{pct}%</span>
                          </div>
                          <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#f0efe8] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#f58a2d] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </button>
                      </motion.div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SavingOverlay open={isSaving} />
    </div>
  );
}
