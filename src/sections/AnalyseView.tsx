import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
  AreaChart, Area,
  LineChart, Line,
} from 'recharts';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { categorizeFoodItem } from '@/lib/foodCategorizer';
import type { FoodCategory } from '@/data/foodItems';
import {
  TrendingUp, TrendingDown, Minus,
  ChevronLeft, ChevronRight, BarChart3,
} from 'lucide-react';
import type { FridgeHistoryEntry } from '@/types';
import { ExpensesSidePanel } from '@/components/custom/ExpensesSidePanel';
import { useNutriScoreMap, matchNutriScore } from '@/hooks/useNutriScoreMap';
import { NutriScoreBadge } from '@/components/custom/NutriScoreBadge';

// ── Colors ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<FoodCategory, string> = {
  'Frugt & Grønt': '#34C759',
  'Mejeriprodukter': '#5AC8FA',
  'Brød & Korn': '#FFCC00',
  'Kød & Fisk': '#FF3B30',
  'Snacks & Drikkevarer': '#AF52DE',
  'Andet': '#8E8E93',
};

const DANISH_MONTHS_FULL = ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'];
const DANISH_WEEKDAYS_SHORT = ['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCategory(entry: FridgeHistoryEntry): FoodCategory {
  if (entry.category) return entry.category as FoodCategory;
  return categorizeFoodItem(entry.itemName);
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function inRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

function scoreColor(score: number): string {
  if (score >= 80) return '#34C759';
  if (score >= 50) return '#FFCC00';
  return '#FF3B30';
}

// ── Score Ring SVG ──────────────────────────────────────────────────────────

function ScoreRing({ value, size = 120, strokeWidth = 10, color }: {
  value: number; size?: number; strokeWidth?: number; color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fill = Math.min(1, Math.max(0, value / 100));
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f2f1ed" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - fill)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

// ── Trend Badge ─────────────────────────────────────────────────────────────

function TrendBadge({ current, previous, invertColors }: {
  current: number; previous: number; invertColors?: boolean;
}) {
  if (previous === 0 && current === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[14px] font-semibold text-muted-foreground">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  }
  const diff = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  const isUp = diff > 0;
  const isGood = invertColors ? !isUp : isUp;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[14px] font-semibold',
      isGood ? 'text-[#34C759]' : 'text-[#FF3B30]'
    )}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? '+' : ''}{diff}%
    </span>
  );
}

// ── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mt-5 mb-2">
      <h2 className="text-[14px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">{title}</h2>
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-border bg-card py-12 text-center">
      <BarChart3 className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="text-sm font-semibold text-foreground">Ingen data endnu</p>
        <p className="mt-1 text-[14px] text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AnalyseView() {
  const {
    fridgeItems, fridgeHistory,
    shoppingItems, mealPlans,
    expenses, budgetGoals,
    analysePersonId,
  } = useAppStore();

  const nutriScoreMap = useNutriScoreMap();

  // ── State ───────────────────────────────────────────────────────────────

  const [periodMode, setPeriodMode] = useState<'week' | 'month'>('month');
  const [periodOffset, setPeriodOffset] = useState(0);

  // ── Period calculation ──────────────────────────────────────────────────

  const period = useMemo(() => {
    const now = new Date();
    if (periodMode === 'week') {
      const ws = new Date(now);
      const day = ws.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      ws.setDate(ws.getDate() + diff + periodOffset * 7);
      ws.setHours(0, 0, 0, 0);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 6);
      we.setHours(23, 59, 59, 999);
      const ps = new Date(ws); ps.setDate(ps.getDate() - 7);
      const pe = new Date(we); pe.setDate(pe.getDate() - 7);
      const weekNum = getISOWeek(ws);
      const label = `Uge ${weekNum} · ${ws.getDate()}/${ws.getMonth() + 1}–${we.getDate()}/${we.getMonth() + 1}`;
      return { start: ws, end: we, prevStart: ps, prevEnd: pe, label };
    }
    const ms = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
    const me = new Date(now.getFullYear(), now.getMonth() + periodOffset + 1, 0, 23, 59, 59);
    const ps = new Date(now.getFullYear(), now.getMonth() + periodOffset - 1, 1);
    const pe = new Date(now.getFullYear(), now.getMonth() + periodOffset, 0, 23, 59, 59);
    const label = `${DANISH_MONTHS_FULL[ms.getMonth()]} ${ms.getFullYear()}`;
    return { start: ms, end: me, prevStart: ps, prevEnd: pe, label };
  }, [periodMode, periodOffset]);

  // ── Filtered data ───────────────────────────────────────────────────────

  const periodHistory = useMemo(() =>
    fridgeHistory.filter(e => {
      if (!inRange(e.removedAt, period.start, period.end)) return false;
      if (analysePersonId && e.removedBy !== analysePersonId) return false;
      return true;
    }),
  [fridgeHistory, period, analysePersonId]);

  const prevHistory = useMemo(() =>
    fridgeHistory.filter(e => inRange(e.removedAt, period.prevStart, period.prevEnd)),
  [fridgeHistory, period]);

  const usedItems = useMemo(() => periodHistory.filter(e => e.reason === 'used'), [periodHistory]);
  const thrownItems = useMemo(() => periodHistory.filter(e => e.reason === 'thrown_away'), [periodHistory]);
  const totalItems = periodHistory.length;
  const wastePercent = totalItems > 0 ? Math.round((thrownItems.length / totalItems) * 100) : 0;

  const prevUsed = prevHistory.filter(e => e.reason === 'used').length;
  const prevThrown = prevHistory.filter(e => e.reason === 'thrown_away').length;
  const prevTotal = prevUsed + prevThrown;
  const prevWastePercent = prevTotal > 0 ? Math.round((prevThrown / prevTotal) * 100) : 0;

  // ── Food expenses ───────────────────────────────────────────────────────

  const foodExpenses = useMemo(() =>
    expenses.filter(e => {
      if (e.category !== 'food') return false;
      if (!inRange(e.date, period.start, period.end)) return false;
      if (analysePersonId && e.paidBy !== analysePersonId) return false;
      return true;
    }),
  [expenses, period, analysePersonId]);

  const totalFoodSpending = foodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const prevFoodSpending = useMemo(() =>
    expenses.filter(e => e.category === 'food' && inRange(e.date, period.prevStart, period.prevEnd))
      .reduce((sum, e) => sum + e.amount, 0),
  [expenses, period]);

  const foodBudget = budgetGoals.find(g => g.category === 'food')?.monthlyAmount ?? 0;

  // ── Meal plans in period ────────────────────────────────────────────────

  const periodMealPlans = useMemo(() =>
    mealPlans.filter(m => inRange(m.date, period.start, period.end)),
  [mealPlans, period]);

  const uniqueMealDays = useMemo(() => {
    const days = new Set(periodMealPlans.map(m => m.date));
    return days.size;
  }, [periodMealPlans]);

  const totalDaysInPeriod = useMemo(() => {
    return Math.round((period.end.getTime() - period.start.getTime()) / 86400000) + 1;
  }, [period]);

  // ═══════════════════════════════════════════════════════════════════════
  // SUNDHEDSSCORE
  // ═══════════════════════════════════════════════════════════════════════

  const scores = useMemo(() => {
    const waste = totalItems > 0 ? Math.round(100 - (thrownItems.length / totalItems) * 100) : 50;
    const meal = totalDaysInPeriod > 0 ? Math.min(100, Math.round((uniqueMealDays / totalDaysInPeriod) * 100)) : 0;

    const categories = new Set(usedItems.map(e => getCategory(e)));
    const variety = Math.min(100, Math.round((categories.size / 5) * 100));

    const overall = Math.round(waste * 0.4 + meal * 0.3 + variety * 0.3);

    // Previous period scores
    const prevWaste = prevTotal > 0 ? Math.round(100 - (prevThrown / prevTotal) * 100) : 50;
    const prevOverall = prevWaste; // simplified

    return { waste, meal, variety, overall, prevOverall };
  }, [totalItems, thrownItems, usedItems, uniqueMealDays, totalDaysInPeriod, prevTotal, prevThrown]);

  // ═══════════════════════════════════════════════════════════════════════
  // CHART DATA
  // ═══════════════════════════════════════════════════════════════════════

  // Waste over time
  const wasteOverTimeData = useMemo(() => {
    if (periodMode === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(period.start);
        d.setDate(d.getDate() + i);
        const dayStr = d.toISOString().slice(0, 10);
        const used = periodHistory.filter(e => e.reason === 'used' && e.removedAt.startsWith(dayStr)).length;
        const thrown = periodHistory.filter(e => e.reason === 'thrown_away' && e.removedAt.startsWith(dayStr)).length;
        return { label: DANISH_WEEKDAYS_SHORT[i], used, thrown };
      });
    }
    // Monthly: group by week number
    const weeks: Record<string, { used: number; thrown: number }> = {};
    periodHistory.forEach(e => {
      const d = new Date(e.removedAt);
      const wk = `U${getISOWeek(d)}`;
      if (!weeks[wk]) weeks[wk] = { used: 0, thrown: 0 };
      if (e.reason === 'used') weeks[wk].used++;
      else weeks[wk].thrown++;
    });
    return Object.entries(weeks).map(([label, v]) => ({ label, ...v }));
  }, [periodHistory, periodMode, period.start]);

  // Waste by category (pie)
  const wasteByCategoryData = useMemo(() => {
    const counts: Partial<Record<FoodCategory, number>> = {};
    thrownItems.forEach(e => {
      const cat = getCategory(e);
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([category, count]) => ({ category: category as FoodCategory, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }, [thrownItems]);

  // Consumption by category (bar)
  const usedByCategoryData = useMemo(() => {
    const counts: Partial<Record<FoodCategory, number>> = {};
    usedItems.forEach(e => {
      const cat = getCategory(e);
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([category, count]) => ({ category: category as FoodCategory, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }, [usedItems]);

  // Nutrition from used items
  const nutritionTotals = useMemo(() => {
    let protein = 0, carbs = 0, fat = 0;
    usedItems.forEach(e => {
      if (e.nutritionPer100g) {
        protein += e.nutritionPer100g.protein ?? 0;
        carbs += e.nutritionPer100g.carbs ?? 0;
        fat += e.nutritionPer100g.fat ?? 0;
      }
    });
    const total = protein + carbs + fat;
    return {
      protein, carbs, fat, total,
      proteinPct: total > 0 ? Math.round((protein / total) * 100) : 0,
      carbsPct: total > 0 ? Math.round((carbs / total) * 100) : 0,
      fatPct: total > 0 ? Math.round((fat / total) * 100) : 0,
    };
  }, [usedItems]);

  // NutriScore distribution from used items
  const nutriScoreDistribution = useMemo(() => {
    const counts: Record<string, number> = { a: 0, b: 0, c: 0, d: 0, e: 0 };
    let matched = 0;
    for (const item of usedItems) {
      const grade = matchNutriScore(item.itemName, nutriScoreMap);
      if (grade && counts[grade] !== undefined) {
        counts[grade]++;
        matched++;
      }
    }
    if (matched === 0) return null;

    const COLORS: Record<string, string> = { a: '#038141', b: '#85BB2F', c: '#FECB02', d: '#EE8100', e: '#E63E11' };
    const data = Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([grade, count]) => ({ grade: grade.toUpperCase(), count, color: COLORS[grade], pct: Math.round((count / matched) * 100) }));

    const gradeValues: Record<string, number> = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    const sum = Object.entries(counts).reduce((s, [g, c]) => s + (gradeValues[g] ?? 0) * c, 0);
    const avgNum = sum / matched;
    const avgGrade = avgNum <= 1.5 ? 'a' : avgNum <= 2.5 ? 'b' : avgNum <= 3.5 ? 'c' : avgNum <= 4.5 ? 'd' : 'e';

    return { data, avgGrade, matched };
  }, [usedItems, nutriScoreMap]);

  // Food spending over time (line)
  const spendingOverTimeData = useMemo(() => {
    if (periodMode === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(period.start);
        d.setDate(d.getDate() + i);
        const dayStr = d.toISOString().slice(0, 10);
        const amount = foodExpenses.filter(e => e.date === dayStr).reduce((s, e) => s + e.amount, 0);
        return { label: DANISH_WEEKDAYS_SHORT[i], amount };
      });
    }
    const weeks: Record<string, number> = {};
    foodExpenses.forEach(e => {
      const d = new Date(e.date);
      const wk = `U${getISOWeek(d)}`;
      weeks[wk] = (weeks[wk] ?? 0) + e.amount;
    });
    return Object.entries(weeks).map(([label, amount]) => ({ label, amount }));
  }, [foodExpenses, periodMode, period.start]);

  // Fridge activity stacked bar
  const fridgeActivityData = useMemo(() => {
    if (periodMode === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(period.start);
        d.setDate(d.getDate() + i);
        const dayStr = d.toISOString().slice(0, 10);
        const used = periodHistory.filter(e => e.reason === 'used' && e.removedAt.startsWith(dayStr)).length;
        const thrown = periodHistory.filter(e => e.reason === 'thrown_away' && e.removedAt.startsWith(dayStr)).length;
        return { label: DANISH_WEEKDAYS_SHORT[i], used, thrown };
      });
    }
    return wasteOverTimeData; // same data in monthly view
  }, [periodHistory, periodMode, period.start, wasteOverTimeData]);

  // Avg shelf life
  const avgShelfLife = useMemo(() => {
    const withDates = periodHistory.filter(e => e.addedAt && e.removedAt);
    if (withDates.length === 0) return 0;
    const totalDays = withDates.reduce((sum, e) => sum + daysBetween(e.addedAt, e.removedAt), 0);
    return Math.round((totalDays / withDates.length) * 10) / 10;
  }, [periodHistory]);

  // Shopping completion
  const shoppingCompletion = useMemo(() => {
    const total = shoppingItems.length;
    const purchased = shoppingItems.filter(s => s.purchased).length;
    return { total, purchased, pct: total > 0 ? Math.round((purchased / total) * 100) : 0 };
  }, [shoppingItems]);

  // Meal plan week dots
  const mealPlanDots = useMemo(() => {
    const now = new Date();
    const ws = new Date(now);
    const day = ws.getDay();
    ws.setDate(ws.getDate() - (day === 0 ? 6 : day - 1));
    ws.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(d.getDate() + i);
      const dayStr = d.toISOString().slice(0, 10);
      const hasPlans = mealPlans.some(m => m.date === dayStr);
      return { day: DANISH_WEEKDAYS_SHORT[i], hasPlans };
    });
  }, [mealPlans]);

  // Estimated savings
  const estimatedSavings = useMemo(() => {
    if (wastePercent === 0 || totalFoodSpending === 0) return 0;
    return Math.round((wastePercent / 100) * totalFoodSpending * 0.5);
  }, [wastePercent, totalFoodSpending]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-1 py-1 pb-[120px]">
      <ExpensesSidePanel />

      {/* ── Period Controls ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPeriodMode('week')}
          className={cn(
            'rounded-[8px] px-3.5 py-1.5 text-[14px] font-semibold transition-all',
            periodMode === 'week' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
          )}
        >Uge</button>
        <button
          onClick={() => setPeriodMode('month')}
          className={cn(
            'rounded-[8px] px-3.5 py-1.5 text-[14px] font-semibold transition-all',
            periodMode === 'month' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
          )}
        >Måned</button>
      </div>

      <div className="flex items-center justify-between px-4 py-1">
        <button onClick={() => setPeriodOffset(o => o - 1)} className="text-muted-foreground active:scale-95 transition-transform">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-[14px] font-semibold text-foreground">{period.label}</p>
        <button onClick={() => setPeriodOffset(o => o + 1)} className="text-muted-foreground active:scale-95 transition-transform">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: SUNDHEDSSCORE                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <div className="rounded-[8px] border border-border bg-card p-5 mt-2">
        <div className="flex flex-col items-center">
          <p className="text-[14px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-3">Sundhedsscore</p>
          <div className="relative">
            <ScoreRing value={scores.overall} color={scoreColor(scores.overall)} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[32px] font-black text-foreground leading-none">{scores.overall}</span>
              <span className="text-[12px] font-semibold text-muted-foreground mt-0.5">af 100</span>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            {[
              { label: 'Madspild', value: scores.waste },
              { label: 'Måltider', value: scores.meal },
              { label: 'Variation', value: scores.variety },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-[8px] bg-card px-3 py-1.5">
                <span className="text-[14px] font-bold" style={{ color: scoreColor(s.value) }}>{s.value}</span>
                <span className="text-[12px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <TrendBadge current={scores.overall} previous={scores.prevOverall} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 2: MADSPILD                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <SectionHeader title="Madspild" />

      {totalItems === 0 ? (
        <EmptyState text="Marker varer som brugt eller smidt ud i køleskabet" />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-center">
              <p className="text-[22px] font-black text-amber-700">{thrownItems.length}</p>
              <p className="text-[13px] font-semibold text-amber-600">Smidt ud</p>
            </div>
            <div className={cn(
              'rounded-[8px] border p-3 text-center',
              wastePercent > 30 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
            )}>
              <p className={cn('text-[22px] font-black', wastePercent > 30 ? 'text-red-700' : 'text-emerald-700')}>{wastePercent}%</p>
              <p className={cn('text-[13px] font-semibold', wastePercent > 30 ? 'text-red-600' : 'text-emerald-600')}>Spild</p>
            </div>
            <div className="rounded-[8px] border border-border bg-card p-3 text-center">
              <TrendBadge current={wastePercent} previous={prevWastePercent} invertColors />
              <p className="text-[13px] text-muted-foreground mt-0.5">vs. forrige</p>
            </div>
          </div>

          {/* Area chart */}
          {wasteOverTimeData.length > 0 && (
            <div className="rounded-[8px] border border-border bg-card p-3">
              <p className="text-[13px] font-semibold text-muted-foreground mb-2">Spild over tid</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={wasteOverTimeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78766d' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#78766d' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13, padding: '8px 12px' }} />
                  <Area type="monotone" dataKey="used" stackId="1" stroke="#34C759" fill="#34C75920" strokeWidth={2.5} name="Brugt" />
                  <Area type="monotone" dataKey="thrown" stackId="1" stroke="#FF3B30" fill="#FF3B3020" strokeWidth={2.5} name="Smidt ud" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pie chart: waste by category */}
          {wasteByCategoryData.length > 0 && (
            <div className="rounded-[8px] border border-border bg-card p-3">
              <p className="text-[13px] font-semibold text-muted-foreground mb-2">Mest spildte kategorier</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={wasteByCategoryData}
                      dataKey="count"
                      nameKey="category"
                      cx="50%" cy="50%"
                      outerRadius={65}
                      innerRadius={38}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {wasteByCategoryData.map(entry => (
                        <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13, padding: '8px 12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {wasteByCategoryData.map(entry => (
                    <div key={entry.category} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.category] }} />
                      <span className="text-[13px] text-foreground flex-1 truncate">{entry.category}</span>
                      <span className="text-[13px] font-semibold text-foreground">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 3: MADFORBRUG                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <SectionHeader title="Madforbrug" />

      {usedItems.length === 0 ? (
        <EmptyState text="Marker varer som brugt i køleskabet for at se forbrug" />
      ) : (
        <>
          {/* Consumption by category - horizontal bars */}
          <div className="rounded-[8px] border border-border bg-card p-3">
            <p className="text-[13px] font-semibold text-muted-foreground mb-2">Forbrug pr. kategori</p>
            <ResponsiveContainer width="100%" height={Math.max(120, usedByCategoryData.length * 36)}>
              <BarChart data={usedByCategoryData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: '#4a4945' }} width={110} axisLine={false} tickLine={false} />
                <XAxis type="number" hide />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13, padding: '8px 12px' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20} name="Antal">
                  {usedByCategoryData.map(entry => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Meal plan adherence */}
          <div className="rounded-[8px] border border-border bg-card p-4">
            <p className="text-[13px] font-semibold text-muted-foreground mb-3">Madplan-overholdelse</p>
            <div className="flex items-center gap-5">
              <div className="relative">
                <ScoreRing
                  value={totalDaysInPeriod > 0 ? Math.round((uniqueMealDays / totalDaysInPeriod) * 100) : 0}
                  size={80}
                  strokeWidth={8}
                  color={uniqueMealDays >= totalDaysInPeriod * 0.7 ? '#34C759' : '#FFCC00'}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[18px] font-black text-foreground leading-none">{uniqueMealDays}</span>
                  <span className="text-[9px] text-muted-foreground">/{totalDaysInPeriod} dage</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">{periodMealPlans.length} måltider planlagt</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">{uniqueMealDays} af {totalDaysInPeriod} dage har en madplan</p>
                <div className="mt-2 h-2 w-full rounded-full overflow-hidden bg-secondary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${totalDaysInPeriod > 0 ? Math.round((uniqueMealDays / totalDaysInPeriod) * 100) : 0}%`,
                      backgroundColor: uniqueMealDays >= totalDaysInPeriod * 0.7 ? '#34C759' : '#FFCC00',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nutrition balance */}
          {nutritionTotals.total > 0 && (
            <div className="rounded-[8px] border border-border bg-card p-4">
              <p className="text-[13px] font-semibold text-muted-foreground mb-3">Ernæringsbalance (forbrugte varer)</p>
              <div className="h-4 w-full rounded-full overflow-hidden flex">
                <div className="h-full bg-[#3b82f6]" style={{ width: `${nutritionTotals.proteinPct}%` }} />
                <div className="h-full bg-[#f59e0b]" style={{ width: `${nutritionTotals.carbsPct}%` }} />
                <div className="h-full bg-[#ef4444]" style={{ width: `${nutritionTotals.fatPct}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                  <span className="text-[12px] text-foreground">Protein {nutritionTotals.proteinPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                  <span className="text-[12px] text-foreground">Kulhydrater {nutritionTotals.carbsPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#ef4444]" />
                  <span className="text-[12px] text-foreground">Fedt {nutritionTotals.fatPct}%</span>
                </div>
              </div>
            </div>
          )}

          {/* NutriScore distribution */}
          {nutriScoreDistribution && (
            <div className="rounded-[8px] border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold text-muted-foreground">NutriScore-fordeling</p>
                <NutriScoreBadge grade={nutriScoreDistribution.avgGrade} size="sm" />
              </div>
              <div className="h-6 w-full rounded-full overflow-hidden flex">
                {nutriScoreDistribution.data.map(d => (
                  <div key={d.grade} className="h-full relative" style={{ width: `${d.pct}%`, backgroundColor: d.color }}>
                    {d.pct >= 12 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{d.grade}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {nutriScoreDistribution.data.map(d => (
                  <div key={d.grade} className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] text-foreground">{d.grade} ({d.pct}%)</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">{nutriScoreDistribution.matched} af {usedItems.length} varer med NutriScore-data</p>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 4: ØKONOMI & FORBRUG                              */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <SectionHeader title="Økonomi & forbrug" />

      {foodExpenses.length === 0 && totalFoodSpending === 0 ? (
        <EmptyState text="Tilføj udgifter med kategorien 'Mad' for at se forbrugsoversigt" />
      ) : (
        <>
          {/* Big numbers */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[8px] border border-border bg-card p-3 text-center">
              <p className="text-[28px] font-black text-foreground leading-none">{totalFoodSpending.toLocaleString('da-DK')}</p>
              <p className="text-[13px] text-muted-foreground mt-1">kr brugt på mad</p>
            </div>
            <div className="rounded-[8px] border border-border bg-card p-3 text-center">
              <TrendBadge current={totalFoodSpending} previous={prevFoodSpending} invertColors />
              <p className="text-[13px] text-muted-foreground mt-1">vs. forrige periode</p>
            </div>
          </div>

          {/* Spending over time */}
          {spendingOverTimeData.length > 0 && (
            <div className="rounded-[8px] border border-border bg-card p-3">
              <p className="text-[13px] font-semibold text-muted-foreground mb-2">Forbrugstrend</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={spendingOverTimeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78766d' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#78766d' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(0)} kr`, 'Forbrug']}
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13, padding: '8px 12px' }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#f58a2d" strokeWidth={2.5} dot={{ fill: '#f58a2d', r: 3 }} name="Forbrug" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Budget status */}
          {foodBudget > 0 ? (
            <div className="rounded-[8px] border border-border bg-card p-4">
              <p className="text-[13px] font-semibold text-muted-foreground mb-2">Budgetstatus</p>
              <div className="flex items-end justify-between mb-2">
                <span className="text-[15px] font-bold text-foreground">{totalFoodSpending.toLocaleString('da-DK')} kr</span>
                <span className="text-[14px] text-muted-foreground">af {foodBudget.toLocaleString('da-DK')} kr</span>
              </div>
              <div className="h-3 w-full rounded-full overflow-hidden bg-secondary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((totalFoodSpending / foodBudget) * 100))}%`,
                    backgroundColor: totalFoodSpending > foodBudget ? '#FF3B30' : '#34C759',
                  }}
                />
              </div>
              {totalFoodSpending > foodBudget && (
                <p className="text-[13px] text-[#FF3B30] font-semibold mt-1.5">
                  {(totalFoodSpending - foodBudget).toLocaleString('da-DK')} kr over budget
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-[8px] border border-dashed border-border bg-card p-4 text-center">
              <p className="text-[14px] text-muted-foreground">Intet madbudget sat endnu</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">Tilføj et budget under Budget-fanen</p>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 5: BESPARELSER                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <SectionHeader title="Besparelser" />

      {estimatedSavings > 0 ? (
        <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-[28px] font-black text-emerald-700 leading-none">~{estimatedSavings.toLocaleString('da-DK')} kr</p>
          <p className="text-[14px] text-emerald-600 font-semibold mt-1">Potentiel besparelse</p>
          <p className="text-[13px] text-emerald-500 mt-0.5">Hvis du halverer dit madspild</p>
        </div>
      ) : (
        <div className="rounded-[8px] border border-border bg-card p-4 text-center">
          <p className="text-[13px] font-semibold text-foreground">Godt klaret!</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">Intet spild registreret i denne periode</p>
        </div>
      )}

      <div className="rounded-[8px] border border-dashed border-border bg-card p-4 text-center">
        <p className="text-[14px] font-semibold text-muted-foreground">Tilbudsdata</p>
        <p className="text-[13px] text-muted-foreground mt-0.5">Kommende funktion — følg med</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 6: KØLESKABSUDNYTTELSE                           */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <SectionHeader title="Køleskabsudnyttelse" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[8px] border border-border bg-card p-3 text-center">
          <p className="text-[22px] font-black text-foreground">{fridgeItems.length}</p>
          <p className="text-[13px] text-muted-foreground">Varer nu</p>
        </div>
        <div className="rounded-[8px] border border-border bg-card p-3 text-center">
          <p className="text-[22px] font-black text-foreground">{avgShelfLife}</p>
          <p className="text-[13px] text-muted-foreground">Gns. dage</p>
        </div>
        <div className={cn(
          'rounded-[8px] border p-3 text-center',
          wastePercent < 20 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
        )}>
          <p className={cn('text-[22px] font-black', wastePercent < 20 ? 'text-emerald-700' : 'text-amber-700')}>
            {100 - wastePercent}%
          </p>
          <p className={cn('text-[13px] font-semibold', wastePercent < 20 ? 'text-emerald-600' : 'text-amber-600')}>
            Udnyttelse
          </p>
        </div>
      </div>

      {/* Fridge activity stacked bar */}
      {fridgeActivityData.length > 0 && periodHistory.length > 0 && (
        <div className="rounded-[8px] border border-border bg-card p-3">
          <p className="text-[13px] font-semibold text-muted-foreground mb-2">Køleskabsaktivitet</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={fridgeActivityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78766d' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#78766d' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13, padding: '8px 12px' }} />
              <Bar dataKey="used" stackId="a" fill="#34C759" radius={[0, 0, 0, 0]} name="Brugt" />
              <Bar dataKey="thrown" stackId="a" fill="#FF3B30" radius={[4, 4, 0, 0]} name="Smidt ud" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 7: INDKØB & MADPLAN (bonus)                      */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <SectionHeader title="Indkøb & madplan" />

      <div className="grid grid-cols-2 gap-2">
        {/* Shopping completion */}
        <div className="rounded-[8px] border border-border bg-card p-3 text-center">
          <p className="text-[22px] font-black text-foreground">{shoppingCompletion.pct}%</p>
          <p className="text-[13px] text-muted-foreground">Indkøbt</p>
          <p className="text-[12px] text-muted-foreground">{shoppingCompletion.purchased}/{shoppingCompletion.total} varer</p>
        </div>

        {/* Meal plan week dots */}
        <div className="rounded-[8px] border border-border bg-card p-3">
          <p className="text-[13px] text-muted-foreground mb-2 text-center">Ugens madplan</p>
          <div className="flex justify-center gap-1.5">
            {mealPlanDots.map(d => (
              <div key={d.day} className="flex flex-col items-center gap-1">
                <div className={cn(
                  'h-3 w-3 rounded-full',
                  d.hasPlans ? 'bg-[#34C759]' : 'bg-muted'
                )} />
                <span className="text-[8px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
