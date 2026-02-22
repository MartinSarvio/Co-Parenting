import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format, isToday, isTomorrow, parseISO, setDay, startOfToday } from 'date-fns';
import { da } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Baby,
  Bell,
  Camera,
  CalendarDays,
  CheckCircle2,
  Home,
  Lightbulb,
  Loader2,
  PackageSearch,
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
  ChevronRight,
  Clock,
  Flame,
  Minus,
  Share2,
  Timer,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { getPlanFeatures } from '@/lib/subscription';
import { cn, getMealTypeLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Tabs replaced by underline-style tabs
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { shoppingItemId, notificationId } from '@/lib/id';
import { recipes, recipeCategories } from '@/data/recipes';
import type { Recipe } from '@/types';

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

const barcodeProductHints: Record<string, string> = {
  '5701090083754': 'Mælk',
  '5701090332746': 'Smør',
  '5701090731013': 'Yoghurt',
  '5701090741043': 'Rugbrød',
  '5701090749001': 'Havregryn'
};

interface BarcodeDetectorResultItem {
  rawValue?: string;
}

interface BarcodeDetectorLike {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResultItem[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

type WindowWithBarcodeDetector = Window & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

type OpenFoodFactsProduct = {
  barcode: string;
  name: string;
  ingredientsText?: string;
  allergens: string[];
  nutritionPer100g?: {
    energyKcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    salt?: number;
  };
};

const cleaningTemplates = [
  { title: 'Støvsug fællesrum', area: 'Stue', weekday: 5, recurringPattern: 'weekly' },
  { title: 'Tør støv af overflader', area: 'Hele hjemmet', weekday: 2, recurringPattern: 'weekly' },
  { title: 'Vask bad og toilet', area: 'Badeværelse', weekday: 6, recurringPattern: 'weekly' }
];

const weekdays = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];

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

function getRecurringLabel(pattern?: string): string {
  const labels: Record<string, string> = {
    weekly: 'Hver uge',
    biweekly: 'Hver 2. uge',
    monthly: 'Månedlig'
  };
  return labels[pattern || ''] || 'Efter behov';
}

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
    tasks,
    events,
    notifications,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    addNotification,
    userRecipes,
    addUserRecipe,
    setActiveTab: setAppTab
  } = useAppStore();
  const {
    createEvent,
    createTask,
    updateTask,
    deleteTask,
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
  } = useApiActions();

  const [activeTab, setActiveTab] = useState('meal-plan');
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isAddShoppingOpen, setIsAddShoppingOpen] = useState(false);
  const [isAddCleaningOpen, setIsAddCleaningOpen] = useState(false);
  const [shoppingFilterDate, setShoppingFilterDate] = useState('all');
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
  const [newCleaning, setNewCleaning] = useState({
    title: '',
    area: '',
    assignedTo: currentUser?.id || users[0]?.id || '',
    weekday: '5',
    recurringPattern: 'weekly'
  });
  const [autoPlannerSettings, setAutoPlannerSettings] = useState({
    childFriendly: true,
    replaceExisting: true,
    favoriteKeywords: '',
    avoidIngredients: '',
    useChildAllergies: true
  });
  const [liveSyncEnabled] = useState(true);
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSupported, setScanSupported] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [scannedName, setScannedName] = useState('');
  const [scannedQuantity, setScannedQuantity] = useState('');
  const [scanError, setScanError] = useState('');
  const [isProductLookupLoading, setIsProductLookupLoading] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [fridgeItems, setFridgeItems] = useState<OpenFoodFactsProduct[]>([]);
  const [fridgeQuickInput, setFridgeQuickInput] = useState('');
  const [selectedMealGuideId, setSelectedMealGuideId] = useState<string | null>(null);
  const [guideCompletedSteps, setGuideCompletedSteps] = useState<Set<number>>(new Set());
  // Recipe browser
  const [recipeBrowserOpen, setRecipeBrowserOpen] = useState(false);
  const [recipeCategory, setRecipeCategory] = useState('Alle');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeServings, setRecipeServings] = useState(4);
  // Recipe creation
  const [createRecipeOpen, setCreateRecipeOpen] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '', description: '', category: 'Aftensmad', servings: 4,
    prepTime: 15, cookTime: 30, difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    ingredientsText: '', stepsText: '', tags: '', childFriendly: true, shareWithFamily: true,
  });
  // Shopping sub-tabs
  const [shoppingSubTab, setShoppingSubTab] = useState<'koleskab' | 'indkobsliste'>('indkobsliste');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);
  const scannerRafRef = useRef<number | null>(null);

  const weekDates = useMemo(() => {
    const start = startOfToday();
    return Array.from({ length: 7 }, (_, index) => format(addDays(start, index), 'yyyy-MM-dd'));
  }, []);
  const currentChild = children[0];
  const features = getPlanFeatures(household);
  const canUseScanner = features.shoppingScanner;

  const parseKeywordList = (input: string): string[] => {
    return input
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  };

  const getBarcodeDetector = () => {
    const detectorCtor = (window as WindowWithBarcodeDetector).BarcodeDetector;
    if (!detectorCtor) return null;
    return new detectorCtor({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
    });
  };

  const fetchProductFromOpenFoodFacts = async (barcode: string): Promise<OpenFoodFactsProduct | null> => {
    const sanitizedBarcode = barcode.trim();
    if (!sanitizedBarcode) return null;

    try {
      setIsProductLookupLoading(true);
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(sanitizedBarcode)}.json`);
      if (!response.ok) return null;
      const data = await response.json();
      const product = data?.product;

      if (!product) return null;

      const extractName = () => {
        const candidates = [
          product.product_name_da,
          product.product_name_nb,
          product.product_name_en,
          product.product_name,
          product.generic_name_da,
          product.generic_name,
        ];
        return candidates.find((value: string | undefined) => value && value.trim().length > 0) || '';
      };

      const name = extractName().trim();
      if (!name) return null;

      const allergens = Array.isArray(product.allergens_tags)
        ? product.allergens_tags.map((entry: string) => entry.replace(/^.+:/, '')).filter(Boolean)
        : [];

      return {
        barcode: sanitizedBarcode,
        name,
        ingredientsText: product.ingredients_text_da || product.ingredients_text || undefined,
        allergens,
        nutritionPer100g: {
          energyKcal: product.nutriments?.['energy-kcal_100g'],
          protein: product.nutriments?.proteins_100g,
          carbs: product.nutriments?.carbohydrates_100g,
          fat: product.nutriments?.fat_100g,
          fiber: product.nutriments?.fiber_100g,
          sugar: product.nutriments?.sugars_100g,
          salt: product.nutriments?.salt_100g,
        }
      };
    } catch {
      return null;
    } finally {
      setIsProductLookupLoading(false);
    }
  };

  const hydrateScannedProduct = async (barcode: string) => {
    const fromDatabase = await fetchProductFromOpenFoodFacts(barcode);
    if (fromDatabase) {
      setScannedProduct(fromDatabase);
      setScannedName(fromDatabase.name);
      return;
    }

    setScannedProduct(null);
    setScannedName(barcodeProductHints[barcode] || `Vare (${barcode})`);
  };

  // Stable callback so cleanup effects always reference the same function instance
  const stopScanner = useCallback(() => {
    if (scannerRafRef.current) {
      window.cancelAnimationFrame(scannerRafRef.current);
      scannerRafRef.current = null;
    }
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []); // Refs are stable - no deps needed

  const handleBarcodeDetected = (rawValue: string) => {
    setScannedCode(rawValue);
    void hydrateScannedProduct(rawValue);
    setScanError('');
    stopScanner();
  };

  const startScanner = async () => {
    setScanError('');
    setScannedCode('');
    setScannedName('');
    setScannedQuantity('');
    setScannedProduct(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('Kamera understøttes ikke på denne enhed/browser');
      return;
    }

    const detector = getBarcodeDetector();
    if (!detector) {
      setScanError('Stregkodescanner understøttes ikke i denne browser. Skriv varen manuelt.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      scannerStreamRef.current = stream;

      if (!videoRef.current) {
        setScanError('Kunne ikke starte kameraet');
        stopScanner();
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsScanning(true);

      const detectLoop = async () => {
        if (!videoRef.current || !scannerStreamRef.current) return;

        try {
          const detections = await detector.detect(videoRef.current);
          const firstCode = detections.find((entry) => Boolean(entry.rawValue))?.rawValue;
          if (firstCode) {
            handleBarcodeDetected(firstCode);
            return;
          }
        } catch {
          setScanError('Kunne ikke læse stregkoden endnu. Prøv at holde varen tættere på kameraet.');
        }

        scannerRafRef.current = window.requestAnimationFrame(detectLoop);
      };

      scannerRafRef.current = window.requestAnimationFrame(detectLoop);
    } catch {
      setScanError('Kameraadgang blev afvist. Tillad kamera for at scanne varer.');
      stopScanner();
    }
  };

  const addScannedShoppingItem = () => {
    const name = scannedName.trim();
    if (!name) {
      toast.error('Skriv et varenavn før du tilføjer');
      return;
    }

    addShoppingItem({
      id: shoppingItemId(),
      name,
      quantity: scannedQuantity.trim() || undefined,
      purchased: false,
      addedBy: currentUser?.id || users[0]?.id || 'p1',
      category: 'Scannet',
      priority: 'normal',
      barcode: scannedCode || undefined,
      source: scannedProduct ? 'open_food_facts' : 'scanner',
      nutritionPer100g: scannedProduct?.nutritionPer100g,
      allergens: scannedProduct?.allergens
    });

    toast.success('Scannet vare tilføjet');
    setIsScanDialogOpen(false);
    stopScanner();
  };

  const addScannedToFridge = () => {
    const normalizedName = scannedName.trim();
    if (!normalizedName) {
      toast.error('Scan en vare først');
      return;
    }

    const product: OpenFoodFactsProduct = scannedProduct || {
      barcode: scannedCode.trim(),
      name: normalizedName,
      allergens: []
    };

    const exists = fridgeItems.some((item) => (
      (product.barcode && item.barcode === product.barcode) ||
      item.name.toLowerCase() === product.name.toLowerCase()
    ));
    if (exists) {
      toast.message('Varen findes allerede i køleskabet');
      return;
    }

    setFridgeItems((prev) => [...prev, product]);
    toast.success('Vare tilføjet til køleskab');
  };

  const addQuickFridgeItem = () => {
    const name = fridgeQuickInput.trim();
    if (!name) return;

    const exists = fridgeItems.some((item) => item.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast.message('Varen findes allerede i køleskabet');
      return;
    }

    setFridgeItems((prev) => [
      ...prev,
      {
        barcode: '',
        name,
        allergens: []
      }
    ]);
    setFridgeQuickInput('');
  };

  const openScanDialog = () => {
    if (!canUseScanner) {
      toast.error('Scanning er en abonnementsfunktion (Family Plus/Enlig Plus)');
      setAppTab('settings');
      return;
    }
    setIsScanDialogOpen(true);
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

  useEffect(() => {
    setScanSupported(Boolean((window as WindowWithBarcodeDetector).BarcodeDetector));
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (!isScanDialogOpen) {
      stopScanner();
      setScanError('');
      return;
    }

    if (!canUseScanner) {
      setIsScanDialogOpen(false);
      stopScanner();
      return;
    }

    void startScanner();
    return () => {
      stopScanner();
    };
  }, [isScanDialogOpen, canUseScanner, stopScanner]);

  const upcomingMealPlans = useMemo(() => {
    return mealPlans
      .filter((meal) => weekDates.includes(meal.date))
      .sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        return sortMealType(a.mealType, b.mealType);
      });
  }, [mealPlans, weekDates]);

  const cleaningTasks = useMemo(() => {
    return tasks.filter((task) => task.category === 'cleaning');
  }, [tasks]);

  const pendingShopping = useMemo(() => {
    return shoppingItems.filter((item) => !item.purchased);
  }, [shoppingItems]);

  const purchasedShopping = useMemo(() => {
    return shoppingItems.filter((item) => item.purchased);
  }, [shoppingItems]);

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

  const handleAddMeal = () => {
    if (!newMeal.title.trim() || !newMeal.date) {
      toast.error('Skriv titel og vælg dag');
      return;
    }

    const ingredients = parseIngredients(newMeal.ingredientsText);
    void createMealPlan({
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

    setIsAddMealOpen(false);
    resetMealForm();
    toast.success('Ret tilføjet til madplanen');
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

      void createMealPlan({
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
      });
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

      addShoppingItem({
        id: shoppingItemId(),
        name: ingredient.trim(),
        purchased: false,
        addedBy: currentUser?.id || users[0]?.id || 'p1',
        category: 'Dagligvarer',
        neededForDate: meal.date,
        neededForMealId: meal.id,
        priority: 'normal'
      });
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

        addShoppingItem({
          id: shoppingItemId(),
          name: ingredient.trim(),
          purchased: false,
          addedBy: currentUser?.id || users[0]?.id || 'p1',
          category: 'Dagligvarer',
          neededForDate: meal.date,
          neededForMealId: meal.id,
          priority: 'normal'
        });
        addedCount += 1;
      });
    });

    if (addedCount === 0) {
      toast.message('Indkøbslisten er allerede opdateret');
      return;
    }

    toast.success(`${addedCount} varer tilføjet fra madplanen`);
  };

  const handleAddShopping = () => {
    if (!newShopping.name.trim()) {
      toast.error('Skriv en vare');
      return;
    }

    addShoppingItem({
      id: shoppingItemId(),
      name: newShopping.name.trim(),
      quantity: newShopping.quantity.trim() || undefined,
      purchased: false,
      addedBy: currentUser?.id || users[0]?.id || 'p1',
      category: newShopping.category,
      neededForDate: newShopping.neededForDate || undefined,
      neededForMealId: newShopping.neededForMealId !== 'none' ? newShopping.neededForMealId : undefined,
      priority: newShopping.priority as 'low' | 'normal' | 'high'
    });

    setIsAddShoppingOpen(false);
    setNewShopping({
      name: '',
      quantity: '',
      category: 'Dagligvarer',
      neededForDate: '',
      priority: 'normal',
      neededForMealId: 'none'
    });
    toast.success('Vare tilføjet');
  };

  const toggleShoppingItem = (itemId: string, purchased: boolean) => {
    updateShoppingItem(itemId, {
      purchased,
      purchasedBy: purchased ? currentUser?.id : undefined,
      purchasedAt: purchased ? new Date().toISOString() : undefined
    });
  };

  const markAllVisibleShoppingPurchased = () => {
    if (visiblePendingShopping.length === 0) return;
    const purchasedAt = new Date().toISOString();
    const purchasedBy = currentUser?.id || users[0]?.id || 'p1';
    visiblePendingShopping.forEach((item) => {
      updateShoppingItem(item.id, { purchased: true, purchasedAt, purchasedBy });
    });
    toast.success(`${visiblePendingShopping.length} varer markeret som købt`);
  };

  const markShoppingGroupPurchased = (dateKey: string) => {
    const groupItems = visiblePendingShopping.filter((item) => (item.neededForDate || 'unscheduled') === dateKey);
    if (groupItems.length === 0) return;
    const purchasedAt = new Date().toISOString();
    const purchasedBy = currentUser?.id || users[0]?.id || 'p1';
    groupItems.forEach((item) => {
      updateShoppingItem(item.id, { purchased: true, purchasedAt, purchasedBy });
    });
    toast.success(`${groupItems.length} varer markeret som købt`);
  };

  const resetPurchasedShoppingItems = () => {
    if (purchasedShopping.length === 0) return;
    purchasedShopping.forEach((item) => {
      updateShoppingItem(item.id, {
        purchased: false,
        purchasedAt: undefined,
        purchasedBy: undefined
      });
    });
    toast.success('Købte varer nulstillet');
  };

  const handleAddCleaningTask = () => {
    if (!newCleaning.title.trim() || !newCleaning.assignedTo) {
      toast.error('Skriv opgave og vælg person');
      return;
    }

    void createTask({
      title: newCleaning.title.trim(),
      area: newCleaning.area.trim() || undefined,
      assignedTo: newCleaning.assignedTo,
      createdBy: currentUser?.id || users[0]?.id || 'p1',
      completed: false,
      category: 'cleaning',
      isRecurring: true,
      recurringPattern: newCleaning.recurringPattern,
      plannedWeekday: Number(newCleaning.weekday)
    });

    setIsAddCleaningOpen(false);
    setNewCleaning({
      title: '',
      area: '',
      assignedTo: currentUser?.id || users[0]?.id || '',
      weekday: '5',
      recurringPattern: 'weekly'
    });
    toast.success('Rengøringsopgave oprettet');
  };

  const addTemplateCleaningTask = (template: { title: string; area: string; weekday: number; recurringPattern: string }) => {
    void createTask({
      title: template.title,
      area: template.area,
      assignedTo: currentUser?.id || users[0]?.id || 'p1',
      createdBy: currentUser?.id || users[0]?.id || 'p1',
      completed: false,
      category: 'cleaning',
      isRecurring: true,
      recurringPattern: template.recurringPattern,
      plannedWeekday: template.weekday
    });
    toast.success(`${template.title} tilføjet`);
  };

  const applyIdea = (ideaId: string) => {
    if (ideaId === 'weekly-check-in') {
      const baseDate = startOfToday();
      const sunday = setDay(baseDate, 0, { weekStartsOn: 1 });
      const targetDay = sunday < baseDate ? addDays(sunday, 7) : sunday;
      const startAt = new Date(targetDay);
      startAt.setHours(19, 30, 0, 0);
      const endAt = new Date(targetDay);
      endAt.setHours(20, 0, 0, 0);

      void createEvent({
        title: 'Ugentlig familie check-in',
        type: 'meeting',
        startDate: startAt.toISOString(),
        endDate: endAt.toISOString(),
        createdBy: currentUser?.id || users[0]?.id || 'p1',
        description: 'Kort planlægningsmøde om ugeplan, måltider og overleveringer.'
      });
      toast.success('Check-in er lagt i kalenderen');
      return;
    }

    if (ideaId === 'meal-routine') {
      void createTask({
        title: 'Lav madplan for næste uge',
        assignedTo: currentUser?.id || users[0]?.id || 'p1',
        createdBy: currentUser?.id || users[0]?.id || 'p1',
        completed: false,
        category: 'general',
        isRecurring: true,
        recurringPattern: 'weekly',
        plannedWeekday: 6
      });
      toast.success('Madplan-rutine oprettet');
      return;
    }

    if (ideaId === 'starter-shopping') {
      ['Havregryn', 'Mælk', 'Frugt', 'Rugbrød', 'Toiletpapir'].forEach((name) => {
        const exists = shoppingItems.some((item) => item.name.toLowerCase() === name.toLowerCase() && !item.purchased);
        if (exists) return;
        addShoppingItem({
          id: shoppingItemId(),
          name,
          purchased: false,
          addedBy: currentUser?.id || users[0]?.id || 'p1',
          category: 'Basis',
          priority: 'normal'
        });
      });
      toast.success('Basisliste tilføjet');
      return;
    }

    if (ideaId === 'monthly-deep-clean') {
      void createTask({
        title: 'Månedlig dybderengøring af køkken og bad',
        area: 'Køkken + badeværelse',
        assignedTo: currentUser?.id || users[0]?.id || 'p1',
        createdBy: currentUser?.id || users[0]?.id || 'p1',
        completed: false,
        category: 'cleaning',
        isRecurring: true,
        recurringPattern: 'monthly',
        plannedWeekday: 5
      });
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

  const setupHomeReminders = () => {
    const ownerId = currentUser?.id || users[0]?.id || 'p1';
    const baseDate = startOfToday();
    const sunday = setDay(baseDate, 0, { weekStartsOn: 1 });
    const targetDay = sunday < baseDate ? addDays(sunday, 7) : sunday;
    const startAt = new Date(targetDay);
    startAt.setHours(17, 30, 0, 0);
    const endAt = new Date(targetDay);
    endAt.setHours(17, 50, 0, 0);

    const hasWeeklyMealEvent = events.some((event) => (
      event.title === 'Madplan check-in' && event.isRecurring
    ));
    if (!hasWeeklyMealEvent) {
      void createEvent({
        title: 'Madplan check-in',
        description: 'Planlæg den kommende uge: måltider, indkøb og opgaver.',
        type: 'meeting',
        startDate: startAt.toISOString(),
        endDate: endAt.toISOString(),
        createdBy: ownerId,
        assignedTo: users.map((user) => user.id),
        isRecurring: true,
        recurringPattern: 'WEEKLY'
      });
    }

    const hasShoppingTask = tasks.some((task) => (
      task.title === 'Tjek indkøb for de næste 2 dage' && task.isRecurring
    ));
    if (!hasShoppingTask) {
      void createTask({
        title: 'Tjek indkøb for de næste 2 dage',
        assignedTo: ownerId,
        createdBy: ownerId,
        completed: false,
        category: 'shopping',
        isRecurring: true,
        recurringPattern: 'weekly',
        plannedWeekday: 0
      });
    }

    const hasCleaningTask = tasks.some((task) => (
      task.title === 'Gennemgå ugens rengøringsplan' && task.isRecurring
    ));
    if (!hasCleaningTask) {
      void createTask({
        title: 'Gennemgå ugens rengøringsplan',
        assignedTo: ownerId,
        createdBy: ownerId,
        completed: false,
        category: 'cleaning',
        isRecurring: true,
        recurringPattern: 'weekly',
        plannedWeekday: 0
      });
    }

    const notificationCount = [
      pushNotification('meal_plan', 'Madplan-påmindelse', 'Husk at opdatere næste uges madplan.'),
      pushNotification('shopping_reminder', 'Indkøb-påmindelse', 'Tjek hvad I mangler til de kommende dage.'),
      pushNotification('cleaning_reminder', 'Rengøring-påmindelse', 'Fordel ugens huslige pligter.')
    ].filter(Boolean).length;

    toast.success(
      `${notificationCount} påmindelser oprettet` +
      (!hasWeeklyMealEvent || !hasShoppingTask || !hasCleaningTask ? ' og faste rutiner tilføjet' : '')
    );
  };

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

      void createMealPlan({
        date,
        mealType: meal.mealType,
        title: meal.title,
        notes: meal.notes,
        recipe: {
          name: meal.title,
          ingredients: meal.ingredients,
          instructions: meal.instructions
        }
      });
      mealsAdded += 1;
    });

    template.cleaning.forEach((item) => {
      const exists = tasks.some((task) => (
        task.category === 'cleaning' &&
        task.title.toLowerCase() === item.title.toLowerCase() &&
        task.plannedWeekday === item.weekday
      ));
      if (exists) return;

      void createTask({
        title: item.title,
        area: item.area,
        assignedTo: ownerId,
        createdBy: ownerId,
        completed: false,
        category: 'cleaning',
        isRecurring: true,
        recurringPattern: item.recurringPattern,
        plannedWeekday: item.weekday
      });
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
      void createMealPlan({
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
      });
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
    return pendingShopping
      .filter((item) => (
        shoppingFilterDate === 'all' || (item.neededForDate || 'unscheduled') === shoppingFilterDate
      ))
      .sort((a, b) => (a.neededForDate || 'zzzz').localeCompare(b.neededForDate || 'zzzz'));
  }, [pendingShopping, shoppingFilterDate]);

  const shoppingGroups = useMemo(() => {
    const groups = visiblePendingShopping.reduce<Record<string, typeof visiblePendingShopping>>((acc, item) => {
      const key = item.neededForDate || 'unscheduled';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [visiblePendingShopping]);

  const cleaningByWeekday = useMemo(() => {
    const groups = cleaningTasks.reduce<Record<string, typeof cleaningTasks>>((acc, task) => {
      const key = String(task.plannedWeekday ?? 0);
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});

    return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
  }, [cleaningTasks]);

  const completedCleaning = cleaningTasks.filter((task) => task.completed).length;
  const fridgeIngredientPool = useMemo(() => {
    return fridgeItems.flatMap((item) => {
      const tokens = item.name
        .toLowerCase()
        .split(/[\s,/-]+/)
        .map((value) => value.trim())
        .filter((value) => value.length > 1);
      return [item.name.toLowerCase(), ...tokens];
    });
  }, [fridgeItems]);

  const fridgeMealSuggestions = useMemo(() => {
    if (fridgeItems.length === 0) return [];

    return [...autoMealCandidates]
      .map((candidate) => {
        const candidateIngredients = candidate.ingredients.map((ingredient) => ingredient.toLowerCase());
        const matchedIngredients = candidateIngredients.filter((ingredient) => (
          fridgeIngredientPool.some((token) => ingredient.includes(token) || token.includes(ingredient))
        ));

        const score = matchedIngredients.length * 3 + (candidate.childFriendly ? 1 : 0);
        return {
          candidate,
          matchedIngredients,
          score
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [fridgeIngredientPool, fridgeItems.length]);

  const fridgeNutritionStats = useMemo(() => {
    const productsWithNutrition = fridgeItems.filter((item) => item.nutritionPer100g);
    if (productsWithNutrition.length === 0) return null;

    const sum = productsWithNutrition.reduce(
      (acc, product) => {
        acc.energy += product.nutritionPer100g?.energyKcal || 0;
        acc.protein += product.nutritionPer100g?.protein || 0;
        acc.carbs += product.nutritionPer100g?.carbs || 0;
        acc.fat += product.nutritionPer100g?.fat || 0;
        return acc;
      },
      { energy: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      count: productsWithNutrition.length,
      avgEnergy: sum.energy / productsWithNutrition.length,
      avgProtein: sum.protein / productsWithNutrition.length,
      avgCarbs: sum.carbs / productsWithNutrition.length,
      avgFat: sum.fat / productsWithNutrition.length,
    };
  }, [fridgeItems]);

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

  const applyFridgeSuggestionAsMeal = (suggestion: AutoMealCandidate) => {
    setNewMeal((prev) => ({
      ...prev,
      title: suggestion.title,
      mealType: 'dinner',
      ingredientsText: suggestion.ingredients.join('\n'),
      instructions: suggestion.instructions,
      notes: 'Forslag baseret på køleskab'
    }));
    setIsAddMealOpen(true);
  };

  return (
    <div className="space-y-4 p-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold text-[#2f2f2d]">Mad & Indkøb</h1>
        <p className="text-[#75736b]">Madplan, indkøbsliste og opskrifter</p>
      </motion.div>

      {/* Underline-style Tabs */}
      <div className="sticky top-0 z-10 bg-[#faf9f6] pb-0">
        <div className="flex items-center border-b border-[#e5e3dc] overflow-x-auto scrollbar-hide">
          {[
            { value: 'meal-plan', label: 'Madplan' },
            { value: 'shopping', label: 'Indkøb' },
            { value: 'ideas', label: 'Flere ting' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'relative flex-1 py-3 text-center text-[14px] font-semibold transition-colors whitespace-nowrap',
                activeTab === tab.value ? 'text-[#2f2f2d]' : 'text-[#b0ada4]'
              )}
            >
              {tab.label}
              {activeTab === tab.value && (
                <motion.div
                  layoutId="madhjem-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2f2f2d] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'meal-plan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setRecipeBrowserOpen(true)}
              className="flex items-center gap-2 rounded-2xl border-2 border-[#e5e3dc] bg-white px-3 py-2.5 text-left transition-all active:scale-[0.97] hover:border-[#cccbc3]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f2f1ed]">
                <BookOpen className="h-3.5 w-3.5 text-[#7a786f]" />
              </div>
              <span className="text-[12px] font-semibold text-[#4a4945] leading-tight">Opskrifter</span>
            </button>
            <Dialog open={isAddMealOpen} onOpenChange={setIsAddMealOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 rounded-2xl border-2 border-[#f3c59d] bg-[#fff2e6] px-3 py-2.5 text-left shadow-[0_2px_12px_rgba(245,138,45,0.12)] transition-all active:scale-[0.97]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f58a2d]">
                    <Plus className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[12px] font-bold text-[#bf6722] leading-tight">Tilføj ret</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ny ret i madplanen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Dag</Label>
                      <Input
                        type="date"
                        value={newMeal.date}
                        onChange={(e) => setNewMeal((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Måltid</Label>
                      <Select
                        value={newMeal.mealType}
                        onValueChange={(value) => setNewMeal((prev) => ({ ...prev, mealType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Morgenmad</SelectItem>
                          <SelectItem value="lunch">Frokost</SelectItem>
                          <SelectItem value="dinner">Aftensmad</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ret</Label>
                    <Input
                      value={newMeal.title}
                      onChange={(e) => setNewMeal((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Fx lasagne med salat"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ingredienser (én pr. linje)</Label>
                    <Textarea
                      value={newMeal.ingredientsText}
                      onChange={(e) => setNewMeal((prev) => ({ ...prev, ingredientsText: e.target.value }))}
                      rows={4}
                      placeholder={'500 g hakket oksekød\n1 løg\n2 dåser tomat'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Opskrift / fremgangsmåde</Label>
                    <Textarea
                      value={newMeal.instructions}
                      onChange={(e) => setNewMeal((prev) => ({ ...prev, instructions: e.target.value }))}
                      rows={3}
                      placeholder="Skriv korte trin..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Noter</Label>
                    <Input
                      value={newMeal.notes}
                      onChange={(e) => setNewMeal((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Fx barnets favorit, kan fryses osv."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={fillMealFromSuggestion}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Foreslå ret
                    </Button>
                    <Button type="button" className="flex-1" onClick={handleAddMeal}>
                      Gem ret
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <button
              onClick={handleGenerateShoppingFromWeek}
              className="flex items-center gap-2 rounded-2xl border-2 border-[#e5e3dc] bg-white px-3 py-2.5 text-left transition-all active:scale-[0.97] hover:border-[#cccbc3]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f2f1ed]">
                <ShoppingCart className="h-3.5 w-3.5 text-[#7a786f]" />
              </div>
              <span className="text-[12px] font-semibold text-[#4a4945] leading-tight">Generer indkøb</span>
            </button>
          </div>

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
                        className="rounded-xl border border-slate-200 p-3"
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

          <Sheet
            open={Boolean(selectedMealGuide)}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedMealGuideId(null);
                setGuideCompletedSteps(new Set());
              }
            }}
          >
            <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-[#d8d7cf] bg-[#faf9f6] px-4 pb-8 pt-4">
              <SheetHeader className="pb-2">
                <SheetTitle className="text-left text-lg font-bold text-[#2f2f2d]">
                  {selectedMealGuide?.title || 'Opskrift'}
                </SheetTitle>
              </SheetHeader>
              {selectedMealGuide && (() => {
                const richSteps = buildRichPreparationSteps(
                  selectedMealGuide.recipe?.instructions,
                  selectedMealGuide.recipe?.ingredients || [],
                  selectedMealGuide.title
                );
                const totalDuration = richSteps.reduce((sum, s) => sum + (s.duration || 0), 0);
                const completedCount = guideCompletedSteps.size;
                const progressPercent = richSteps.length > 0 ? Math.round((completedCount / richSteps.length) * 100) : 0;

                return (
                  <div className="space-y-4 pt-1">
                    {/* Header badges + time estimate */}
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
                      <div className="rounded-2xl border border-[#e8e7e0] bg-white p-3">
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
                      <div className="space-y-3">
                        {richSteps.map((step, index) => {
                          const isCompleted = guideCompletedSteps.has(index);
                          return (
                            <div
                              key={`${selectedMealGuide.id}-rstep-${index}`}
                              className={cn(
                                "rounded-2xl border bg-white p-3.5 transition-all duration-300",
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
                                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#fdf8ef] px-2.5 py-2">
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

                    {/* Done button */}
                    {progressPercent === 100 && (
                      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
                        <p className="text-sm font-semibold text-green-700">🎉 Alle trin fuldført!</p>
                        <p className="mt-0.5 text-xs text-green-600">Velbekomme — nyd maden!</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </SheetContent>
          </Sheet>
        </div>
      )}

      {activeTab === 'shopping' && (
        <div className="space-y-4">
          {/* Sub-tabs: Køleskab / Indkøbsliste */}
          <div className="flex rounded-xl border border-[#d8d7cf] bg-[#ecebe5] p-1">
            <button
              onClick={() => setShoppingSubTab('koleskab')}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all",
                shoppingSubTab === 'koleskab'
                  ? "bg-white text-[#2f2f2d] shadow-sm"
                  : "text-[#78766d] hover:text-[#4a4945]"
              )}
            >
              <PackageSearch className="h-4 w-4" />
              Køleskab
            </button>
            <button
              onClick={() => setShoppingSubTab('indkobsliste')}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all",
                shoppingSubTab === 'indkobsliste'
                  ? "bg-white text-[#2f2f2d] shadow-sm"
                  : "text-[#78766d] hover:text-[#4a4945]"
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              Indkøbsliste
            </button>
          </div>

          {shoppingSubTab === 'koleskab' && (
          <Card className="border-[#d8d7cf] bg-[#faf9f6]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageSearch className="h-4 w-4 text-[#67645c]" />
                Køleskabsscanning og madforslag
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex gap-2">
                <Input
                  value={fridgeQuickInput}
                  onChange={(event) => setFridgeQuickInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addQuickFridgeItem();
                    }
                  }}
                  placeholder="Tilføj vare i køleskab (fx æg, spinat)"
                />
                <Button type="button" variant="outline" onClick={addQuickFridgeItem}>
                  Tilføj
                </Button>
              </div>

              {fridgeItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#d8d7cf] bg-[#f7f6f2] p-3 text-xs text-[#75736b]">
                  Tilføj varer fra scanner eller manuelt. Så får du forslag baseret på det, du allerede har.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {fridgeItems.map((item, index) => (
                      <Badge key={`${item.barcode || item.name}-${index}`} variant="outline" className="bg-white">
                        {item.name}
                      </Badge>
                    ))}
                  </div>
                  {fridgeNutritionStats && (
                    <div className="rounded-xl border border-[#e0ded7] bg-white p-3 text-xs text-[#5f5c53]">
                      <p className="font-medium text-[#2f2f2d]">Nærings-estimat (pr. 100g på registrerede produkter)</p>
                      <p className="mt-1">
                        {Math.round(fridgeNutritionStats.avgEnergy)} kcal ·
                        {' '}P {fridgeNutritionStats.avgProtein.toFixed(1)}g ·
                        {' '}K {fridgeNutritionStats.avgCarbs.toFixed(1)}g ·
                        {' '}F {fridgeNutritionStats.avgFat.toFixed(1)}g
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-[#5f5c53]">Forslag ud fra køleskab</p>
                {fridgeMealSuggestions.length === 0 ? (
                  <p className="text-xs text-[#75736b]">Ingen match endnu. Tilføj flere varer for bedre forslag.</p>
                ) : (
                  fridgeMealSuggestions.map((entry) => (
                    <div key={entry.candidate.title} className="rounded-xl border border-[#dfddd6] bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#2f2f2d]">{entry.candidate.title}</p>
                          <p className="text-xs text-[#75736b]">
                            Matcher: {entry.matchedIngredients.slice(0, 3).join(', ') || 'basisvarer'}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => applyFridgeSuggestionAsMeal(entry.candidate)}>
                          <Sparkles className="mr-1 h-3.5 w-3.5" />
                          Brug
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {shoppingSubTab === 'indkobsliste' && (<>

          {/* ── Action cards ── */}
          <div className="grid grid-cols-2 gap-2.5">
            <Dialog open={isAddShoppingOpen} onOpenChange={setIsAddShoppingOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-2xl border-2 border-[#f3c59d] bg-[#fff2e6] p-3 text-left shadow-[0_2px_12px_rgba(245,138,45,0.12)] transition-all active:scale-[0.98]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f58a2d]">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[13px] font-bold text-[#bf6722]">Tilføj vare</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ny vare til indkøb</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Vare</Label>
                    <Input
                      value={newShopping.name}
                      onChange={(e) => setNewShopping((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Fx gulerødder"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Mængde</Label>
                      <Input
                        value={newShopping.quantity}
                        onChange={(e) => setNewShopping((prev) => ({ ...prev, quantity: e.target.value }))}
                        placeholder="Fx 1 kg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prioritet</Label>
                      <Select
                        value={newShopping.priority}
                        onValueChange={(value) => setNewShopping((prev) => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Lav</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Høj</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Kategori</Label>
                      <Input
                        value={newShopping.category}
                        onChange={(e) => setNewShopping((prev) => ({ ...prev, category: e.target.value }))}
                        placeholder="Fx Dagligvarer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dag (valgfri)</Label>
                      <Input
                        type="date"
                        value={newShopping.neededForDate}
                        onChange={(e) => setNewShopping((prev) => ({ ...prev, neededForDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Knyt til ret (valgfri)</Label>
                    <Select
                      value={newShopping.neededForMealId}
                      onValueChange={(value) => setNewShopping((prev) => ({ ...prev, neededForMealId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg ret" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ingen ret valgt</SelectItem>
                        {upcomingMealPlans.map((meal) => (
                          <SelectItem key={meal.id} value={meal.id}>
                            {format(parseISO(meal.date), 'd. MMM', { locale: da })} - {meal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddShopping} className="w-full">
                    Tilføj vare
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isScanDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setIsScanDialogOpen(false);
                  return;
                }
                openScanDialog();
              }}
            >
              <DialogTrigger asChild>
                <button disabled={!canUseScanner} onClick={openScanDialog} className="flex items-center gap-2.5 rounded-2xl border-2 border-[#e5e3dc] bg-white p-3 text-left transition-all hover:border-[#cccbc3] active:scale-[0.98] disabled:opacity-50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0efe8]">
                    <ScanLine className="h-4 w-4 text-[#75736b]" />
                  </div>
                  <span className="text-[13px] font-bold text-[#2f2f2d]">Scan vare</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Scan stregkode til indkøbsliste</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
                    <video
                      ref={videoRef}
                      className="h-56 w-full object-cover"
                      playsInline
                      muted
                    />
                  </div>

                  {!scanSupported && (
                    <p className="rounded-xl border border-[#f3c59d] bg-[#fff2e6] px-3 py-2 text-sm text-[#9a622f]">
                      Din browser understøtter ikke stregkodescanner. Du kan stadig tilføje varen manuelt.
                    </p>
                  )}

                  {scanError && (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {scanError}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void startScanner();
                      }}
                      disabled={isScanning}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {isScanning ? 'Scanner...' : 'Start scanning'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={stopScanner}>
                      Stop
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!scannedCode.trim() || isProductLookupLoading}
                      onClick={() => {
                        void hydrateScannedProduct(scannedCode);
                      }}
                    >
                      {isProductLookupLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                      Hent produktdata
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Stregkode</Label>
                    <Input
                      value={scannedCode}
                      onChange={(e) => {
                        setScannedCode(e.target.value);
                        setScannedProduct(null);
                      }}
                      placeholder="Scannes automatisk eller skriv selv"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Varenavn</Label>
                    <Input
                      value={scannedName}
                      onChange={(e) => setScannedName(e.target.value)}
                      placeholder="Fx Mælk 1L"
                    />
                  </div>

                  {scannedProduct && (
                    <div className="rounded-xl border border-[#dfddd6] bg-[#faf9f6] p-3">
                      <p className="text-xs font-medium text-[#2f2f2d]">Open Food Facts data</p>
                      <p className="mt-1 text-xs text-[#666359]">
                        {scannedProduct.nutritionPer100g?.energyKcal
                          ? `${Math.round(scannedProduct.nutritionPer100g.energyKcal)} kcal/100g`
                          : 'Ingen energi-data'}
                        {scannedProduct.allergens.length > 0 ? ` · Allergener: ${scannedProduct.allergens.join(', ')}` : ''}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Mængde (valgfri)</Label>
                    <Input
                      value={scannedQuantity}
                      onChange={(e) => setScannedQuantity(e.target.value)}
                      placeholder="Fx 2 stk"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button type="button" className="w-full" onClick={addScannedShoppingItem}>
                      Tilføj til indkøb
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={addScannedToFridge}>
                      Tilføj til køleskab
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <button onClick={handleGenerateShoppingFromWeek} className="flex items-center gap-2.5 rounded-2xl border-2 border-[#e5e3dc] bg-white p-3 text-left transition-all hover:border-[#cccbc3] active:scale-[0.98]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0efe8]">
                <RefreshCw className="h-4 w-4 text-[#75736b]" />
              </div>
              <span className="text-[13px] font-bold text-[#2f2f2d]">Fra madplan</span>
            </button>
            <button
              onClick={async () => {
                await rehydrateSharedState();
                toast.success('Synkroniseret');
              }}
              className="flex items-center gap-2.5 rounded-2xl border-2 border-[#e5e3dc] bg-white p-3 text-left transition-all hover:border-[#cccbc3] active:scale-[0.98]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0efe8]">
                <RefreshCw className="h-4 w-4 text-[#75736b]" />
              </div>
              <span className="text-[13px] font-bold text-[#2f2f2d]">Synk nu</span>
            </button>
          </div>

          {/* ── Day filter pills ── */}
          <div className="rounded-2xl border border-[#e5e3dc] bg-white p-3.5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#75736b]">Vis efter dag</p>
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setShoppingFilterDate('all')}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all whitespace-nowrap',
                  shoppingFilterDate === 'all'
                    ? 'bg-[#2f2f2f] text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                    : 'border border-[#e5e3dc] bg-[#faf9f6] text-[#75736b] hover:border-[#cccbc3]'
                )}
              >
                Alle
              </button>
              {weekDates.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setShoppingFilterDate(date)}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all whitespace-nowrap',
                    shoppingFilterDate === date
                      ? 'bg-[#f58a2d] text-white shadow-[0_2px_8px_rgba(245,138,45,0.25)]'
                      : 'border border-[#e5e3dc] bg-[#faf9f6] text-[#75736b] hover:border-[#cccbc3]'
                  )}
                >
                  {format(parseISO(date), 'EEE d/M', { locale: da })}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShoppingFilterDate('unscheduled')}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all whitespace-nowrap',
                  shoppingFilterDate === 'unscheduled'
                    ? 'bg-[#2f2f2f] text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                    : 'border border-[#e5e3dc] bg-[#faf9f6] text-[#75736b] hover:border-[#cccbc3]'
                )}
              >
                Uden dag
              </button>
            </div>
          </div>

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

          {shoppingGroups.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                Ingen varer på listen for det valgte filter.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {shoppingGroups.map(([dateKey, items]) => (
                <div key={dateKey}>
                  {/* Date header */}
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#2f2f2d]">
                      {dateKey === 'unscheduled'
                        ? 'Uden dato'
                        : format(parseISO(dateKey), 'EEEE d. MMMM', { locale: da })}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#78766d]">{items.length} varer</span>
                      {items.length > 1 && (
                        <button
                          onClick={() => markShoppingGroupPurchased(dateKey)}
                          className="text-[11px] font-medium text-[#f58a2d] hover:underline"
                        >
                          Afkryds alle
                        </button>
                      )}
                    </div>
                  </div>
                  {/* List items */}
                  <div className="rounded-2xl border border-[#e8e7e0] bg-white">
                    {items.map((item, idx) => {
                      const meal = item.neededForMealId ? mealPlans.find((m) => m.id === item.neededForMealId) : null;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5",
                            idx < items.length - 1 && "border-b border-[#f0efe8]"
                          )}
                        >
                          <Checkbox
                            checked={item.purchased}
                            onCheckedChange={(checked) => toggleShoppingItem(item.id, checked as boolean)}
                            className="h-5 w-5 shrink-0 rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className={cn(
                                "text-[14px] font-medium text-[#2f2f2d]",
                                item.purchased && "line-through text-[#9b9a93]"
                              )}>
                                {item.name}
                              </span>
                              {item.quantity && (
                                <span className="text-[12px] text-[#78766d]">{item.quantity}</span>
                              )}
                              {item.priority === 'high' && (
                                <span className="text-[10px] font-semibold text-[#f58a2d]">!</span>
                              )}
                            </div>
                            {(item.category || meal) && (
                              <p className="text-[11px] text-[#9b9a93]">
                                {item.category}{item.category && meal ? ' · ' : ''}{meal ? `Til: ${meal.title}` : ''}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteShoppingItem(item.id)}
                            className="shrink-0 p-1.5 text-[#c5c4be] hover:text-[#ef4444] transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {purchasedShopping.length > 0 ? (
            <Card className="bg-slate-50/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Købt ({purchasedShopping.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {purchasedShopping.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
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
                      onClick={() => updateShoppingItem(item.id, { purchased: false, purchasedAt: undefined, purchasedBy: undefined })}
                    >
                      Gendan
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          </>)}
        </div>
      )}

      {activeTab === 'ideas' && (
        <div className="space-y-5">

          {/* ─── Uge-skabeloner ─── */}
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d] mb-2">Uge-skabeloner</p>
            <div className="space-y-2">
              {weekTemplates.map((template) => (
                <div key={template.id} className="flex items-center gap-3.5 rounded-2xl border-2 border-[#e5e3dc] bg-white px-4 py-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f2f1ed]">
                    <CalendarDays className="h-5 w-5 text-[#7a786f]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#2f2f2d]">{template.name}</p>
                    <p className="text-[11px] text-[#9a978f] mt-0.5 line-clamp-1">{template.description}</p>
                  </div>
                  <button
                    onClick={() => applyWeekTemplate(template.id)}
                    className="shrink-0 rounded-xl border-2 border-[#e5e3dc] bg-white px-4 py-2 text-[12px] font-semibold text-[#4a4945] transition-all active:scale-[0.96] hover:border-[#cccbc3]"
                  >
                    Brug
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Auto-planlæg uge (regelbaseret) ─── */}
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d] mb-2">Auto-planlæg uge</p>
            <div className="rounded-2xl border-2 border-[#e5e3dc] bg-white overflow-hidden">
              <div className="px-4 pt-4 pb-1">
                <p className="text-[11px] text-[#9a978f]">Regelbaseret madplan-generator</p>
              </div>
              <div className="px-4 py-3 space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[12px] font-semibold text-[#5f5d56]">Favoritter (kommasepareret)</p>
                  <Input
                    value={autoPlannerSettings.favoriteKeywords}
                    onChange={(e) => setAutoPlannerSettings((prev) => ({ ...prev, favoriteKeywords: e.target.value }))}
                    placeholder="fx pasta, frikadeller, kylling"
                    className="rounded-xl border-[#e5e3dc] bg-[#faf9f6] text-[13px] placeholder:text-[#c5c4be]"
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[12px] font-semibold text-[#5f5d56]">Undgå ingredienser (kommasepareret)</p>
                  <Input
                    value={autoPlannerSettings.avoidIngredients}
                    onChange={(e) => setAutoPlannerSettings((prev) => ({ ...prev, avoidIngredients: e.target.value }))}
                    placeholder="fx nødder, svampe"
                    className="rounded-xl border-[#e5e3dc] bg-[#faf9f6] text-[13px] placeholder:text-[#c5c4be]"
                  />
                </div>

                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-3 rounded-xl bg-[#faf9f6] px-3 py-2.5 text-[13px] text-[#2f2f2d]">
                    <Checkbox
                      checked={autoPlannerSettings.childFriendly}
                      onCheckedChange={(checked) => setAutoPlannerSettings((prev) => ({ ...prev, childFriendly: checked as boolean }))}
                      className="h-5 w-5 rounded-lg border-[#d8d7cf] data-[state=checked]:bg-[#2f2f2d] data-[state=checked]:border-[#2f2f2d]"
                    />
                    Prioritér børnevenlige retter
                  </label>
                  <label className="flex items-center gap-3 rounded-xl bg-[#faf9f6] px-3 py-2.5 text-[13px] text-[#2f2f2d]">
                    <Checkbox
                      checked={autoPlannerSettings.replaceExisting}
                      onCheckedChange={(checked) => setAutoPlannerSettings((prev) => ({ ...prev, replaceExisting: checked as boolean }))}
                      className="h-5 w-5 rounded-lg border-[#d8d7cf] data-[state=checked]:bg-[#2f2f2d] data-[state=checked]:border-[#2f2f2d]"
                    />
                    Erstat eksisterende middage i denne uge
                  </label>
                  <label className="flex items-center gap-3 rounded-xl bg-[#faf9f6] px-3 py-2.5 text-[13px] text-[#2f2f2d]">
                    <Checkbox
                      checked={autoPlannerSettings.useChildAllergies}
                      onCheckedChange={(checked) => setAutoPlannerSettings((prev) => ({ ...prev, useChildAllergies: checked as boolean }))}
                      className="h-5 w-5 rounded-lg border-[#d8d7cf] data-[state=checked]:bg-[#2f2f2d] data-[state=checked]:border-[#2f2f2d]"
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
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f58a2d] px-4 py-3.5 text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(245,138,45,0.25)] transition-all active:scale-[0.98]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generer ugeplan automatisk
                </button>
                <p className="text-[11px] text-[#9a978f] text-center pb-1">
                  Planneren vælger 7 middage ud fra dine regler og opretter dem i madplanen.
                </p>
              </div>
            </div>
          </div>

          {/* ─── Ekstra hurtigtilvalg ─── */}
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d] mb-2">Hurtigtilvalg</p>
            <div className="space-y-2">
              {[
                { id: 'weekly-check-in', title: 'Ugentlig familie check-in', desc: 'Automatisk møde i kalenderen hver søndag aften.', icon: CalendarDays },
                { id: 'meal-routine', title: 'Fast madplan-rutine', desc: 'Gentagende opgave, så I husker næste uges måltider.', icon: Repeat2 },
                { id: 'starter-shopping', title: 'Basis-indkøbsliste', desc: 'Fyld listen med faste basisvarer med ét klik.', icon: ShoppingCart },
                { id: 'monthly-deep-clean', title: 'Månedlig dybderengøring', desc: 'Fast plan for de tungere huslige opgaver.', icon: Home },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-center gap-3.5 rounded-2xl border-2 border-[#e5e3dc] bg-white px-4 py-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff2e6]">
                      <Icon className="h-5 w-5 text-[#f58a2d]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#2f2f2d]">{item.title}</p>
                      <p className="text-[11px] text-[#9a978f] leading-snug mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => applyIdea(item.id)}
                      className="shrink-0 rounded-xl bg-[#f58a2d] px-4 py-2 text-[12px] font-bold text-white transition-all active:scale-[0.96]"
                    >
                      Tilføj
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recipe Browser — Full-screen page */}
      <AnimatePresence>
        {recipeBrowserOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-[#faf9f6] overflow-hidden flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="shrink-0 px-4 pt-3 pb-2">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setRecipeBrowserOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f1ed] transition-all active:scale-[0.92]"
                >
                  <ArrowLeft className="h-[18px] w-[18px] text-[#2f2f2d]" />
                </button>
                <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#2f2f2d]">Opskrifter</h1>
                <div className="flex-1" />
                <button
                  onClick={() => setCreateRecipeOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#f58a2d] px-3.5 py-2 text-[13px] font-bold text-white transition-all active:scale-[0.96]"
                >
                  <Plus className="h-4 w-4" />
                  Ny
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b0ada4]" />
                <Input
                  value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)}
                  placeholder="Søg opskrift..."
                  className="pl-9 rounded-xl border-[#e5e3dc] bg-white text-[14px]"
                />
              </div>

              {/* Category filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                <button
                  onClick={() => setRecipeCategory('Alle')}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                    recipeCategory === 'Alle' ? "bg-[#2f2f2f] text-white" : "bg-[#f2f1ed] text-[#5f5d56]"
                  )}
                >
                  Alle
                </button>
                {recipeCategories.map((cat: string) => (
                  <button
                    key={cat}
                    onClick={() => setRecipeCategory(cat)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                      recipeCategory === cat ? "bg-[#2f2f2f] text-white" : "bg-[#f2f1ed] text-[#5f5d56]"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipe list */}
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              <div className="space-y-2 pt-2">
                {filteredRecipes.map((recipe: Recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => { setSelectedRecipe(recipe); setRecipeServings(recipe.servings); }}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-[#e5e3dc] bg-white px-4 py-3.5 text-left transition-all active:scale-[0.98] hover:border-[#d8d7cf]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-[#2f2f2d]">{recipe.name}</p>
                        {recipe.childFriendly && (
                          <span className="inline-flex items-center gap-0.5 rounded-lg bg-[#fff2e6] border border-[#f3c59d] px-1.5 py-0.5 text-[10px] font-semibold text-[#cc6f1f]">
                            <Baby className="h-3 w-3" /> Børnevenlig
                          </span>
                        )}
                        {recipe.isUserRecipe && (
                          <span className="rounded-lg bg-[#e8f4fd] border border-[#b3d4f0] px-1.5 py-0.5 text-[10px] font-semibold text-[#4a90d9]">Din</span>
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
            className="fixed inset-0 z-[60] bg-[#faf9f6] overflow-hidden flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="shrink-0 px-4 pt-3 pb-3 flex items-center gap-3">
              <button
                onClick={() => setCreateRecipeOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f1ed] transition-all active:scale-[0.92]"
              >
                <ArrowLeft className="h-[18px] w-[18px] text-[#2f2f2d]" />
              </button>
              <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#2f2f2d]">Opret ny opskrift</h1>
            </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-8">
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Navn</Label>
              <Input
                value={newRecipe.name}
                onChange={e => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Fx. Bedstemors kyllingesuppe"
                className="rounded-xl border-[#d8d7cf]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Beskrivelse</Label>
              <Input
                value={newRecipe.description}
                onChange={e => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kort beskrivelse..."
                className="rounded-xl border-[#d8d7cf]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#78766d]">Kategori</Label>
                <Select value={newRecipe.category} onValueChange={v => setNewRecipe(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="rounded-xl border-[#d8d7cf]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {recipeCategories.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#78766d]">Sværhedsgrad</Label>
                <Select value={newRecipe.difficulty} onValueChange={(v: 'easy' | 'medium' | 'hard') => setNewRecipe(prev => ({ ...prev, difficulty: v }))}>
                  <SelectTrigger className="rounded-xl border-[#d8d7cf]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Nem</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Svær</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#78766d]">Portioner</Label>
                <Input type="number" value={newRecipe.servings} onChange={e => setNewRecipe(prev => ({ ...prev, servings: +e.target.value || 1 }))} className="rounded-xl border-[#d8d7cf]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#78766d]">Forberedelse</Label>
                <Input type="number" value={newRecipe.prepTime} onChange={e => setNewRecipe(prev => ({ ...prev, prepTime: +e.target.value || 0 }))} className="rounded-xl border-[#d8d7cf]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-semibold text-[#78766d]">Tilberedning</Label>
                <Input type="number" value={newRecipe.cookTime} onChange={e => setNewRecipe(prev => ({ ...prev, cookTime: +e.target.value || 0 }))} className="rounded-xl border-[#d8d7cf]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Ingredienser (én per linje, fx "500 g hakket kød")</Label>
              <Textarea
                value={newRecipe.ingredientsText}
                onChange={e => setNewRecipe(prev => ({ ...prev, ingredientsText: e.target.value }))}
                placeholder={"500 g hakket oksekød\n1 stk løg\n2 dl fløde\n..."}
                rows={5}
                className="rounded-xl border-[#d8d7cf]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Tilberedning trin for trin (ét trin per linje)</Label>
              <Textarea
                value={newRecipe.stepsText}
                onChange={e => setNewRecipe(prev => ({ ...prev, stepsText: e.target.value }))}
                placeholder={"Hak løget fint og svits i olie.\nTilsæt hakket kød og brun det.\nTilsæt fløde og lad simre 20 min."}
                rows={5}
                className="rounded-xl border-[#d8d7cf]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-[#78766d]">Tags (kommasepareret)</Label>
              <Input
                value={newRecipe.tags}
                onChange={e => setNewRecipe(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="dansk, hurtig, comfort, børnevenlig"
                className="rounded-xl border-[#d8d7cf]"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#e8e7e0] bg-white px-3 py-2.5">
              <span className="text-[12px] font-semibold text-[#2f2f2d]">Børnevenlig</span>
              <Checkbox checked={newRecipe.childFriendly} onCheckedChange={(v) => setNewRecipe(prev => ({ ...prev, childFriendly: !!v }))} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#e8e7e0] bg-white px-3 py-2.5">
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
              className="w-full rounded-2xl bg-[#f58a2d] text-white hover:bg-[#e47921]"
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
                  tags: newRecipe.tags.split(',').map(t => t.trim()).filter(Boolean),
                  childFriendly: newRecipe.childFriendly,
                  isUserRecipe: true,
                  createdBy: currentUser?.id,
                  isShared: newRecipe.shareWithFamily,
                };
                addUserRecipe(recipe);
                setCreateRecipeOpen(false);
                setNewRecipe({ name: '', description: '', category: 'Aftensmad', servings: 4, prepTime: 15, cookTime: 30, difficulty: 'easy', ingredientsText: '', stepsText: '', tags: '', childFriendly: true, shareWithFamily: true });
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

      {/* Recipe Detail — Full-screen page */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[55] bg-[#faf9f6] overflow-hidden flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="shrink-0 px-4 pt-3 pb-3 flex items-center gap-3">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f1ed] transition-all active:scale-[0.92]"
              >
                <ArrowLeft className="h-[18px] w-[18px] text-[#2f2f2d]" />
              </button>
              <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#2f2f2d] truncate">{selectedRecipe.name}</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              <div className="space-y-4">
                <p className="text-[13px] text-[#4a4945] leading-relaxed">{selectedRecipe.description}</p>

                {/* Nutrition bar */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Kcal', val: Math.round(selectedRecipe.nutrition.kcal * recipeServings / selectedRecipe.servings), color: 'bg-[#f58a2d]' },
                    { label: 'Protein', val: `${Math.round(selectedRecipe.nutrition.protein * recipeServings / selectedRecipe.servings)}g`, color: 'bg-[#4a90d9]' },
                    { label: 'Kulhydrat', val: `${Math.round(selectedRecipe.nutrition.carbs * recipeServings / selectedRecipe.servings)}g`, color: 'bg-[#22c55e]' },
                    { label: 'Fedt', val: `${Math.round(selectedRecipe.nutrition.fat * recipeServings / selectedRecipe.servings)}g`, color: 'bg-[#ef4444]' },
                  ].map(n => (
                    <div key={n.label} className="rounded-2xl border-2 border-[#e5e3dc] bg-white p-3 text-center">
                      <div className={cn("mx-auto mb-1.5 h-1.5 w-10 rounded-full", n.color)} />
                      <p className="text-[14px] font-bold text-[#2f2f2d]">{n.val}</p>
                      <p className="text-[10px] text-[#9a978f]">{n.label}</p>
                    </div>
                  ))}
                </div>

                {/* Serving adjuster */}
                <div className="flex items-center justify-between rounded-2xl border-2 border-[#e5e3dc] bg-white px-4 py-3">
                  <span className="text-[13px] font-semibold text-[#2f2f2d]">Portioner</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRecipeServings(Math.max(1, recipeServings - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f1ed] text-[#5f5d56] active:scale-[0.92]"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-[15px] font-bold text-[#2f2f2d]">{recipeServings}</span>
                    <button
                      onClick={() => setRecipeServings(Math.min(20, recipeServings + 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f1ed] text-[#5f5d56] active:scale-[0.92]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Ingredienser</p>
                  <div className="rounded-2xl border-2 border-[#e5e3dc] bg-white p-4 space-y-2">
                    {selectedRecipe.ingredients.map((ing, i) => {
                      const scale = recipeServings / selectedRecipe.servings;
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

                {/* Steps */}
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Tilberedning</p>
                  <div className="space-y-2.5">
                    {selectedRecipe.steps.map(step => (
                      <div key={step.step} className="rounded-2xl border-2 border-[#e5e3dc] bg-white px-4 py-3">
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
                </div>

                {/* Add to meal plan button */}
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f58a2d] px-4 py-3.5 text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(245,138,45,0.25)] transition-all active:scale-[0.98]"
                  onClick={() => {
                    if (!selectedRecipe) return;
                    setNewMeal((prev) => ({
                      ...prev,
                      title: selectedRecipe.name,
                      mealType: 'dinner',
                      ingredientsText: selectedRecipe.ingredients.map(ing => {
                        const scale = recipeServings / selectedRecipe.servings;
                        return `${Math.round(ing.amount * scale * 10) / 10} ${ing.unit} ${ing.name}`;
                      }).join('\n'),
                      instructions: selectedRecipe.steps.map(s => `${s.step}. ${s.description}`).join('\n'),
                      notes: `${selectedRecipe.nutrition.kcal} kcal/portion · ${recipeServings} portioner`
                    }));
                    setSelectedRecipe(null);
                    setRecipeBrowserOpen(false);
                    setIsAddMealOpen(true);
                    toast.success('Opskrift tilføjet til madplan');
                  }}
                >
                  <ChefHat className="h-4 w-4" />
                  Tilføj til madplan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
