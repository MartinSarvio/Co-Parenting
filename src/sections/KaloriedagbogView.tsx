import { useState, useMemo, useRef, useCallback } from 'react';
import { addDays, format, subDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Settings,
  X,
  Info,
  Target,
  Flame,
  Droplets,
  Dumbbell,
  Wheat,
  Users,
  User,
  Search,
  ChefHat,
  Minus,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  ScanLine,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { BottomSheet } from '@/components/custom/BottomSheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { recipes, recipeCategories } from '@/data/recipes';
import { FOOD_ITEMS, foodCategories } from '@/data/foodItems';
import type { FoodItem, FoodCategory } from '@/data/foodItems';
import type { Recipe, MealPlan, MealPlanOverride } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────

export type FoodLogEntry = {
  id: string;
  meal: string;
  food: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  salt?: number;
  servingSize?: string;
  time: string;
  date: string;
  memberId: string;
};

export type NutritionGoals = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
};

const DEFAULT_GOALS: NutritionGoals = {
  kcal: 2000,
  protein: 75,
  carbs: 250,
  fat: 65,
  fiber: 30,
  water: 2000,
};

const MEALS = [
  { key: 'morgenmad',      label: 'Morgenmad',         emoji: '☀️',  color: '#FFB347', mealType: 'breakfast' },
  { key: 'mellemmaltid1',  label: 'Mellemmåltid',       emoji: '🍎',  color: '#87CEEB', mealType: 'snack' },
  { key: 'frokost',        label: 'Frokost',            emoji: '🥗',  color: '#90EE90', mealType: 'lunch' },
  { key: 'mellemmaltid2',  label: 'Eftermiddagssnack',  emoji: '🍌',  color: '#DDA0DD', mealType: 'snack' },
  { key: 'aftensmad',      label: 'Aftensmad',          emoji: '🍽️', color: '#F08080', mealType: 'dinner' },
  { key: 'snack',          label: 'Aftensnack',         emoji: '🌙',  color: '#B0C4DE', mealType: 'snack' },
];

const MEAL_TYPE_MAP: Record<string, string> = {
  breakfast: 'morgenmad',
  lunch: 'frokost',
  dinner: 'aftensmad',
  snack: 'snack',
};

// ── Helper ─────────────────────────────────────────────────────────────────

function pct(val: number, goal: number) {
  return Math.min(100, Math.round((val / goal) * 100));
}

function macroCalories(p: number, c: number, f: number) {
  return p * 4 + c * 4 + f * 9;
}

function round1(v: number) { return Math.round(v * 10) / 10; }

// ── Open Food Facts helper ──────────────────────────────────────────────────

type OFFResult = {
  name: string;
  brand?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  saltPer100g?: number;
};

async function fetchFromOpenFoodFacts(barcode: string): Promise<OFFResult | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json() as {
      status: number;
      product?: {
        product_name?: string;
        generic_name?: string;
        brands?: string;
        nutriments?: Record<string, number>;
      };
    };
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const n = p.nutriments ?? {};
    return {
      name: p.product_name || p.generic_name || `Stregkode ${barcode}`,
      brand: p.brands,
      kcalPer100g: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
      proteinPer100g: n['proteins_100g'] ?? n['proteins'] ?? 0,
      carbsPer100g: n['carbohydrates_100g'] ?? n['carbohydrates'] ?? 0,
      fatPer100g: n['fat_100g'] ?? n['fat'] ?? 0,
      fiberPer100g: n['fiber_100g'] ?? n['fiber'],
      sugarPer100g: n['sugars_100g'] ?? n['sugars'],
      saltPer100g: n['salt_100g'] ?? n['salt'],
    };
  } catch {
    return null;
  }
}

// ── MacroRing component ────────────────────────────────────────────────────

