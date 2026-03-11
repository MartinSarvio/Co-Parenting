import { useState, useMemo, useEffect } from 'react';
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
  ChevronDown,
  X,
  Info,
  Flame,
  Droplets,
  Dumbbell,
  Wheat,
  Search,
  ChefHat,
  Minus,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  ScanLine,
  Loader2,
  Pencil,
  Check,
  Eye,
  PieChart,
  UtensilsCrossed,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchFromOpenFoodFacts, startBarcodeScanner, searchProducts, type OFFResult } from '@/lib/openFoodFacts';
import { useAppStore } from '@/store';
import { BottomSheet } from '@/components/custom/BottomSheet';
import { Label } from '@/components/ui/label';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { toast } from 'sonner';
import { recipes, recipeCategories } from '@/data/recipes';
import { FOOD_ITEMS, foodCategories } from '@/data/foodItems';
import type { FoodItem, FoodCategory } from '@/data/foodItems';
import type { Recipe, MealPlan, MemberDisplayPrefs } from '@/types';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { NutriScoreBadge } from '@/components/custom/NutriScoreBadge';
import { allergenTagToLabel } from '@/lib/allergenMatch';

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

type CustomMeal = { key: string; label: string; emoji: string; color: string };

const DEFAULT_MEALS: CustomMeal[] = [
  { key: 'morgenmad',      label: 'Morgenmad',         emoji: '☀️',  color: '#FFB347' },
  { key: 'mellemmaltid1',  label: 'Mellemmåltid',       emoji: '🍎',  color: '#87CEEB' },
  { key: 'frokost',        label: 'Frokost',            emoji: '🥗',  color: '#90EE90' },
  { key: 'mellemmaltid2',  label: 'Eftermiddagssnack',  emoji: '🍌',  color: '#DDA0DD' },
  { key: 'aftensmad',      label: 'Aftensmad',          emoji: '🍽️', color: '#F08080' },
  { key: 'snack',          label: 'Aftensnack',         emoji: '🌙',  color: '#B0C4DE' },
];

const MEAL_COLORS = ['#FFB347', '#87CEEB', '#90EE90', '#DDA0DD', '#F08080', '#B0C4DE', '#FFA07A', '#98D8C8'];

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

// ── TDEE / BMR Calculator (Mifflin-St Jeor) ──────────────────────────────

function calculateTDEE(gender: 'male' | 'female', age: number, height: number, weight: number, activity: number): number {
  const bmr = gender === 'male'
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;
  return Math.round(bmr * activity);
}

const ACTIVITY_LEVELS = [
  { value: 1.2,   label: 'Stillesiddende', desc: 'Kontor, lidt bevægelse' },
  { value: 1.375, label: 'Let aktiv', desc: '1-3 dage motion/uge' },
  { value: 1.55,  label: 'Moderat aktiv', desc: '3-5 dage motion/uge' },
  { value: 1.725, label: 'Meget aktiv', desc: '6-7 dage motion/uge' },
  { value: 1.9,   label: 'Ekstremt aktiv', desc: 'Fysisk arbejde + træning' },
];

// ── Display format helpers ────────────────────────────────────────────────

function toFraction(value: number): string {
  if (value <= 0) return '0';
  const whole = Math.floor(value);
  const remainder = value - whole;
  if (remainder < 0.0625) return whole.toString();
  const fractions: [number, string][] = [
    [1/8, '⅛'], [1/4, '¼'], [1/3, '⅓'], [3/8, '⅜'],
    [1/2, '½'], [5/8, '⅝'], [2/3, '⅔'], [3/4, '¾'], [7/8, '⅞'],
  ];
  let closest = fractions[0];
  let minDiff = Math.abs(remainder - fractions[0][0]);
  for (const f of fractions) {
    const diff = Math.abs(remainder - f[0]);
    if (diff < minDiff) { minDiff = diff; closest = f; }
  }
  return whole > 0 ? `${whole} ${closest[1]}` : closest[1];
}

function formatNutrition(
  value: number, goal: number, unit: string,
  displayFmt: 'absolute' | 'percent',
  numFmt: 'decimal' | 'fraction'
): string {
  if (displayFmt === 'percent') {
    const p = goal > 0 ? (value / goal) * 100 : 0;
    return `${Math.round(p)}%`;
  }
  if (numFmt === 'fraction') return `${toFraction(round1(value))}${unit}`;
  return `${Math.round(value)}${unit}`;
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
  meals: CustomMeal[];
  userRecipes: Recipe[];
  onClose: () => void;
  onAdd: (entry: Omit<FoodLogEntry, 'id' | 'time' | 'date' | 'memberId'>) => void;
}

