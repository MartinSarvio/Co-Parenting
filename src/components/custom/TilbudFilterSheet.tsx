import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { StoreBadge } from './StoreBadge';
import { FLYERS, getFlyerStoreSlug } from '@/lib/etilbudsavis';

export interface TilbudFilters {
  sortBy: 'default' | 'budget' | 'kilopris' | 'besparelse' | 'sundhed';
  enabledCategories: Set<string>;
  enabledStores: Set<string>;
  nutriScoreFilter: Set<string>;
}

export const DEFAULT_FILTERS: TilbudFilters = {
  sortBy: 'default',
  enabledCategories: new Set(),
  enabledStores: new Set(),
  nutriScoreFilter: new Set(),
};

export function hasActiveFilters(f: TilbudFilters): boolean {
  return f.sortBy !== 'default' || f.enabledCategories.size > 0 || f.enabledStores.size > 0 || f.nutriScoreFilter.size > 0;
}

interface TilbudFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TilbudFilters;
  onFiltersChange: (filters: TilbudFilters) => void;
  storeId: string | null;
  availableCategories: string[];
}

const SORT_OPTIONS = [
  { key: 'budget' as const, label: 'Billigst' },
  { key: 'kilopris' as const, label: 'Kilopris' },
  { key: 'besparelse' as const, label: 'Størst rabat' },
  { key: 'sundhed' as const, label: 'Sundest' },
];

const NUTRISCORE_GRADES = [
  { grade: 'a', label: 'A', color: '#038141' },
  { grade: 'b', label: 'B', color: '#85BB2F' },
  { grade: 'c', label: 'C', color: '#FECB02' },
  { grade: 'd', label: 'D', color: '#EE8100' },
  { grade: 'e', label: 'E', color: '#E63E11' },
];

export function TilbudFilterSheet({ open, onOpenChange, filters, onFiltersChange, storeId, availableCategories }: TilbudFilterSheetProps) {
  const toggleSort = (key: typeof filters.sortBy) => {
    onFiltersChange({ ...filters, sortBy: filters.sortBy === key ? 'default' : key });
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(filters.enabledCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    onFiltersChange({ ...filters, enabledCategories: next });
  };

  const toggleStore = (sid: string) => {
    const next = new Set(filters.enabledStores);
    if (next.has(sid)) next.delete(sid);
    else next.add(sid);
    onFiltersChange({ ...filters, enabledStores: next });
  };

  const toggleNutriScore = (grade: string) => {
    const next = new Set(filters.nutriScoreFilter);
    if (next.has(grade)) next.delete(grade);
    else next.add(grade);
    onFiltersChange({ ...filters, nutriScoreFilter: next });
  };

  const reset = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Filtre">
      <div className="space-y-5 pb-4">

        {/* Sortering */}
        <div>
          <p className="text-[12px] font-semibold text-[#9a978f] uppercase tracking-wider mb-2">Sortering</p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => toggleSort(opt.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors",
                  filters.sortBy === opt.key
                    ? "bg-[#2f2f2f] text-white"
                    : "bg-[#eceae2] text-[#5f5d56]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kategorier */}
        {availableCategories.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-[#9a978f] uppercase tracking-wider">Kategorier</p>
              {filters.enabledCategories.size > 0 && (
                <button
                  onClick={() => onFiltersChange({ ...filters, enabledCategories: new Set() })}
                  className="text-[11px] font-semibold text-[#f58a2d]"
                >
                  Vis alle
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                    filters.enabledCategories.has(cat)
                      ? "bg-[#f58a2d] text-white"
                      : filters.enabledCategories.size > 0
                        ? "bg-[#eceae2] text-[#9a978f]"
                        : "bg-[#eceae2] text-[#5f5d56]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nutri-Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold text-[#9a978f] uppercase tracking-wider">Nutri-Score</p>
            {filters.nutriScoreFilter.size > 0 && (
              <button
                onClick={() => onFiltersChange({ ...filters, nutriScoreFilter: new Set() })}
                className="text-[11px] font-semibold text-[#f58a2d]"
              >
                Vis alle
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {NUTRISCORE_GRADES.map(({ grade, label, color }) => {
              const active = filters.nutriScoreFilter.size === 0 || filters.nutriScoreFilter.has(grade);
              return (
                <button
                  key={grade}
                  onClick={() => toggleNutriScore(grade)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-bold transition-all",
                    filters.nutriScoreFilter.has(grade)
                      ? "ring-2 ring-offset-2 ring-[#2f2f2f] scale-110"
                      : !active ? "opacity-30" : ""
                  )}
                  style={{ backgroundColor: color, color: grade === 'c' ? '#2f2f2d' : '#fff' }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Butikker (kun på hovedsiden) */}
        {storeId === null && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-[#9a978f] uppercase tracking-wider">Butikker</p>
              {filters.enabledStores.size > 0 && (
                <button
                  onClick={() => onFiltersChange({ ...filters, enabledStores: new Set() })}
                  className="text-[11px] font-semibold text-[#f58a2d]"
                >
                  Vis alle
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {FLYERS.filter((flyer, _i, arr) => {
                const slug = getFlyerStoreSlug(flyer);
                return arr.findIndex(f => getFlyerStoreSlug(f) === slug) === arr.indexOf(flyer);
              }).map(flyer => {
                const slug = getFlyerStoreSlug(flyer);
                const active = filters.enabledStores.size === 0 || filters.enabledStores.has(slug);
                return (
                  <button
                    key={slug}
                    onClick={() => toggleStore(slug)}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-opacity",
                      !active && "opacity-30"
                    )}
                  >
                    <StoreBadge storeId={slug} size="md" />
                    <span className="text-[10px] font-semibold text-[#5f5d56]">{flyer.store}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Nulstil */}
        {hasActiveFilters(filters) && (
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#eceae2] text-[13px] font-semibold text-[#5f5d56] active:scale-[0.98] transition-transform"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Nulstil filtre
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