function MacroRing({ value, goal, color, size = 56 }: { value: number; goal: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const fill = Math.min(1, value / goal);
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f2f1ed" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - fill)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

// ── FoodPickerView ─────────────────────────────────────────────────────────

interface FoodPickerProps {
  meal: string;
  userRecipes: Recipe[];
  onClose: () => void;
  onAdd: (entry: Omit<FoodLogEntry, 'id' | 'time' | 'date' | 'memberId'>) => void;
}

function FoodPickerView({ meal, userRecipes, onClose, onAdd }: FoodPickerProps) {
  const [pickerTab, setPickerTab] = useState<'fodevarer' | 'opskrifter'>('fodevarer');
  const [search, setSearch] = useState('');

  // Fødevarer state
  const [foodCategory, setFoodCategory] = useState<'Alle' | FoodCategory>('Alle');
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [servingGrams, setServingGrams] = useState('100');

  // Opskrifter state
  const [recipeCategory, setRecipeCategory] = useState('Alle');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(1);

  // Barcode scanner state
  const [scanLoading, setScanLoading] = useState(false);

  // All recipes merged
  const allRecipes = useMemo(() => [...recipes, ...userRecipes], [userRecipes]);

  // Filtered food items
  const filteredFoodItems = useMemo(() => {
    return FOOD_ITEMS.filter(f => {
      const matchSearch = search.length === 0 ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.brand?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchCat = foodCategory === 'Alle' || f.category === foodCategory;
      return matchSearch && matchCat;
    });
  }, [search, foodCategory]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter(r => {
      const matchSearch = search.length === 0 ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchCat = recipeCategory === 'Alle' || r.category === recipeCategory;
      return matchSearch && matchCat;
    });
  }, [allRecipes, search, recipeCategory]);

  // Calculated nutrition for food item
  const grams = Math.max(0, parseFloat(servingGrams) || 0);
  const calcFood = selectedFoodItem ? {
    kcal: Math.round(selectedFoodItem.kcalPer100g * grams / 100),
    protein: round1(selectedFoodItem.proteinPer100g * grams / 100),
    carbs: round1(selectedFoodItem.carbsPer100g * grams / 100),
    fat: round1(selectedFoodItem.fatPer100g * grams / 100),
    fiber: selectedFoodItem.fiberPer100g != null ? round1(selectedFoodItem.fiberPer100g * grams / 100) : undefined,
    sugar: selectedFoodItem.sugarPer100g != null ? round1(selectedFoodItem.sugarPer100g * grams / 100) : undefined,
    salt: selectedFoodItem.saltPer100g != null ? round1(selectedFoodItem.saltPer100g * grams / 100) : undefined,
  } : null;

  // Scaled nutrition for recipe
  const scaledRecipe = selectedRecipe ? (() => {
    const factor = servings / selectedRecipe.servings;
    return {
      kcal: Math.round(selectedRecipe.nutrition.kcal * factor),
      protein: round1(selectedRecipe.nutrition.protein * factor),
      carbs: round1(selectedRecipe.nutrition.carbs * factor),
      fat: round1(selectedRecipe.nutrition.fat * factor),
      fiber: selectedRecipe.nutrition.fiber != null ? round1(selectedRecipe.nutrition.fiber * factor) : undefined,
    };
  })() : null;

  function handleAddFoodItem() {
    if (!selectedFoodItem || !calcFood || grams <= 0) return;
    const mealLabel = MEALS.find(m => m.key === meal)?.label ?? meal;
    onAdd({
      meal,
      food: `${selectedFoodItem.brand ? `${selectedFoodItem.brand} ` : ''}${selectedFoodItem.name} (${grams}g)`,
      kcal: calcFood.kcal,
      protein: calcFood.protein,
      carbs: calcFood.carbs,
      fat: calcFood.fat,
      fiber: calcFood.fiber,
      sugar: calcFood.sugar,
      salt: calcFood.salt,
      servingSize: `${grams}g`,
    });
    toast.success(`${selectedFoodItem.name} tilføjet til ${mealLabel}!`);
    onClose();
  }

  function handleAddRecipe() {
    if (!selectedRecipe || !scaledRecipe) return;
    const mealLabel = MEALS.find(m => m.key === meal)?.label ?? meal;
    onAdd({
      meal,
      food: `${selectedRecipe.name}${servings !== 1 ? ` (${servings} port.)` : ''}`,
      kcal: scaledRecipe.kcal,
      protein: scaledRecipe.protein,
      carbs: scaledRecipe.carbs,
      fat: scaledRecipe.fat,
      fiber: scaledRecipe.fiber,
      servingSize: `${servings} portion${servings !== 1 ? 'er' : ''} (opskrift: ${selectedRecipe.servings} port.)`,
    });
    toast.success(`${selectedRecipe.name} tilføjet til ${mealLabel}!`);
    onClose();
  }

  async function handleScanBarcode() {
    try {
      // Dynamic import to avoid breaking web builds where native plugin isn't available
      const { BarcodeScanner } = await import('@capacitor-community/barcode-scanner');
      const permission = await BarcodeScanner.checkPermission({ force: true });
      if (!permission.granted) {
        toast.error('Kamera-tilladelse nødvendig for at scanne');
        return;
      }
      BarcodeScanner.hideBackground();
      document.body.classList.add('scanner-active');
      const result = await BarcodeScanner.startScan();
      BarcodeScanner.showBackground();
      document.body.classList.remove('scanner-active');

      if (result.hasContent) {
        setScanLoading(true);
        const product = await fetchFromOpenFoodFacts(result.content);
        setScanLoading(false);
        if (product) {
          const scannedItem: FoodItem = {
            id: `scan-${result.content}`,
            name: product.name,
            brand: product.brand,
            category: 'Andet',
            kcalPer100g: product.kcalPer100g,
            proteinPer100g: product.proteinPer100g,
            carbsPer100g: product.carbsPer100g,
            fatPer100g: product.fatPer100g,
            fiberPer100g: product.fiberPer100g,
            sugarPer100g: product.sugarPer100g,
            saltPer100g: product.saltPer100g,
            barcode: result.content,
          };
          setSelectedFoodItem(scannedItem);
          setServingGrams('100');
          setPickerTab('fodevarer');
        } else {
          toast.error(`Vare ikke fundet for stregkode ${result.content}`);
        }
      }
    } catch {
      document.body.classList.remove('scanner-active');
      toast.error('Stregkodescanning er ikke tilgængelig på denne enhed');
    }
  }

  const mealLabel = MEALS.find(m => m.key === meal)?.label ?? meal;

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-[#faf9f6] flex flex-col overflow-hidden"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
    >
      {/* ── Header ── */}
      <div className="shrink-0 px-4 pt-[env(safe-area-inset-top,16px)] pb-2 bg-[#faf9f6] border-b border-[#e5e3dc]">
        <div className="flex items-center gap-3 mb-3 pt-2">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f1ed] text-[#2f2f2d] active:scale-[0.92] transition-transform"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <span className="text-[15px] font-semibold text-[#9a978f]">Tilføj til {mealLabel}</span>
        </div>

        {/* Underline tabs */}
        <div className="flex border-b border-[#e5e3dc] mb-3">
          {(['fodevarer', 'opskrifter'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setPickerTab(tab); setSearch(''); setSelectedFoodItem(null); setSelectedRecipe(null); }}
              className={cn(
                'relative flex-1 py-2.5 text-[14px] font-semibold transition-colors',
                pickerTab === tab ? 'text-[#2f2f2d]' : 'text-[#b0ada4]'
              )}
            >
              {tab === 'fodevarer' ? 'Fødevarer' : 'Opskrifter'}
              {pickerTab === tab && (
                <motion.div
                  layoutId="picker-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2f2f2d] rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b0ada4]" />
          <input
            type="text"
            placeholder={pickerTab === 'fodevarer' ? 'Søg fødevare, mærke...' : 'Søg opskrift...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#ecebe5] border-0 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none"
          />
          {search.length > 0 && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0ada4]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category filter row */}
        {pickerTab === 'fodevarer' ? (
          <div className="flex items-center gap-2 pb-1">
            <Select value={foodCategory} onValueChange={v => setFoodCategory(v as typeof foodCategory)}>
              <SelectTrigger className="flex-1 rounded-xl h-9 border-[#e5e3dc] bg-white text-[13px] font-semibold">
                <SelectValue placeholder="Alle kategorier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alle">Alle kategorier</SelectItem>
                {foodCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Barcode scanner button */}
            <button
              onClick={handleScanBarcode}
              disabled={scanLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5e3dc] bg-white text-[#78766d] active:scale-[0.92] transition-transform disabled:opacity-50"
              title="Scan stregkode"
            >
              {scanLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanLine className="h-4 w-4" />
              )}
            </button>
          </div>
        ) : (
          /* Recipe category chips */
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {['Alle', ...recipeCategories].map(cat => (
              <button
                key={cat}
                onClick={() => setRecipeCategory(cat)}
                className={cn(
                  'shrink-0 rounded-2xl px-3.5 py-1.5 text-[12px] font-semibold transition-all',
                  recipeCategory === cat ? 'bg-[#2f2f2d] text-white' : 'bg-[#ecebe5] text-[#78766d]'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto">
        {pickerTab === 'fodevarer' ? (
          /* ── Food items list ── */
          filteredFoodItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-8">
              <Search className="h-10 w-10 text-[#d8d7cf]" />
              <p className="text-[14px] text-[#9a978f]">Ingen fødevarer fundet</p>
              <p className="text-[12px] text-[#b0ada4]">Prøv et andet søgeord eller scan en stregkode</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f2f1ed]">
              {filteredFoodItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedFoodItem(item); setServingGrams('100'); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-[#2f2f2d] truncate">{item.name}</p>
                      {item.brand && (
                        <span className="shrink-0 text-[11px] text-[#9a978f]">{item.brand}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#9a978f] mt-0.5">
                      {item.category} · P {item.proteinPer100g}g · K {item.carbsPer100g}g · F {item.fatPer100g}g per 100g
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[15px] font-black text-[#f58a2d]">{item.kcalPer100g}</p>
                      <p className="text-[10px] text-[#b0ada4]">kcal/100g</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#c0bdb4]" />
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          /* ── Recipes list ── */
          filteredRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-8">
              <ChefHat className="h-10 w-10 text-[#d8d7cf]" />
              <p className="text-[14px] text-[#9a978f]">Ingen opskrifter fundet</p>
              <p className="text-[12px] text-[#b0ada4]">Prøv et andet søgeord eller kategori</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f2f1ed]">
              {filteredRecipes.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => { setSelectedRecipe(recipe); setServings(1); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-[#2f2f2d] truncate">{recipe.name}</p>
                      {recipe.isUserRecipe && (
                        <span className="shrink-0 rounded-full bg-[#fff2e6] text-[#b96424] text-[10px] font-bold px-2 py-0.5">Min</span>
                      )}
                      {recipe.childFriendly && <span className="shrink-0 text-[13px]">👶</span>}
                    </div>
                    <p className="text-[11px] text-[#9a978f] mt-0.5">
                      {recipe.category} · {recipe.servings} port. · P {recipe.nutrition.protein}g · K {recipe.nutrition.carbs}g · F {recipe.nutrition.fat}g
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[15px] font-black text-[#f58a2d]">{recipe.nutrition.kcal}</p>
                      <p className="text-[10px] text-[#b0ada4]">kcal/port.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#c0bdb4]" />
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Food item detail bottom sheet ── */}
      <AnimatePresence>
        {selectedFoodItem && calcFood && (
          <>
            <motion.div
              className="absolute inset-0 bg-black/40 z-10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedFoodItem(null)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom,24px)]"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-[#d8d7cf]" />
              </div>
              <div className="px-4 pb-4 space-y-4">
                {/* Name + close */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[18px] font-black text-[#2f2f2d] leading-tight">{selectedFoodItem.name}</h2>
                    {selectedFoodItem.brand && <p className="text-[12px] text-[#9a978f]">{selectedFoodItem.brand}</p>}
                    <p className="text-[11px] text-[#b0ada4] mt-0.5">{selectedFoodItem.category} · per 100g: {selectedFoodItem.kcalPer100g} kcal</p>
                  </div>
                  <button onClick={() => setSelectedFoodItem(null)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f2f1ed] text-[#78766d] shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Gram input */}
                <div className="rounded-2xl bg-[#f2f1ed] p-3">
                  <p className="text-[12px] font-semibold text-[#78766d] mb-2">Mængde i gram</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setServingGrams(g => String(Math.max(10, (parseFloat(g) || 100) - 50)))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#2f2f2d] shadow-sm active:scale-95 transition-transform"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={servingGrams}
                        onChange={e => setServingGrams(e.target.value)}
                        className="text-[24px] font-black text-[#2f2f2d] text-center bg-transparent border-0 outline-none w-full"
                      />
                      <p className="text-[11px] text-[#9a978f]">gram</p>
                    </div>
                    <button
                      onClick={() => setServingGrams(g => String((parseFloat(g) || 100) + 50))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#2f2f2d] shadow-sm active:scale-95 transition-transform"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Calculated nutrition */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Kcal', value: calcFood.kcal, unit: '', color: '#f58a2d' },
                    { label: 'Protein', value: calcFood.protein, unit: 'g', color: '#3b82f6' },
                    { label: 'Kulh.', value: calcFood.carbs, unit: 'g', color: '#f59e0b' },
                    { label: 'Fedt', value: calcFood.fat, unit: 'g', color: '#ef4444' },
                  ].map(n => (
                    <div key={n.label} className="rounded-xl bg-[#faf9f6] border border-[#e5e3dc] p-2.5 text-center">
                      <p className="text-[16px] font-black leading-tight" style={{ color: n.color }}>{n.value}{n.unit}</p>
                      <p className="text-[10px] text-[#9a978f] mt-0.5">{n.label}</p>
                    </div>
                  ))}
                </div>
                {calcFood.fiber != null && (
                  <p className="text-[11px] text-[#9a978f] -mt-2 px-1">Kostfibre: {calcFood.fiber}g</p>
                )}

                <button
                  disabled={grams <= 0}
                  onClick={handleAddFoodItem}
                  className="w-full rounded-2xl bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  Tilføj til {mealLabel}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Recipe detail bottom sheet ── */}
      <AnimatePresence>
        {selectedRecipe && scaledRecipe && (
          <>
            <motion.div
              className="absolute inset-0 bg-black/40 z-10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedRecipe(null)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom,24px)]"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-[#d8d7cf]" />
              </div>
              <div className="px-4 pb-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[18px] font-black text-[#2f2f2d] leading-tight">{selectedRecipe.name}</h2>
                    <p className="text-[12px] text-[#9a978f] mt-0.5">{selectedRecipe.category} · Opskrift: {selectedRecipe.servings} portioner</p>
                  </div>
                  <button onClick={() => setSelectedRecipe(null)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f2f1ed] text-[#78766d] shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Portion adjuster */}
                <div className="rounded-2xl bg-[#f2f1ed] p-3">
                  <p className="text-[12px] font-semibold text-[#78766d] mb-2">Antal portioner</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setServings(s => Math.max(1, s - 1))} disabled={servings <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#2f2f2d] shadow-sm disabled:opacity-30 active:scale-95 transition-transform">
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <p className="text-[24px] font-black text-[#2f2f2d]">{servings}</p>
                      <p className="text-[11px] text-[#9a978f]">portion{servings !== 1 ? 'er' : ''}</p>
                    </div>
                    <button onClick={() => setServings(s => Math.min(20, s + 1))} disabled={servings >= 20}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#2f2f2d] shadow-sm disabled:opacity-30 active:scale-95 transition-transform">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Kcal', value: scaledRecipe.kcal, unit: '', color: '#f58a2d' },
                    { label: 'Protein', value: scaledRecipe.protein, unit: 'g', color: '#3b82f6' },
                    { label: 'Kulh.', value: scaledRecipe.carbs, unit: 'g', color: '#f59e0b' },
                    { label: 'Fedt', value: scaledRecipe.fat, unit: 'g', color: '#ef4444' },
                  ].map(n => (
                    <div key={n.label} className="rounded-xl bg-[#faf9f6] border border-[#e5e3dc] p-2.5 text-center">
                      <p className="text-[16px] font-black leading-tight" style={{ color: n.color }}>{n.value}{n.unit}</p>
                      <p className="text-[10px] text-[#9a978f] mt-0.5">{n.label}</p>
                    </div>
                  ))}
                </div>
                {scaledRecipe.fiber != null && (
                  <p className="text-[11px] text-[#9a978f] -mt-2 px-1">Kostfibre: {scaledRecipe.fiber}g</p>
                )}

                <button
                  onClick={handleAddRecipe}
                  className="w-full rounded-2xl bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform"
                >
                  Tilføj til {mealLabel}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export function KaloriedagbogView({ onBack }: Props) {
  const {
    currentUser, children, userRecipes,
    mealPlans, mealPlanOverrides,
    addMealPlanOverride,
  } = useAppStore();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [view, setView] = useState<'self' | 'family'>('self');
  const [selectedMemberId, setSelectedMemberId] = useState(currentUser?.id ?? '');
  const [foodLog, setFoodLog] = useState<FoodLogEntry[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [water, setWater] = useState<number>(0);

  // Food picker state
  const [foodPickerOpen, setFoodPickerOpen] = useState(false);
  const [foodPickerMeal, setFoodPickerMeal] = useState('morgenmad');

  // Meal plan replace tracking
  const [replaceTarget, setReplaceTarget] = useState<MealPlan | null>(null);

  // Dialogs
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Family members
  const familyMembers = useMemo(() => [
    { id: currentUser?.id ?? '', name: currentUser?.name ?? 'Mig', isUser: true },
    ...children.map(c => ({ id: c.id, name: c.name, isUser: false })),
  ], [currentUser, children]);

  const activeMemberId = view === 'self' ? (currentUser?.id ?? '') : selectedMemberId;

  const todayEntries = useMemo(() =>
    foodLog.filter(e => e.date === selectedDate && e.memberId === activeMemberId),
    [foodLog, selectedDate, activeMemberId]
  );

  const totals = useMemo(() => ({
    kcal: todayEntries.reduce((s, e) => s + e.kcal, 0),
    protein: todayEntries.reduce((s, e) => s + e.protein, 0),
    carbs: todayEntries.reduce((s, e) => s + e.carbs, 0),
    fat: todayEntries.reduce((s, e) => s + e.fat, 0),
    fiber: todayEntries.reduce((s, e) => s + (e.fiber ?? 0), 0),
    sugar: todayEntries.reduce((s, e) => s + (e.sugar ?? 0), 0),
    salt: todayEntries.reduce((s, e) => s + (e.salt ?? 0), 0),
  }), [todayEntries]);

  // Meal plan suggestions for current date + member (not yet acted on)
  const mealPlanSuggestions = useMemo(() => {
    return mealPlans.filter(mp => mp.date === selectedDate).filter(mp => {
      const override = mealPlanOverrides.find(
        o => o.mealPlanId === mp.id && o.memberId === activeMemberId
      );
      return !override;
    });
  }, [mealPlans, mealPlanOverrides, selectedDate, activeMemberId]);

  const remainingKcal = goals.kcal - totals.kcal;
  const kcalPct = pct(totals.kcal, goals.kcal);
  const kcalColor = kcalPct >= 100 ? '#ef4444' : kcalPct >= 85 ? '#f59e0b' : '#34C759';

  const totalMacroKcal = macroCalories(totals.protein, totals.carbs, totals.fat);
  const proteinPctKcal = totalMacroKcal > 0 ? Math.round((totals.protein * 4 / totalMacroKcal) * 100) : 0;
  const carbsPctKcal = totalMacroKcal > 0 ? Math.round((totals.carbs * 4 / totalMacroKcal) * 100) : 0;
  const fatPctKcal = totalMacroKcal > 0 ? Math.round((totals.fat * 9 / totalMacroKcal) * 100) : 0;

  const selectedEntry = selectedEntryId ? todayEntries.find(e => e.id === selectedEntryId) : null;

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const isYesterday = selectedDate === format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const isTomorrow = selectedDate === format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dateLabel = isToday ? 'I dag' : isYesterday ? 'I går' : isTomorrow ? 'I morgen' : format(new Date(selectedDate), 'd. MMMM', { locale: da });

  function openFoodPicker(mealKey: string) {
    setFoodPickerMeal(mealKey);
    setFoodPickerOpen(true);
  }

  function handleAddFromPicker(entry: Omit<FoodLogEntry, 'id' | 'time' | 'date' | 'memberId'>) {
    const newEntry: FoodLogEntry = {
      id: `food-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...entry,
      time: format(new Date(), 'HH:mm'),
      date: selectedDate,
      memberId: activeMemberId,
    };
    setFoodLog(prev => [...prev, newEntry]);

    // If we were replacing a meal plan, record the override
    if (replaceTarget) {
      addMealPlanOverride({
        id: `ov-${Date.now()}`,
        mealPlanId: replaceTarget.id,
        memberId: activeMemberId,
        date: selectedDate,
        action: 'replaced',
        replacementFood: entry.food,
        replacementKcal: entry.kcal,
        replacementProtein: entry.protein,
        replacementCarbs: entry.carbs,
        replacementFat: entry.fat,
        replacedAt: new Date().toISOString(),
      });
      setReplaceTarget(null);
    }
  }

  function handleAcceptMealPlan(mp: MealPlan) {
    const entry: FoodLogEntry = {
      id: `mp-${mp.id}-${Date.now()}`,
      meal: MEAL_TYPE_MAP[mp.mealType] ?? 'aftensmad',
      food: mp.title,
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      time: format(new Date(), 'HH:mm'),
      date: selectedDate,
      memberId: activeMemberId,
    };
    setFoodLog(prev => [...prev, entry]);
    addMealPlanOverride({
      id: `ov-${Date.now()}`,
      mealPlanId: mp.id,
      memberId: activeMemberId,
      date: selectedDate,
      action: 'accepted',
      replacedAt: new Date().toISOString(),
    });
    toast.success(`${mp.title} logget!`);
  }

  function handleRejectMealPlan(mp: MealPlan) {
    addMealPlanOverride({
      id: `ov-${Date.now()}`,
      mealPlanId: mp.id,
      memberId: activeMemberId,
      date: selectedDate,
      action: 'rejected',
      replacedAt: new Date().toISOString(),
    });
    toast('Madplan afvist');
  }

  function handleReplaceMealPlan(mp: MealPlan, mealKey: string) {
    setReplaceTarget(mp);
    openFoodPicker(mealKey);
  }

  function handleDeleteEntry(id: string) {
    setFoodLog(prev => prev.filter(e => e.id !== id));
    setDetailsOpen(false);
    setSelectedEntryId(null);
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-[#faf9f6] flex flex-col overflow-hidden"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6] border-b border-[#e5e3dc]">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f1ed] text-[#2f2f2d] active:scale-[0.92] transition-transform"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <h1 className="text-[17px] font-bold text-[#2f2f2d]">Kaloriedagbog</h1>
          <button
            onClick={() => setGoalsOpen(true)}
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-[#f2f1ed] text-[#78766d] active:bg-[#e5e3dc]"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-8 space-y-4 max-w-[430px] mx-auto">

            {/* ── View toggle: Mig / Familie ── */}
            {children.length > 0 && (
              <div className="flex rounded-xl border border-[#d8d7cf] bg-[#ecebe5] p-1">
                <button onClick={() => setView('self')} className={cn("flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all", view === 'self' ? "bg-white text-[#2f2f2d] shadow-sm" : "text-[#78766d]")}>
                  <User className="inline h-3.5 w-3.5 mr-1" />Mig
                </button>
                <button onClick={() => setView('family')} className={cn("flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all", view === 'family' ? "bg-white text-[#2f2f2d] shadow-sm" : "text-[#78766d]")}>
                  <Users className="inline h-3.5 w-3.5 mr-1" />Familie
                </button>
              </div>
            )}

            {view === 'family' && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                {familyMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMemberId(m.id)}
                    className={cn(
                      "shrink-0 rounded-2xl border-2 px-4 py-2 text-[13px] font-semibold transition-all",
                      selectedMemberId === m.id
                        ? "border-[#f58a2d] bg-[#fff2e6] text-[#b96424]"
                        : "border-[#e5e3dc] bg-white text-[#78766d]"
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}

            {/* ── Date navigation ── */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e3dc] bg-white text-[#78766d] active:scale-95 transition-transform"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-[15px] font-bold text-[#2f2f2d]">{dateLabel}</p>
                {!isToday && <p className="text-[11px] text-[#9a978f]">{format(new Date(selectedDate), 'EEEE d. MMMM', { locale: da })}</p>}
              </div>
              {/* Future dates enabled */}
              <button
                onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e3dc] bg-white text-[#78766d] active:scale-95 transition-transform"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* ── Kalorie-overblik ── */}
            <button
              onClick={() => { setSelectedEntryId(null); setDetailsOpen(true); }}
              className="w-full rounded-2xl bg-white border border-[#e5e3dc] p-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9a978f]">Kalorier</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-[32px] font-black text-[#2f2f2d] leading-none">{totals.kcal}</span>
                    <span className="text-[13px] text-[#9a978f]">/ {goals.kcal} kcal</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#9a978f]">{remainingKcal >= 0 ? 'Tilbage' : 'Over mål'}</p>
                  <p className={cn("text-[22px] font-black leading-none mt-0.5", remainingKcal < 0 ? "text-red-500" : "text-[#34C759]")}>
                    {remainingKcal < 0 ? `+${Math.abs(remainingKcal)}` : remainingKcal}
                  </p>
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-[#f2f1ed] overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: kcalColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${kcalPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Protein', value: totals.protein, goal: goals.protein, color: '#3b82f6', unit: 'g' },
                  { label: 'Kulhydrat', value: totals.carbs, goal: goals.carbs, color: '#f59e0b', unit: 'g' },
                  { label: 'Fedt', value: totals.fat, goal: goals.fat, color: '#ef4444', unit: 'g' },
                ].map(m => (
                  <div key={m.label} className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <MacroRing value={m.value} goal={m.goal} color={m.color} size={56} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-[#2f2f2d]">{Math.round(m.value)}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#78766d]">{m.label}</p>
                    <p className="text-[10px] text-[#b0ada4]">{Math.round(m.value)}/{m.goal}{m.unit}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-3 justify-end">
                <Info className="h-3 w-3 text-[#b0ada4]" />
                <p className="text-[11px] text-[#b0ada4]">Tryk for fuld ernæringsdetaljer</p>
              </div>
            </button>

            {/* ── Vand ── */}
            <div className="rounded-2xl bg-white border border-[#e5e3dc] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-[#3b82f6]" />
                  <p className="text-[14px] font-semibold text-[#2f2f2d]">Vand</p>
                </div>
                <p className="text-[13px] font-bold text-[#2f2f2d]">{water} / {goals.water} ml</p>
              </div>
              <div className="h-2 w-full rounded-full bg-[#f2f1ed] overflow-hidden mb-3">
                <div className="h-full rounded-full bg-[#3b82f6] transition-all duration-500" style={{ width: `${pct(water, goals.water)}%` }} />
              </div>
              <div className="flex gap-2">
                {[150, 250, 350, 500].map(ml => (
                  <button
                    key={ml}
                    onClick={() => { setWater(prev => Math.min(prev + ml, 5000)); toast.success(`+${ml} ml vand`); }}
                    className="flex-1 rounded-xl bg-[#eff6ff] py-2 text-[12px] font-semibold text-[#3b82f6] active:scale-95 transition-transform"
                  >
                    +{ml >= 1000 ? `${ml / 1000}L` : `${ml}`}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Måltider ── */}
            <div className="space-y-3">
              {MEALS.map(meal => {
                const entries = todayEntries.filter(e => e.meal === meal.key);
                const mealKcal = entries.reduce((s, e) => s + e.kcal, 0);
                const suggestions = mealPlanSuggestions.filter(mp => MEAL_TYPE_MAP[mp.mealType] === meal.key);
                return (
                  <div key={meal.key} className="rounded-2xl bg-white border border-[#e5e3dc] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: meal.color + '30' }}>
                          {meal.emoji}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-[#2f2f2d]">{meal.label}</p>
                          <p className="text-[12px] text-[#9a978f]">{mealKcal > 0 ? `${mealKcal} kcal` : 'Ingen mad logget'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openFoodPicker(meal.key)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f2f1ed] text-[#78766d] active:bg-[#e5e3dc]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Meal plan suggestions for this meal */}
                    {suggestions.length > 0 && (
                      <div className="border-t border-[#f9f8f5]">
                        {suggestions.map(mp => (
                          <div key={mp.id} className="flex items-center gap-2 px-4 py-2.5 bg-[#fffbf5]">
                            <CalendarDays className="h-4 w-4 text-[#f58a2d] shrink-0" />
                            <p className="flex-1 text-[13px] font-medium text-[#7a4915] truncate">{mp.title}</p>
                            <span className="text-[10px] text-[#c0a080] font-bold uppercase shrink-0">Planlagt</span>
                            <button
                              onClick={() => handleAcceptMealPlan(mp)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#22c55e] active:scale-90 transition-transform"
                              title="Accepter"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReplaceMealPlan(mp, meal.key)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#f58a2d] active:scale-90 transition-transform"
                              title="Erstat"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectMealPlan(mp)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#b0ada4] active:scale-90 transition-transform"
                              title="Afvis"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {entries.length > 0 && (
                      <div className="border-t border-[#f2f1ed]">
                        {entries.map(entry => (
                          <button
                            key={entry.id}
                            onClick={() => { setSelectedEntryId(entry.id); setDetailsOpen(true); }}
                            className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-[#faf9f6] transition-colors border-b border-[#f9f8f5] last:border-0"
                          >
                            <div className="text-left min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-[#2f2f2d] truncate">{entry.food}</p>
                              <p className="text-[11px] text-[#9a978f]">
                                P {entry.protein}g · K {entry.carbs}g · F {entry.fat}g
                                {entry.time && ` · ${entry.time}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <span className="text-[13px] font-bold text-[#2f2f2d]">{entry.kcal}</span>
                              <span className="text-[11px] text-[#9a978f]">kcal</span>
                              <ChevronRight className="h-3.5 w-3.5 text-[#c0bdb4]" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Kalorie-fordeling ── */}
            {todayEntries.length > 0 && (
              <div className="rounded-2xl bg-white border border-[#e5e3dc] p-4 space-y-3">
                <p className="text-[13px] font-bold text-[#2f2f2d]">Fordeling af kalorier</p>
                <div className="h-4 w-full rounded-full overflow-hidden flex">
                  {totalMacroKcal > 0 && <>
                    <div className="h-full bg-[#3b82f6]" style={{ width: `${proteinPctKcal}%` }} />
                    <div className="h-full bg-[#f59e0b]" style={{ width: `${carbsPctKcal}%` }} />
                    <div className="h-full bg-[#ef4444]" style={{ width: `${fatPctKcal}%` }} />
                  </>}
                  {totalMacroKcal === 0 && <div className="h-full w-full bg-[#f2f1ed]" />}
                </div>
                <div className="flex justify-between">
                  {[
                    { label: 'Protein', pct: proteinPctKcal, color: 'bg-[#3b82f6]' },
                    { label: 'Kulhydrat', pct: carbsPctKcal, color: 'bg-[#f59e0b]' },
                    { label: 'Fedt', pct: fatPctKcal, color: 'bg-[#ef4444]' },
                  ].map(m => (
                    <div key={m.label} className="flex items-center gap-1.5">
                      <div className={cn("h-2.5 w-2.5 rounded-full", m.color)} />
                      <span className="text-[11px] text-[#78766d]">{m.label} {m.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── DIALOG: Ernæringsdetaljer ── */}
        <BottomSheet open={detailsOpen} onOpenChange={v => { setDetailsOpen(v); if (!v) setSelectedEntryId(null); }} title={selectedEntry ? selectedEntry.food : 'Ernæringsdetaljer'}>

            {selectedEntry ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#faf9f6] p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Kalorier', value: `${selectedEntry.kcal} kcal`, color: '#f58a2d', icon: Flame },
                      { label: 'Protein', value: `${selectedEntry.protein} g`, color: '#3b82f6', icon: Dumbbell },
                      { label: 'Kulhydrat', value: `${selectedEntry.carbs} g`, color: '#f59e0b', icon: Wheat },
                      { label: 'Fedt', value: `${selectedEntry.fat} g`, color: '#ef4444', icon: Droplets },
                    ].map(n => (
                      <div key={n.label} className="rounded-xl bg-white border border-[#e5e3dc] p-3 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: n.color + '20' }}>
                          <n.icon className="h-4 w-4" style={{ color: n.color }} />
                        </div>
                        <div>
                          <p className="text-[11px] text-[#9a978f]">{n.label}</p>
                          <p className="text-[14px] font-bold text-[#2f2f2d]">{n.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(selectedEntry.fiber || selectedEntry.sugar || selectedEntry.salt) && (
                    <div className="rounded-xl bg-white border border-[#e5e3dc] p-3 space-y-2">
                      <p className="text-[12px] font-semibold text-[#78766d]">Yderligere næring</p>
                      {selectedEntry.fiber != null && <div className="flex justify-between"><span className="text-[13px] text-[#78766d]">Kostfibre</span><span className="text-[13px] font-semibold text-[#2f2f2d]">{selectedEntry.fiber} g</span></div>}
                      {selectedEntry.sugar != null && <div className="flex justify-between"><span className="text-[13px] text-[#78766d]">Sukker</span><span className="text-[13px] font-semibold text-[#2f2f2d]">{selectedEntry.sugar} g</span></div>}
                      {selectedEntry.salt != null && <div className="flex justify-between"><span className="text-[13px] text-[#78766d]">Salt</span><span className="text-[13px] font-semibold text-[#2f2f2d]">{selectedEntry.salt} g</span></div>}
                    </div>
                  )}
                  {selectedEntry.servingSize && (
                    <p className="text-[12px] text-[#9a978f]">Portionsstørrelse: {selectedEntry.servingSize}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteEntry(selectedEntry.id)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-red-100 bg-red-50 py-3 text-[14px] font-semibold text-red-500 active:scale-[0.98] transition-transform"
                >
                  <Trash2 className="h-4 w-4" />
                  Slet indlæg
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#faf9f6] p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[13px] font-semibold text-[#78766d]">Kalorier i dag</p>
                    <p className="text-[13px] text-[#9a978f]">{dateLabel}</p>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-[36px] font-black text-[#2f2f2d] leading-none">{totals.kcal}</span>
                    <div>
                      <p className="text-[12px] text-[#9a978f]">af {goals.kcal} kcal mål</p>
                      <p className={cn("text-[13px] font-bold", remainingKcal < 0 ? "text-red-500" : "text-[#34C759]")}>
                        {remainingKcal < 0 ? `${Math.abs(remainingKcal)} kcal over mål` : `${remainingKcal} kcal tilbage`}
                      </p>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#e5e3dc] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${kcalPct}%`, backgroundColor: kcalColor }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[13px] font-bold text-[#2f2f2d] px-1">Makronæring</p>
                  {[
                    { label: 'Protein', value: totals.protein, goal: goals.protein, color: '#3b82f6', icon: Dumbbell, kcalPer: 4, recommended: '15–25% af kalorier' },
                    { label: 'Kulhydrat', value: totals.carbs, goal: goals.carbs, color: '#f59e0b', icon: Wheat, kcalPer: 4, recommended: '45–65% af kalorier' },
                    { label: 'Fedt', value: totals.fat, goal: goals.fat, color: '#ef4444', icon: Droplets, kcalPer: 9, recommended: '20–35% af kalorier' },
                    { label: 'Kostfibre', value: totals.fiber, goal: goals.fiber, color: '#22c55e', icon: Flame, kcalPer: 0, recommended: 'Min. 25–30g dagligt' },
                  ].map(m => (
                    <div key={m.label} className="rounded-2xl bg-white border border-[#e5e3dc] p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: m.color + '20' }}>
                            <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                          </div>
                          <p className="text-[13px] font-semibold text-[#2f2f2d]">{m.label}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-bold text-[#2f2f2d]">{Math.round(m.value)} / {m.goal}g</p>
                          {m.kcalPer > 0 && <p className="text-[10px] text-[#9a978f]">{Math.round(m.value * m.kcalPer)} kcal</p>}
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#f2f1ed] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct(m.value, m.goal)}%`, backgroundColor: m.color }} />
                      </div>
                      <p className="text-[10px] text-[#b0ada4] mt-1">{m.recommended}</p>
                    </div>
                  ))}
                </div>

                {(totals.sugar > 0 || totals.salt > 0) && (
                  <div className="rounded-2xl bg-white border border-[#e5e3dc] p-4 space-y-2">
                    <p className="text-[13px] font-bold text-[#2f2f2d]">Øvrig ernæring</p>
                    {totals.sugar > 0 && (
                      <div className="flex justify-between items-center">
                        <div><p className="text-[13px] text-[#2f2f2d]">Sukker</p><p className="text-[11px] text-[#9a978f]">Max anbefalet: 50g/dag</p></div>
                        <div className="text-right">
                          <p className="text-[14px] font-bold text-[#2f2f2d]">{Math.round(totals.sugar)} g</p>
                          {totals.sugar > 50 && <p className="text-[10px] text-red-400 font-semibold">Over anbefalet</p>}
                        </div>
                      </div>
                    )}
                    {totals.salt > 0 && (
                      <div className="flex justify-between items-center">
                        <div><p className="text-[13px] text-[#2f2f2d]">Salt</p><p className="text-[11px] text-[#9a978f]">Max anbefalet: 6g/dag</p></div>
                        <div className="text-right">
                          <p className="text-[14px] font-bold text-[#2f2f2d]">{Math.round(totals.salt * 10) / 10} g</p>
                          {totals.salt > 6 && <p className="text-[10px] text-red-400 font-semibold">Over anbefalet</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-2xl bg-white border border-[#e5e3dc] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-[#3b82f6]" /><p className="text-[13px] font-semibold text-[#2f2f2d]">Vandindtag</p></div>
                    <p className="text-[13px] font-bold text-[#2f2f2d]">{water} / {goals.water} ml</p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#f2f1ed] overflow-hidden">
                    <div className="h-full rounded-full bg-[#3b82f6] transition-all" style={{ width: `${pct(water, goals.water)}%` }} />
                  </div>
                  <p className="text-[10px] text-[#b0ada4] mt-1">Anbefalet: mindst 2 liter dagligt (ca. 8 glas)</p>
                </div>

                {todayEntries.length > 0 && (
                  <div className="rounded-2xl bg-white border border-[#e5e3dc] p-4 space-y-2">
                    <p className="text-[13px] font-bold text-[#2f2f2d]">Kalorier pr. måltid</p>
                    {MEALS.map(meal => {
                      const entries = todayEntries.filter(e => e.meal === meal.key);
                      if (entries.length === 0) return null;
                      const mKcal = entries.reduce((s, e) => s + e.kcal, 0);
                      return (
                        <div key={meal.key} className="flex items-center gap-3">
                          <span className="text-base w-6">{meal.emoji}</span>
                          <div className="flex-1">
                            <div className="flex justify-between mb-0.5">
                              <p className="text-[12px] text-[#78766d]">{meal.label}</p>
                              <p className="text-[12px] font-semibold text-[#2f2f2d]">{mKcal} kcal</p>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[#f2f1ed] overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct(mKcal, totals.kcal)}%`, backgroundColor: meal.color }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
        </BottomSheet>

      </motion.div>

      {/* ── Food Picker overlay (z-60) ── */}
      <AnimatePresence>
        {foodPickerOpen && (
          <FoodPickerView
            meal={foodPickerMeal}
            userRecipes={userRecipes}
            onClose={() => { setFoodPickerOpen(false); setReplaceTarget(null); }}
            onAdd={handleAddFromPicker}
          />
        )}
      </AnimatePresence>

      {/* ── Goals full-screen page (z-70) ── */}
      <AnimatePresence>
        {goalsOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex flex-col bg-[#faf9f6]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6] border-b border-[#e5e3dc]">
              <button
                onClick={() => setGoalsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f1ed] text-[#2f2f2d] active:scale-[0.92] transition-transform"
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </button>
              <h1 className="text-[17px] font-bold text-[#2f2f2d]">Daglige mål</h1>
              <div className="w-9" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-4 max-w-[430px] mx-auto w-full">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-5 w-5 text-[#f58a2d]" />
                <p className="text-[15px] font-semibold text-[#2f2f2d]">Ernæringsmål</p>
              </div>
              <p className="text-[13px] text-[#78766d]">Tilpas dine daglige ernæringsmål. Standardværdierne er baseret på generelle anbefalinger for voksne.</p>
              <div className="space-y-3">
                {[
                  { key: 'kcal', label: 'Kalorier', unit: 'kcal', hint: 'Typisk 1800–2500 for voksne' },
                  { key: 'protein', label: 'Protein', unit: 'g', hint: '0.8–1.2g pr. kg kropsvægt' },
                  { key: 'carbs', label: 'Kulhydrat', unit: 'g', hint: '45–65% af daglige kalorier' },
                  { key: 'fat', label: 'Fedt', unit: 'g', hint: '20–35% af daglige kalorier' },
                  { key: 'fiber', label: 'Kostfibre', unit: 'g', hint: 'Min. 25–30g dagligt' },
                  { key: 'water', label: 'Vand', unit: 'ml', hint: 'Min. 2000 ml (8 glas)' },
                ].map(f => (
                  <div key={f.key} className="rounded-2xl bg-white border border-[#e5e3dc] p-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-[14px] font-medium text-[#2f2f2d]">{f.label}</Label>
                      <span className="text-[11px] text-[#9a978f]">{f.hint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={goals[f.key as keyof NutritionGoals]}
                        onChange={e => setGoals(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                        className="flex-1 rounded-xl border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-[#faf9f6]"
                      />
                      <span className="text-[13px] text-[#78766d] w-8">{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setGoals(DEFAULT_GOALS)}
                  className="flex-1 rounded-2xl border-2 border-[#e5e3dc] py-3 text-[14px] font-semibold text-[#78766d] active:scale-[0.98] transition-transform"
                >
                  Nulstil
                </button>
                <button
                  onClick={() => { setGoalsOpen(false); toast.success('Mål gemt!'); }}
                  className="flex-1 rounded-2xl bg-[#f58a2d] py-3 text-[14px] font-bold text-white active:scale-[0.98] transition-transform"
                >
                  Gem mål
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