function FoodPickerView({ meal, meals, userRecipes, onClose, onAdd }: FoodPickerProps) {
  const [pickerTab, setPickerTab] = useState<'fodevarer' | 'opskrifter' | 'produkter'>('fodevarer');
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

  // DB product search state
  const [dbProducts, setDbProducts] = useState<OFFResult[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [selectedDbProduct, setSelectedDbProduct] = useState<OFFResult | null>(null);
  const [dbServingGrams, setDbServingGrams] = useState('100');

  // Debounced OFF product search
  useEffect(() => {
    if (pickerTab !== 'produkter' || search.length < 2) {
      setDbProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setDbLoading(true);
      const { products } = await searchProducts(search, 1, 20);
      setDbProducts(products);
      setDbLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pickerTab]);

  // Quick add state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddMeal, setQuickAddMeal] = useState(meal);
  const [quickAddKcal, setQuickAddKcal] = useState('');
  const [quickAddFat, setQuickAddFat] = useState('');
  const [quickAddCarbs, setQuickAddCarbs] = useState('');
  const [quickAddProtein, setQuickAddProtein] = useState('');
  const [quickAddName, setQuickAddName] = useState('');

  function handleQuickAdd() {
    if (!quickAddKcal && !quickAddName) return;
    const qMealLabel = meals.find(m => m.key === quickAddMeal)?.label ?? quickAddMeal;
    onAdd({
      meal: quickAddMeal,
      food: quickAddName || `Hurtig tilføjelse (${qMealLabel})`,
      kcal: parseInt(quickAddKcal) || 0,
      protein: parseFloat(quickAddProtein) || 0,
      carbs: parseFloat(quickAddCarbs) || 0,
      fat: parseFloat(quickAddFat) || 0,
    });
    toast.success('Hurtig tilføjelse gemt!');
    onClose();
  }

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
    const mealLabel = meals.find(m => m.key === meal)?.label ?? meal;
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
    const mealLabel = meals.find(m => m.key === meal)?.label ?? meal;
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
    const barcode = await startBarcodeScanner();
    if (!barcode) return;
    setScanLoading(true);
    const product = await fetchFromOpenFoodFacts(barcode);
    setScanLoading(false);
    if (product) {
      const scannedItem: FoodItem = {
        id: `scan-${barcode}`,
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
        barcode,
      };
      setSelectedFoodItem(scannedItem);
      setServingGrams('100');
      setPickerTab('fodevarer');
    } else {
      toast.error(`Vare ikke fundet for stregkode ${barcode}`);
      setQuickAddOpen(true);
      setQuickAddName('');
    }
  }

  // DB product calculated nutrition
  const dbGrams = Math.max(0, parseFloat(dbServingGrams) || 0);
  const calcDbProduct = selectedDbProduct ? {
    kcal: Math.round(selectedDbProduct.kcalPer100g * dbGrams / 100),
    protein: round1(selectedDbProduct.proteinPer100g * dbGrams / 100),
    carbs: round1(selectedDbProduct.carbsPer100g * dbGrams / 100),
    fat: round1(selectedDbProduct.fatPer100g * dbGrams / 100),
    fiber: selectedDbProduct.fiberPer100g != null ? round1(selectedDbProduct.fiberPer100g * dbGrams / 100) : undefined,
    sugar: selectedDbProduct.sugarPer100g != null ? round1(selectedDbProduct.sugarPer100g * dbGrams / 100) : undefined,
    salt: selectedDbProduct.saltPer100g != null ? round1(selectedDbProduct.saltPer100g * dbGrams / 100) : undefined,
  } : null;

  function handleAddDbProduct() {
    if (!selectedDbProduct || !calcDbProduct || dbGrams <= 0) return;
    onAdd({
      meal,
      food: `${selectedDbProduct.name}${selectedDbProduct.brand ? ` (${selectedDbProduct.brand})` : ''} (${dbGrams}g)`,
      kcal: calcDbProduct.kcal,
      protein: calcDbProduct.protein,
      carbs: calcDbProduct.carbs,
      fat: calcDbProduct.fat,
      fiber: calcDbProduct.fiber,
      sugar: calcDbProduct.sugar,
      salt: calcDbProduct.salt,
      servingSize: `${dbGrams}g`,
    });
    toast.success(`${selectedDbProduct.name} tilføjet!`);
    onClose();
  }

  const mealLabel = meals.find(m => m.key === meal)?.label ?? meal;

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
            className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] active:scale-[0.92] transition-transform"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <span className="flex-1 text-[15px] font-semibold text-[#9a978f]">Tilføj til {mealLabel}</span>
          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#f58a2d] active:scale-[0.92] transition-transform"
            aria-label="Hurtig tilføjelse"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Underline tabs */}
        <div className="flex border-b border-[#e5e3dc] mb-3">
          {(['fodevarer', 'opskrifter', 'produkter'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setPickerTab(tab); setSearch(''); setSelectedFoodItem(null); setSelectedRecipe(null); setSelectedDbProduct(null); }}
              className={cn(
                'relative flex-1 py-2.5 text-[14px] font-semibold transition-colors',
                pickerTab === tab ? 'text-[#2f2f2d]' : 'text-[#b0ada4]'
              )}
            >
              {tab === 'fodevarer' ? 'Fødevarer' : tab === 'opskrifter' ? 'Opskrifter' : (
                <span className="inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" />Produkter</span>
              )}
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
            placeholder={pickerTab === 'fodevarer' ? 'Søg fødevare, mærke...' : pickerTab === 'opskrifter' ? 'Søg opskrift...' : 'Søg i produktdatabasen...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-[8px] bg-[#ecebe5] border-0 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none"
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
            <SelectSheet
              value={foodCategory}
              onValueChange={v => setFoodCategory(v as typeof foodCategory)}
              title="Kategori"
              placeholder="Alle kategorier"
              options={[{ value: 'Alle', label: 'Alle kategorier' }, ...foodCategories.map(cat => ({ value: cat, label: cat }))]}
              className="flex-1 rounded-[8px] h-9 border-[#e5e3dc] bg-white text-[13px] font-semibold"
            />

            {/* Barcode scanner button */}
            <button
              onClick={handleScanBarcode}
              disabled={scanLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#e5e3dc] bg-white text-[#78766d] active:scale-[0.92] transition-transform disabled:opacity-50"
              title="Scan stregkode"
            >
              {scanLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanLine className="h-4 w-4" />
              )}
            </button>
          </div>
        ) : pickerTab === 'opskrifter' ? (
          /* Recipe category chips */
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {['Alle', ...recipeCategories].map(cat => (
              <button
                key={cat}
                onClick={() => setRecipeCategory(cat)}
                className={cn(
                  'shrink-0 rounded-[8px] px-3.5 py-1.5 text-[12px] font-semibold transition-all',
                  recipeCategory === cat ? 'bg-[#2f2f2d] text-white' : 'bg-[#ecebe5] text-[#78766d]'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : null}
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
        ) : pickerTab === 'produkter' ? (
          /* ── DB Products list ── */
          search.length < 2 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-8">
              <Database className="h-10 w-10 text-[#d8d7cf]" />
              <p className="text-[14px] text-[#9a978f]">Søg i produktdatabasen</p>
              <p className="text-[12px] text-[#b0ada4]">Indtast mindst 2 tegn for at søge blandt tusindvis af produkter</p>
            </div>
          ) : dbLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="h-8 w-8 text-[#b0ada4] animate-spin" />
              <p className="text-[13px] text-[#9a978f]">Søger...</p>
            </div>
          ) : dbProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-8">
              <Search className="h-10 w-10 text-[#d8d7cf]" />
              <p className="text-[14px] text-[#9a978f]">Ingen produkter fundet</p>
              <p className="text-[12px] text-[#b0ada4]">Prøv et andet søgeord</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f2f1ed]">
              {dbProducts.map((product, idx) => (
                <button
                  key={product.barcode ?? idx}
                  onClick={() => { setSelectedDbProduct(product); setDbServingGrams('100'); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-[#2f2f2d] truncate">{product.name}</p>
                      {product.nutriscoreGrade && (
                        <NutriScoreBadge grade={product.nutriscoreGrade} size="sm" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#9a978f] mt-0.5">
                      {product.brand ?? 'Ukendt mærke'} · P {product.proteinPer100g.toFixed(1)}g · K {product.carbsPer100g.toFixed(1)}g · F {product.fatPer100g.toFixed(1)}g per 100g
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[15px] font-black text-[#f58a2d]">{Math.round(product.kcalPer100g)}</p>
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
                {/* Name */}
                <div className="text-center">
                  <h2 className="text-[18px] font-black text-[#2f2f2d] leading-tight">{selectedFoodItem.name}</h2>
                  {selectedFoodItem.brand && <p className="text-[12px] text-[#9a978f]">{selectedFoodItem.brand}</p>}
                  <p className="text-[11px] text-[#b0ada4] mt-0.5">{selectedFoodItem.category} · per 100g: {selectedFoodItem.kcalPer100g} kcal</p>
                </div>

                {/* Gram input */}
                <div className="rounded-[8px] bg-[#f2f1ed] p-3">
                  <p className="text-[12px] font-semibold text-[#78766d] mb-2">Mængde i gram</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setServingGrams(g => String(Math.max(10, (parseFloat(g) || 100) - 50)))}
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white text-[#2f2f2d] shadow-sm active:scale-95 transition-transform"
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
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white text-[#2f2f2d] shadow-sm active:scale-95 transition-transform"
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
                    <div key={n.label} className="rounded-[8px] bg-[#faf9f6] border border-[#e5e3dc] p-2.5 text-center">
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
                  className="w-full rounded-[8px] bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
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
                <div className="text-center">
                  <h2 className="text-[18px] font-black text-[#2f2f2d] leading-tight">{selectedRecipe.name}</h2>
                  <p className="text-[12px] text-[#9a978f] mt-0.5">{selectedRecipe.category} · Opskrift: {selectedRecipe.servings} portioner</p>
                </div>

                {/* Portion adjuster */}
                <div className="rounded-[8px] bg-[#f2f1ed] p-3">
                  <p className="text-[12px] font-semibold text-[#78766d] mb-2">Antal portioner</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setServings(s => Math.max(1, s - 1))} disabled={servings <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white text-[#2f2f2d] shadow-sm disabled:opacity-30 active:scale-95 transition-transform">
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <p className="text-[24px] font-black text-[#2f2f2d]">{servings}</p>
                      <p className="text-[11px] text-[#9a978f]">portion{servings !== 1 ? 'er' : ''}</p>
                    </div>
                    <button onClick={() => setServings(s => Math.min(20, s + 1))} disabled={servings >= 20}
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white text-[#2f2f2d] shadow-sm disabled:opacity-30 active:scale-95 transition-transform">
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
                    <div key={n.label} className="rounded-[8px] bg-[#faf9f6] border border-[#e5e3dc] p-2.5 text-center">
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
                  className="w-full rounded-[8px] bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform"
                >
                  Tilføj til {mealLabel}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DB Product detail bottom sheet ── */}
      <AnimatePresence>
        {selectedDbProduct && calcDbProduct && (
          <>
            <motion.div
              className="absolute inset-0 bg-black/40 z-10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDbProduct(null)}
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
                {/* Name + badges */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-[18px] font-black text-[#2f2f2d] leading-tight">{selectedDbProduct.name}</h2>
                    {selectedDbProduct.nutriscoreGrade && (
                      <NutriScoreBadge grade={selectedDbProduct.nutriscoreGrade} size="md" />
                    )}
                  </div>
                  {selectedDbProduct.brand && <p className="text-[12px] text-[#9a978f]">{selectedDbProduct.brand}</p>}
                  <p className="text-[11px] text-[#b0ada4] mt-0.5">per 100g: {Math.round(selectedDbProduct.kcalPer100g)} kcal</p>
                </div>

                {/* Allergen pills */}
                {selectedDbProduct.allergens && selectedDbProduct.allergens.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {selectedDbProduct.allergens.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-[#e8e7e0] px-2 py-0.5 text-[10px] font-semibold text-[#78766d]"
                      >
                        {allergenTagToLabel(tag)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Gram input */}
                <div className="rounded-[8px] bg-[#f2f1ed] p-3">
                  <p className="text-[12px] font-semibold text-[#78766d] mb-2">Mængde i gram</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setDbServingGrams(g => String(Math.max(10, (parseFloat(g) || 100) - 50)))}
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white text-[#2f2f2d] shadow-sm active:scale-95 transition-transform"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={dbServingGrams}
                        onChange={e => setDbServingGrams(e.target.value)}
                        className="text-[24px] font-black text-[#2f2f2d] text-center bg-transparent border-0 outline-none w-full"
                      />
                      <p className="text-[11px] text-[#9a978f]">gram</p>
                    </div>
                    <button
                      onClick={() => setDbServingGrams(g => String((parseFloat(g) || 100) + 50))}
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white text-[#2f2f2d] shadow-sm active:scale-95 transition-transform"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Calculated nutrition */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Kcal', value: calcDbProduct.kcal, unit: '', color: '#f58a2d' },
                    { label: 'Protein', value: calcDbProduct.protein, unit: 'g', color: '#3b82f6' },
                    { label: 'Kulh.', value: calcDbProduct.carbs, unit: 'g', color: '#f59e0b' },
                    { label: 'Fedt', value: calcDbProduct.fat, unit: 'g', color: '#ef4444' },
                  ].map(n => (
                    <div key={n.label} className="rounded-[8px] bg-[#faf9f6] border border-[#e5e3dc] p-2.5 text-center">
                      <p className="text-[16px] font-black leading-tight" style={{ color: n.color }}>{n.value}{n.unit}</p>
                      <p className="text-[10px] text-[#9a978f] mt-0.5">{n.label}</p>
                    </div>
                  ))}
                </div>
                {calcDbProduct.fiber != null && (
                  <p className="text-[11px] text-[#9a978f] -mt-2 px-1">Kostfibre: {calcDbProduct.fiber}g</p>
                )}

                <button
                  disabled={dbGrams <= 0}
                  onClick={handleAddDbProduct}
                  className="w-full rounded-[8px] bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  Tilføj til {mealLabel}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Quick add overlay ── */}
      <AnimatePresence>
        {quickAddOpen && (
          <motion.div
            className="fixed inset-0 z-[65] bg-[#faf9f6] flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6] border-b border-[#e5e3dc]">
              <button
                onClick={() => setQuickAddOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] active:scale-[0.92] transition-transform"
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </button>
              <h1 className="text-[17px] font-bold text-[#2f2f2d]">Hurtig tilføjelse</h1>
              <button
                onClick={handleQuickAdd}
                className="flex h-9 w-9 items-center justify-center text-[#f58a2d] active:scale-[0.92] transition-transform"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-4 max-w-[430px] mx-auto w-full">
              {/* Navn */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#78766d]">Navn (valgfrit)</label>
                <input
                  type="text"
                  value={quickAddName}
                  onChange={e => setQuickAddName(e.target.value)}
                  placeholder="F.eks. Rugbrød m. ost"
                  className="w-full rounded-[8px] border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-white"
                />
              </div>

              {/* Måltid */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#78766d]">Måltid</label>
                <SelectSheet
                  value={quickAddMeal}
                  onValueChange={setQuickAddMeal}
                  title="Måltid"
                  options={meals.map(m => ({ value: m.key, label: `${m.emoji} ${m.label}` }))}
                  className="w-full bg-white"
                />
              </div>

              {/* Kalorier */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#78766d]">Kalorier</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={quickAddKcal}
                    onChange={e => setQuickAddKcal(e.target.value)}
                    placeholder="0"
                    className="flex-1 rounded-[8px] border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-white"
                  />
                  <span className="text-[13px] text-[#78766d] w-8">kcal</span>
                </div>
              </div>

              {/* Fedt */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-[12px] font-medium text-[#78766d]">Fedt i alt</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={quickAddFat}
                    onChange={e => setQuickAddFat(e.target.value)}
                    placeholder="0"
                    className="flex-1 rounded-[8px] border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-white"
                  />
                  <span className="text-[13px] text-[#78766d] w-8">g</span>
                </div>
              </div>

              {/* Kulhydrater */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-[12px] font-medium text-[#78766d]">Kulhydrater i alt</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={quickAddCarbs}
                    onChange={e => setQuickAddCarbs(e.target.value)}
                    placeholder="0"
                    className="flex-1 rounded-[8px] border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-white"
                  />
                  <span className="text-[13px] text-[#78766d] w-8">g</span>
                </div>
              </div>

              {/* Protein */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-[12px] font-medium text-[#78766d]">Protein</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={quickAddProtein}
                    onChange={e => setQuickAddProtein(e.target.value)}
                    placeholder="0"
                    className="flex-1 rounded-[8px] border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-white"
                  />
                  <span className="text-[13px] text-[#78766d] w-8">g</span>
                </div>
              </div>
            </div>
          </motion.div>
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
    memberNutritionGoals, setMemberNutritionGoals,
    memberDisplayPrefs, setMemberDisplayPrefs,
  } = useAppStore();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMemberId, setSelectedMemberId] = useState(currentUser?.id ?? '');
  const [foodLog, setFoodLog] = useState<FoodLogEntry[]>([]);
  const goals = memberNutritionGoals[selectedMemberId] ?? DEFAULT_GOALS;
  const setGoals = (g: NutritionGoals | ((prev: NutritionGoals) => NutritionGoals)) => {
    const current = memberNutritionGoals[selectedMemberId] ?? DEFAULT_GOALS;
    const next = typeof g === 'function' ? g(current) : g;
    setMemberNutritionGoals(selectedMemberId, next);
  };
  const [water, setWater] = useState<number>(0);

  // Food picker state
  const [foodPickerOpen, setFoodPickerOpen] = useState(false);
  const [foodPickerMeal, setFoodPickerMeal] = useState('morgenmad');

  // Meal plan replace tracking
  const [replaceTarget, setReplaceTarget] = useState<MealPlan | null>(null);

  // Dialogs
  const [personSelectorOpen, setPersonSelectorOpen] = useState(false);
  const [mealSelectorOpen, setMealSelectorOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [settingsPage, setSettingsPage] = useState<null | 'visningsformat' | 'kaloriemal' | 'makromal' | 'maaltider'>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Display preferences — loaded from store per member, saved explicitly
  const storedPrefs = memberDisplayPrefs[selectedMemberId];
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>(storedPrefs?.customMeals ?? DEFAULT_MEALS);
  const [editingMealKey, setEditingMealKey] = useState<string | null>(null);
  const [numberFormat, setNumberFormat] = useState<MemberDisplayPrefs['numberFormat']>(storedPrefs?.numberFormat ?? 'decimal');
  const [displayFormat, setDisplayFormat] = useState<MemberDisplayPrefs['displayFormat']>(storedPrefs?.displayFormat ?? 'absolute');
  const [macroDisplayMode, setMacroDisplayMode] = useState<MemberDisplayPrefs['macroDisplayMode']>(storedPrefs?.macroDisplayMode ?? 'gram');
  const [macroPctInputs, setMacroPctInputs] = useState({ protein: 20, carbs: 50, fat: 30 });
  const [isSaving, setIsSaving] = useState(false);

  // Sync draft state when switching profiles
  useEffect(() => {
    const p = memberDisplayPrefs[selectedMemberId];
    setNumberFormat(p?.numberFormat ?? 'decimal');
    setDisplayFormat(p?.displayFormat ?? 'absolute');
    setMacroDisplayMode(p?.macroDisplayMode ?? 'gram');
    setCustomMeals(p?.customMeals ?? DEFAULT_MEALS);
  }, [selectedMemberId, memberDisplayPrefs]);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setMemberDisplayPrefs(selectedMemberId, { numberFormat, displayFormat, macroDisplayMode, customMeals });
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Indstillinger gemt');
    }, 500);
  };

  // BMR Calculator
  const [goalMode, setGoalMode] = useState<'manual' | 'calculator'>('manual');
  const [calcData, setCalcData] = useState({
    gender: 'male' as 'male' | 'female',
    age: 30,
    height: 175,
    weight: 75,
    activity: 1.55,
    goal: 'maintain' as 'lose' | 'maintain' | 'gain',
    deficitAmount: 500,
    deficitMode: 'kcal' as 'kcal' | 'percent',
  });
  const baseTDEE = calculateTDEE(calcData.gender, calcData.age, calcData.height, calcData.weight, calcData.activity);
  const deficitKcal = calcData.deficitMode === 'percent'
    ? Math.round(baseTDEE * (calcData.deficitAmount / 100))
    : calcData.deficitAmount;
  const goalFactor = calcData.goal === 'lose' ? -deficitKcal : calcData.goal === 'gain' ? deficitKcal : 0;
  const calculatedTDEE = Math.max(1200, baseTDEE + goalFactor);

  // Macro percentage distribution (protein/carbs/fat relative to each other)
  const goalMacroKcal = goals.protein * 4 + goals.carbs * 4 + goals.fat * 9;
  const macroPcts = {
    protein: goalMacroKcal > 0 ? Math.round((goals.protein * 4 / goalMacroKcal) * 100) : 33,
    carbs: goalMacroKcal > 0 ? Math.round((goals.carbs * 4 / goalMacroKcal) * 100) : 34,
    fat: goalMacroKcal > 0 ? Math.round((goals.fat * 9 / goalMacroKcal) * 100) : 33,
  };

  // Family members
  const familyMembers = useMemo(() => [
    { id: currentUser?.id ?? '', name: currentUser?.name ?? 'Mig', isUser: true },
    ...children.map(c => ({ id: c.id, name: c.name, isUser: false })),
  ], [currentUser, children]);

  const activeMemberId = selectedMemberId || (currentUser?.id ?? '');

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
        className="fixed inset-0 z-[51] bg-[#faf9f6] flex flex-col overflow-hidden"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      >
        {/* ── Header ── */}
        <div className="grid grid-cols-3 items-center px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6] border-b border-[#e5e3dc]">
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center text-[#2f2f2d] active:scale-[0.92] transition-transform"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>
            <span className="text-sm font-medium text-[#78766d]">Dagbog</span>
          </div>
          <button
            onClick={() => setPersonSelectorOpen(true)}
            className="flex items-center justify-center gap-1.5 px-2 py-1"
          >
            <span className="text-[15px] font-semibold text-[#2f2f2d]">
              {(familyMembers.find(m => m.id === activeMemberId)?.name ?? 'Mig').split(' ')[0]}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#8a887f]" />
          </button>
          <button
            onClick={() => setGoalsOpen(true)}
            className="flex items-center justify-center justify-self-end h-8 w-8 text-[#78766d]"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-20 space-y-4 max-w-[430px] mx-auto">

            {/* ── Date navigation ── */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                className="flex h-9 w-9 items-center justify-center text-[#78766d] active:scale-95 transition-transform"
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
                className="flex h-9 w-9 items-center justify-center text-[#78766d] active:scale-95 transition-transform"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* ── Kalorie-overblik ── */}
            <button
              onClick={() => { setSelectedEntryId(null); setDetailsOpen(true); }}
              className="w-full rounded-[8px] bg-white border border-[#e5e3dc] p-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9a978f]">Kalorier</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    {displayFormat === 'percent' ? (
                      <>
                        <span className="text-[32px] font-black text-[#2f2f2d] leading-none">{pct(totals.kcal, goals.kcal)}%</span>
                        <span className="text-[13px] text-[#9a978f]">af dagligt mål</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[32px] font-black text-[#2f2f2d] leading-none">{totals.kcal}</span>
                        <span className="text-[13px] text-[#9a978f]">/ {goals.kcal} kcal</span>
                      </>
                    )}
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
                        <span className="text-[11px] font-bold text-[#2f2f2d]">
                          {displayFormat === 'percent' ? `${pct(m.value, m.goal)}%` : formatNutrition(m.value, m.goal, '', 'absolute', numberFormat)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#78766d]">{m.label}</p>
                    <p className="text-[10px] text-[#b0ada4]">
                      {displayFormat === 'percent'
                        ? `${pct(m.value, m.goal)}% af mål`
                        : `${formatNutrition(m.value, m.goal, '', 'absolute', numberFormat)}/${m.goal}${m.unit}`}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-3 justify-end">
                <Info className="h-3 w-3 text-[#b0ada4]" />
                <p className="text-[11px] text-[#b0ada4]">Tryk for fuld ernæringsdetaljer</p>
              </div>
            </button>

            {/* ── Vand ── */}
            <div className="rounded-[8px] bg-white border border-[#e5e3dc] p-4">
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
                    className="flex-1 rounded-[8px] bg-[#eff6ff] py-2 text-[12px] font-semibold text-[#3b82f6] active:scale-95 transition-transform"
                  >
                    +{ml >= 1000 ? `${ml / 1000}L` : `${ml}`}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Måltider ── */}
            <div className="space-y-3">
              {customMeals.map(meal => {
                const entries = todayEntries.filter(e => e.meal === meal.key);
                const mealKcal = entries.reduce((s, e) => s + e.kcal, 0);
                const suggestions = mealPlanSuggestions.filter(mp => MEAL_TYPE_MAP[mp.mealType] === meal.key);
                return (
                  <div key={meal.key} className="rounded-[8px] bg-white border border-[#e5e3dc] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-[8px] text-lg" style={{ backgroundColor: meal.color + '30' }}>
                          {meal.emoji}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-[#2f2f2d]">{meal.label}</p>
                          <p className="text-[12px] text-[#9a978f]">{mealKcal > 0 ? `${mealKcal} kcal` : 'Ingen mad logget'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openFoodPicker(meal.key)}
                        className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#f2f1ed] text-[#78766d] active:bg-[#e5e3dc]"
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
                              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#22c55e] active:scale-90 transition-transform"
                              title="Accepter"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReplaceMealPlan(mp, meal.key)}
                              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#f58a2d] active:scale-90 transition-transform"
                              title="Erstat"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectMealPlan(mp)}
                              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#b0ada4] active:scale-90 transition-transform"
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
              <div className="rounded-[8px] bg-white border border-[#e5e3dc] p-4 space-y-3">
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
                <div className="rounded-[8px] bg-[#faf9f6] p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Kalorier', value: formatNutrition(selectedEntry.kcal, goals.kcal, ' kcal', displayFormat, numberFormat), color: '#f58a2d', icon: Flame },
                      { label: 'Protein', value: formatNutrition(selectedEntry.protein, goals.protein, 'g', displayFormat, numberFormat), color: '#3b82f6', icon: Dumbbell },
                      { label: 'Kulhydrat', value: formatNutrition(selectedEntry.carbs, goals.carbs, 'g', displayFormat, numberFormat), color: '#f59e0b', icon: Wheat },
                      { label: 'Fedt', value: formatNutrition(selectedEntry.fat, goals.fat, 'g', displayFormat, numberFormat), color: '#ef4444', icon: Droplets },
                    ].map(n => (
                      <div key={n.label} className="rounded-[8px] bg-white border border-[#e5e3dc] p-3 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ backgroundColor: n.color + '20' }}>
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
                    <div className="rounded-[8px] bg-white border border-[#e5e3dc] p-3 space-y-2">
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
                  className="w-full flex items-center justify-center gap-2 rounded-[8px] border-2 border-red-100 bg-red-50 py-3 text-[14px] font-semibold text-red-500 active:scale-[0.98] transition-transform"
                >
                  <Trash2 className="h-4 w-4" />
                  Slet indlæg
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[8px] bg-[#faf9f6] p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[13px] font-semibold text-[#78766d]">Kalorier i dag</p>
                    <p className="text-[13px] text-[#9a978f]">{dateLabel}</p>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    {displayFormat === 'percent' ? (
                      <>
                        <span className="text-[36px] font-black text-[#2f2f2d] leading-none">{pct(totals.kcal, goals.kcal)}%</span>
                        <div>
                          <p className="text-[12px] text-[#9a978f]">af dagligt mål ({goals.kcal} kcal)</p>
                          <p className={cn("text-[13px] font-bold", remainingKcal < 0 ? "text-red-500" : "text-[#34C759]")}>
                            {remainingKcal < 0 ? `${Math.abs(remainingKcal)} kcal over mål` : `${remainingKcal} kcal tilbage`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-[36px] font-black text-[#2f2f2d] leading-none">{totals.kcal}</span>
                        <div>
                          <p className="text-[12px] text-[#9a978f]">af {goals.kcal} kcal mål</p>
                          <p className={cn("text-[13px] font-bold", remainingKcal < 0 ? "text-red-500" : "text-[#34C759]")}>
                            {remainingKcal < 0 ? `${Math.abs(remainingKcal)} kcal over mål` : `${remainingKcal} kcal tilbage`}
                          </p>
                        </div>
                      </>
                    )}
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
                    <div key={m.label} className="rounded-[8px] bg-white border border-[#e5e3dc] p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-[8px]" style={{ backgroundColor: m.color + '20' }}>
                            <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                          </div>
                          <p className="text-[13px] font-semibold text-[#2f2f2d]">{m.label}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-bold text-[#2f2f2d]">
                            {displayFormat === 'percent'
                              ? `${pct(m.value, m.goal)}%`
                              : `${formatNutrition(m.value, m.goal, '', 'absolute', numberFormat)} / ${m.goal}g`}
                          </p>
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
                  <div className="rounded-[8px] bg-white border border-[#e5e3dc] p-4 space-y-2">
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

                <div className="rounded-[8px] bg-white border border-[#e5e3dc] p-4">
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
                  <div className="rounded-[8px] bg-white border border-[#e5e3dc] p-4 space-y-2">
                    <p className="text-[13px] font-bold text-[#2f2f2d]">Kalorier pr. måltid</p>
                    {customMeals.map(meal => {
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

        {/* ── Floating "+" FAB ── */}
        <button
          onClick={() => setMealSelectorOpen(true)}
          className="absolute left-5 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#f58a2d] shadow-lg shadow-[#f58a2d]/30 active:scale-90 transition-transform"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 16px) + 12px)' }}
        >
          <Plus className="h-7 w-7 text-white" />
        </button>

        {/* ── Person selector popup ── */}
        <AnimatePresence>
          {personSelectorOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-20 bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPersonSelectorOpen(false)}
              />
              <motion.div
                className="fixed inset-x-4 top-[calc(env(safe-area-inset-top,16px)+48px)] z-30 rounded-xl bg-white shadow-xl border border-[#e5e3dc] max-w-[400px] mx-auto overflow-hidden"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {familyMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMemberId(m.id); setPersonSelectorOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                      activeMemberId === m.id ? "bg-[#fff8f0]" : "hover:bg-[#faf9f6]"
                    )}
                  >
                    <span className="text-[14px] font-semibold text-[#2f2f2d]">{m.name}</span>
                    {activeMemberId === m.id && (
                      <span className="ml-auto text-xs font-semibold text-[#f58a2d]">Aktiv</span>
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Meal selector popup (from FAB) ── */}
        <AnimatePresence>
          {mealSelectorOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-20 bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMealSelectorOpen(false)}
              />
              <motion.div
                className="fixed inset-x-4 bottom-4 z-30 rounded-xl bg-white shadow-xl border border-[#e5e3dc] max-w-[400px] mx-auto max-h-[80vh] overflow-y-auto"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
              >
                <p className="px-4 pt-3.5 pb-2 text-[13px] font-semibold text-[#78766d]">Vælg måltid</p>
                {customMeals.map(meal => (
                  <button
                    key={meal.key}
                    onClick={() => { setMealSelectorOpen(false); openFoodPicker(meal.key); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#faf9f6] transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-base" style={{ backgroundColor: meal.color + '30' }}>
                      {meal.emoji}
                    </div>
                    <span className="text-[14px] font-semibold text-[#2f2f2d]">{meal.label}</span>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </motion.div>

      {/* ── Food Picker overlay (z-60) ── */}
      <AnimatePresence>
        {foodPickerOpen && (
          <FoodPickerView
            meal={foodPickerMeal}
            meals={customMeals}
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
                onClick={() => settingsPage ? setSettingsPage(null) : (setGoalsOpen(false), setSettingsPage(null))}
                className="flex h-9 w-9 items-center justify-center text-[#2f2f2d] active:scale-[0.92] transition-transform"
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </button>
              <h1 className="text-[17px] font-bold text-[#2f2f2d]">
                {settingsPage === 'visningsformat' ? 'Visningsformat'
                  : settingsPage === 'kaloriemal' ? 'Kaloriemål'
                  : settingsPage === 'makromal' ? 'Makro-mål'
                  : settingsPage === 'maaltider' ? 'Måltider'
                  : 'Indstillinger'}
              </h1>
              <div className="w-9" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-5 max-w-[430px] mx-auto w-full">

            {settingsPage === null ? (
              /* ── Settings menu ── */
              <div className="space-y-3">
                {([
                  { key: 'visningsformat' as const, icon: Eye, label: 'Visningsformat', desc: 'Talformat og næringsstofvisning' },
                  { key: 'kaloriemal' as const, icon: Flame, label: 'Kaloriemål', desc: 'Dagligt kalorieindtag' },
                  { key: 'makromal' as const, icon: PieChart, label: 'Makro-mål', desc: 'Protein, kulhydrater, fedt m.m.' },
                  { key: 'maaltider' as const, icon: UtensilsCrossed, label: 'Måltider', desc: 'Tilpas dine måltider' },
                ] as const).map(item => (
                  <button
                    key={item.key}
                    onClick={() => setSettingsPage(item.key)}
                    className="flex items-center w-full px-4 py-3.5 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#fff2e6] mr-3 shrink-0">
                      <item.icon className="h-[18px] w-[18px] text-[#f58a2d]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[14px] font-medium text-[#2f2f2d]">{item.label}</p>
                      <p className="text-[12px] text-[#9a978f]">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#c5c3ba] shrink-0" />
                  </button>
                ))}

              </div>
            ) : settingsPage === 'visningsformat' ? (
              /* ── Sektion A: Visningsindstillinger ── */
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[12px] font-medium text-[#78766d]">Talformat</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([['decimal', 'Decimal (0,75)'], ['fraction', 'Brøk (¾)']] as const).map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNumberFormat(val)}
                        className={cn(
                          "rounded-[8px] border-2 py-2.5 text-[13px] font-semibold transition-all",
                          numberFormat === val
                            ? "border-[#f58a2d] bg-[#fff8f0] text-[#bf6722]"
                            : "border-[#e5e3dc] bg-[#faf9f6] text-[#78766d]"
                        )}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[12px] font-medium text-[#78766d]">Visning af næringsstoffer</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([['absolute', 'Gram / kcal'], ['percent', 'Procent af mål']] as const).map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDisplayFormat(val)}
                        className={cn(
                          "rounded-[8px] border-2 py-2.5 text-[13px] font-semibold transition-all",
                          displayFormat === val
                            ? "border-[#f58a2d] bg-[#fff8f0] text-[#bf6722]"
                            : "border-[#e5e3dc] bg-[#faf9f6] text-[#78766d]"
                        )}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full rounded-[8px] bg-[#2f2f2f] py-3 text-[14px] font-bold text-white active:scale-[0.98] transition-transform mt-4"
                >
                  Gem
                </button>
              </div>

            ) : settingsPage === 'kaloriemal' ? (
              /* ── Sektion B: Kaloriemål ── */
              <div className="space-y-3">
                {/* Segmented control */}
                <div className="grid grid-cols-2 gap-0 rounded-[8px] border border-[#e5e3dc] overflow-hidden">
                  {([['manual', 'Indtast selv'], ['calculator', 'Brug beregner']] as const).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGoalMode(val)}
                      className={cn(
                        "py-2.5 text-[13px] font-semibold transition-colors",
                        goalMode === val
                          ? "bg-[#2f2f2f] text-white"
                          : "bg-white text-[#78766d]"
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                {goalMode === 'manual' ? (
                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-medium text-[#2f2f2d]">Dagligt kaloriemål</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={goals.kcal || ''}
                        onChange={e => setGoals(prev => ({ ...prev, kcal: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                        className="flex-1 rounded-[8px] border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-[#faf9f6]"
                      />
                      <span className="text-[13px] text-[#78766d] w-8">kcal</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Køn */}
                    <div className="space-y-1.5">
                      <p className="text-[12px] font-medium text-[#78766d]">Køn</p>
                      <div className="grid grid-cols-2 gap-2">
                        {([['male', 'Mand'], ['female', 'Kvinde']] as const).map(([val, lbl]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCalcData(prev => ({ ...prev, gender: val }))}
                            className={cn(
                              "rounded-[8px] border-2 py-2 text-[13px] font-semibold transition-all",
                              calcData.gender === val
                                ? "border-[#f58a2d] bg-[#fff8f0] text-[#bf6722]"
                                : "border-[#e5e3dc] text-[#78766d]"
                            )}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Alder, Højde, Vægt */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'age', label: 'Alder', unit: 'år' },
                        { key: 'height', label: 'Højde', unit: 'cm' },
                        { key: 'weight', label: 'Vægt', unit: 'kg' },
                      ].map(f => (
                        <div key={f.key} className="space-y-1">
                          <p className="text-[11px] font-medium text-[#78766d]">{f.label}</p>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              inputMode="numeric"
                              value={calcData[f.key as keyof typeof calcData] || ''}
                              onChange={e => setCalcData(prev => ({ ...prev, [f.key]: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                              className="w-full rounded-[8px] border border-[#e5e3dc] px-2 py-2 text-[13px] outline-none focus:border-[#f58a2d] bg-[#faf9f6]"
                            />
                            <span className="text-[11px] text-[#9a978f] shrink-0">{f.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Aktivitetsniveau */}
                    <div className="space-y-1.5">
                      <p className="text-[12px] font-medium text-[#78766d]">Aktivitetsniveau</p>
                      <div className="space-y-1.5">
                        {ACTIVITY_LEVELS.map(level => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => setCalcData(prev => ({ ...prev, activity: level.value }))}
                            className={cn(
                              "w-full flex items-center justify-between rounded-[8px] border-2 px-3 py-2.5 text-left transition-all",
                              calcData.activity === level.value
                                ? "border-[#f58a2d] bg-[#fff8f0]"
                                : "border-[#e5e3dc]"
                            )}
                          >
                            <div>
                              <p className={cn("text-[13px] font-semibold", calcData.activity === level.value ? "text-[#bf6722]" : "text-[#2f2f2d]")}>
                                {level.label}
                              </p>
                              <p className="text-[11px] text-[#9a978f]">{level.desc}</p>
                            </div>
                            {calcData.activity === level.value && (
                              <div className="h-5 w-5 rounded-full bg-[#f58a2d] flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Formål */}
                    <div className="space-y-1.5">
                      <p className="text-[12px] font-medium text-[#78766d]">Formål</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: 'lose' as const, label: 'Vægttab' },
                          { key: 'maintain' as const, label: 'Vedligehold' },
                          { key: 'gain' as const, label: 'Vægtøgning' },
                        ]).map(g => (
                          <button
                            key={g.key}
                            type="button"
                            onClick={() => setCalcData(prev => ({ ...prev, goal: g.key }))}
                            className={cn(
                              "rounded-[8px] border-2 py-2.5 px-1 text-center transition-all",
                              calcData.goal === g.key
                                ? "border-[#f58a2d] bg-[#fff8f0]"
                                : "border-[#e5e3dc]"
                            )}
                          >
                            <p className={cn("text-[12px] font-semibold", calcData.goal === g.key ? "text-[#bf6722]" : "text-[#2f2f2d]")}>
                              {g.label}
                            </p>
                            <p className="text-[10px] text-[#9a978f] mt-0.5">
                              {g.key === 'maintain' ? 'Ingen justering' : `${deficitKcal} kcal/dag`}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Justeringsfelt — kun ved vægttab/vægtøgning */}
                    {calcData.goal !== 'maintain' && (
                      <div className="space-y-2.5">
                        <p className="text-[12px] font-medium text-[#78766d]">
                          {calcData.goal === 'lose' ? 'Kalorie-underskud' : 'Kalorie-overskud'}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {([['kcal', 'Kalorier'], ['percent', 'Procent']] as const).map(([val, lbl]) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                if (val === calcData.deficitMode) return;
                                const converted = val === 'percent'
                                  ? baseTDEE > 0 ? Math.round((calcData.deficitAmount / baseTDEE) * 100) : 20
                                  : Math.round(baseTDEE * (calcData.deficitAmount / 100));
                                setCalcData(prev => ({ ...prev, deficitMode: val, deficitAmount: converted }));
                              }}
                              className={cn(
                                "rounded-[8px] border-2 py-2 text-[12px] font-semibold transition-all",
                                calcData.deficitMode === val
                                  ? "border-[#f58a2d] bg-[#fff8f0] text-[#bf6722]"
                                  : "border-[#e5e3dc] text-[#78766d]"
                              )}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={calcData.deficitAmount || ''}
                            onChange={e => setCalcData(prev => ({
                              ...prev,
                              deficitAmount: e.target.value === '' ? 0 : parseFloat(e.target.value),
                            }))}
                            className="flex-1 rounded-[8px] border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-[#faf9f6]"
                          />
                          <span className="text-[13px] text-[#78766d] w-10">
                            {calcData.deficitMode === 'percent' ? '%' : 'kcal'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9a978f]">
                          {calcData.deficitMode === 'percent'
                            ? `= ${deficitKcal} kcal/dag`
                            : `= ${baseTDEE > 0 ? Math.round((deficitKcal / baseTDEE) * 100) : 0}% af TDEE`}
                        </p>
                      </div>
                    )}

                    {/* Beregnet TDEE */}
                    <div className="rounded-[8px] bg-[#fff8f0] border border-[#f3c59d] p-4 text-center">
                      <p className="text-[12px] text-[#9a978f] mb-1">Dit anbefalede daglige kalorieindtag</p>
                      <p className="text-[36px] font-black text-[#f58a2d] leading-none">{calculatedTDEE}</p>
                      <p className="text-[13px] text-[#cc6f1f] mt-1">kcal / dag</p>
                      {calcData.goal !== 'maintain' && (
                        <div className="mt-2 pt-2 border-t border-[#f3c59d]">
                          <p className="text-[11px] text-[#9a978f]">
                            TDEE: {baseTDEE} kcal — {calcData.goal === 'lose' ? 'underskud' : 'overskud'}: {deficitKcal} kcal ({baseTDEE > 0 ? Math.round((deficitKcal / baseTDEE) * 100) : 0}%)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Brug dette mål */}
                    <button
                      type="button"
                      onClick={() => {
                        const tdee = calculatedTDEE;
                        setGoals(prev => ({
                          ...prev,
                          kcal: tdee,
                          protein: Math.round((tdee * 0.20) / 4),
                          carbs: Math.round((tdee * 0.50) / 4),
                          fat: Math.round((tdee * 0.30) / 9),
                        }));
                        toast.success(`Mål sat til ${tdee} kcal`);
                      }}
                      className="w-full rounded-[8px] bg-[#f58a2d] py-3 text-[14px] font-bold text-white active:scale-[0.98] transition-transform"
                    >
                      Brug dette mål
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full rounded-[8px] bg-[#2f2f2f] py-3 text-[14px] font-bold text-white active:scale-[0.98] transition-transform mt-4"
                >
                  Gem
                </button>
              </div>

            ) : settingsPage === 'makromal' ? (
              /* ── Sektion C: Makro-mål ── */
              <div className="space-y-3">
                <div className="flex items-center justify-end">
                  <div className="flex rounded-full bg-[#f2f1ed] p-0.5">
                    <button
                      type="button"
                      onClick={() => setMacroDisplayMode('gram')}
                      className={cn("rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                        macroDisplayMode === 'gram' ? "bg-white text-[#2f2f2d] shadow-sm" : "text-[#78766d]")}
                    >
                      Gram
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const total = goals.protein * 4 + goals.carbs * 4 + goals.fat * 9;
                        if (total > 0) {
                          const p = Math.round((goals.protein * 4 / total) * 100);
                          const c = Math.round((goals.carbs * 4 / total) * 100);
                          setMacroPctInputs({ protein: p, carbs: c, fat: 100 - p - c });
                        }
                        setMacroDisplayMode('percent');
                      }}
                      className={cn("rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                        macroDisplayMode === 'percent' ? "bg-white text-[#2f2f2d] shadow-sm" : "text-[#78766d]")}
                    >
                      %
                    </button>
                  </div>
                </div>

                {/* Distribution bar */}
                {(() => {
                  const dp = macroDisplayMode === 'percent' ? macroPctInputs : macroPcts;
                  return (
                    <>
                      <div className="flex h-2 rounded-full overflow-hidden bg-[#e5e3dc]">
                        <div style={{ width: `${dp.protein}%` }} className="bg-[#4a90d9] transition-all" />
                        <div style={{ width: `${dp.carbs}%` }} className="bg-[#22c55e] transition-all" />
                        <div style={{ width: `${dp.fat}%` }} className="bg-[#ef4444] transition-all" />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#9a978f]">
                        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#4a90d9]" />Protein {dp.protein}%</span>
                        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />Kulhydrat {dp.carbs}%</span>
                        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />Fedt {dp.fat}%</span>
                        {macroDisplayMode === 'percent' && (
                          <span className={cn("font-medium", dp.protein + dp.carbs + dp.fat === 100 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                            = {dp.protein + dp.carbs + dp.fat}%
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* Macro fields: Protein, Kulhydrat, Fedt */}
                <div className="space-y-3">
                  {[
                    { key: 'protein', label: 'Protein', color: '#4a90d9', kcalPer: 4, hint: '0.8–1.2g pr. kg kropsvægt' },
                    { key: 'carbs', label: 'Kulhydrat', color: '#22c55e', kcalPer: 4, hint: '45–65% af daglige kalorier' },
                    { key: 'fat', label: 'Fedt', color: '#ef4444', kcalPer: 9, hint: '20–35% af daglige kalorier' },
                  ].map(f => {
                    const gramVal = goals[f.key as keyof NutritionGoals];
                    const pctVal = macroPcts[f.key as 'protein' | 'carbs' | 'fat'];
                    return (
                      <div key={f.key} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                            <Label className="text-[14px] font-medium text-[#2f2f2d]">{f.label}</Label>
                          </div>
                          <span className="text-[11px] text-[#9a978f]">{f.hint}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {macroDisplayMode === 'gram' ? (
                            <>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={gramVal || ''}
                                onChange={e => setGoals(prev => ({ ...prev, [f.key]: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                                className="flex-1 rounded-[8px] border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-[#faf9f6]"
                              />
                              <span className="text-[13px] text-[#78766d] w-8">g</span>
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={macroPctInputs[f.key as 'protein' | 'carbs' | 'fat'] || ''}
                                onChange={e => {
                                  const val = e.target.value === '' ? 0 : Math.max(0, Math.min(100, parseInt(e.target.value)));
                                  const key = f.key as 'protein' | 'carbs' | 'fat';
                                  setMacroPctInputs(prev => {
                                    const updated = { ...prev, [key]: val };
                                    // Konverter til gram
                                    const kcalPerMap = { protein: 4, carbs: 4, fat: 9 };
                                    if (goals.kcal > 0) {
                                      setGoals(g => ({
                                        ...g,
                                        protein: Math.round((updated.protein / 100) * goals.kcal / kcalPerMap.protein),
                                        carbs: Math.round((updated.carbs / 100) * goals.kcal / kcalPerMap.carbs),
                                        fat: Math.round((updated.fat / 100) * goals.kcal / kcalPerMap.fat),
                                      }));
                                    }
                                    return updated;
                                  });
                                }}
                                className="flex-1 rounded-[8px] border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-[#faf9f6]"
                              />
                              <span className="text-[13px] text-[#78766d] w-8">%</span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-[#9a978f]">
                          {macroDisplayMode === 'gram'
                            ? `= ${pctVal}% af daglige kalorier`
                            : `= ${goals[f.key as keyof NutritionGoals]}g`
                          }
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Fiber + Vand (altid i gram) */}
                {[
                  { key: 'fiber', label: 'Kostfibre', unit: 'g', hint: 'Min. 25–30g dagligt' },
                  { key: 'water', label: 'Vand', unit: 'ml', hint: 'Min. 2000 ml (8 glas)' },
                ].map(f => {
                  const goalVal = goals[f.key as keyof NutritionGoals];
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-[14px] font-medium text-[#2f2f2d]">{f.label}</Label>
                        <span className="text-[11px] text-[#9a978f]">{f.hint}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={goalVal || ''}
                          onChange={e => setGoals(prev => ({ ...prev, [f.key]: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                          className="flex-1 rounded-[8px] border border-[#e5e3dc] px-3 py-2.5 text-[14px] outline-none focus:border-[#f58a2d] bg-[#faf9f6]"
                        />
                        <span className="text-[13px] text-[#78766d] w-8">{f.unit}</span>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full rounded-[8px] bg-[#2f2f2f] py-3 text-[14px] font-bold text-white active:scale-[0.98] transition-transform mt-4"
                >
                  Gem
                </button>
              </div>

            ) : settingsPage === 'maaltider' ? (
              /* ── Sektion D: Måltider ── */
              <div className="space-y-3">
                <div className="rounded-[8px] overflow-hidden divide-y divide-[#f2f1ed]">
                  {customMeals.map((meal, idx) => (
                    <div key={meal.key}>
                      {editingMealKey === meal.key ? (
                        <div className="p-3 space-y-2 bg-[#faf9f6]">
                          <div className="flex gap-2">
                            <div className="space-y-1 w-16">
                              <p className="text-[10px] text-[#9a978f]">Emoji</p>
                              <input
                                type="text"
                                value={meal.emoji}
                                onChange={e => {
                                  const v = e.target.value;
                                  setCustomMeals(prev => prev.map(m => m.key === meal.key ? { ...m, emoji: v } : m));
                                }}
                                className="w-full rounded-[8px] border border-[#e5e3dc] px-2 py-1.5 text-center text-[16px] outline-none focus:border-[#f58a2d] bg-white"
                              />
                            </div>
                            <div className="space-y-1 flex-1">
                              <p className="text-[10px] text-[#9a978f]">Navn</p>
                              <input
                                type="text"
                                value={meal.label}
                                onChange={e => {
                                  const v = e.target.value;
                                  setCustomMeals(prev => prev.map(m => m.key === meal.key ? { ...m, label: v } : m));
                                }}
                                className="w-full rounded-[8px] border border-[#e5e3dc] px-3 py-1.5 text-[13px] outline-none focus:border-[#f58a2d] bg-white"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingMealKey(null)}
                            className="w-full rounded-[8px] bg-[#f58a2d] py-2 text-[12px] font-bold text-white active:scale-[0.98] transition-transform"
                          >
                            Gem
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => setCustomMeals(prev => {
                                const arr = [...prev];
                                [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                return arr;
                              })}
                              className="text-[10px] text-[#9a978f] disabled:opacity-30 active:text-[#2f2f2d]"
                            >▲</button>
                            <button
                              type="button"
                              disabled={idx === customMeals.length - 1}
                              onClick={() => setCustomMeals(prev => {
                                const arr = [...prev];
                                [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                                return arr;
                              })}
                              className="text-[10px] text-[#9a978f] disabled:opacity-30 active:text-[#2f2f2d]"
                            >▼</button>
                          </div>
                          <span className="text-[16px] w-7 text-center">{meal.emoji}</span>
                          <p className="flex-1 text-[13px] font-medium text-[#2f2f2d]">{meal.label}</p>
                          <button
                            type="button"
                            onClick={() => setEditingMealKey(meal.key)}
                            className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#78766d] hover:bg-[#f2f1ed]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomMeals(prev => prev.filter(m => m.key !== meal.key))}
                            className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#b0ada4] hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const color = MEAL_COLORS[customMeals.length % MEAL_COLORS.length];
                      setCustomMeals(prev => [...prev, { key: `custom_${Date.now()}`, label: 'Nyt måltid', emoji: '🍴', color }]);
                    }}
                    className="flex-1 rounded-[8px] border-2 border-dashed border-[#d8d7cf] py-2.5 text-[13px] font-semibold text-[#78766d] active:scale-[0.98] transition-transform"
                  >
                    + Tilføj måltid
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMeals(DEFAULT_MEALS)}
                    className="rounded-[8px] border-2 border-[#e5e3dc] px-3 py-2.5 text-[12px] font-semibold text-[#9a978f] active:scale-[0.98] transition-transform"
                  >
                    Nulstil
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full rounded-[8px] bg-[#2f2f2f] py-3 text-[14px] font-bold text-white active:scale-[0.98] transition-transform mt-4"
                >
                  Gem
                </button>
              </div>

            ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <SavingOverlay open={isSaving} />
    </>
  );
}
