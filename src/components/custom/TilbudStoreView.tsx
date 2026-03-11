import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FLYERS, STORE_CATALOGS, getCategoriesForStore, getFlyerStoreSlug, type CatalogProduct } from '@/lib/etilbudsavis';
import { calculateUnitPrice } from '@/lib/unitPrice';
import { CatalogProductCard } from './CatalogProductCard';
import { ProductActionSheet } from './ProductActionSheet';
import { TilbudSearchSheet } from './TilbudSearchSheet';
import { TilbudFilterSheet, DEFAULT_FILTERS, hasActiveFilters, type TilbudFilters } from './TilbudFilterSheet';
import { useNutriScoreMap, matchNutriScore, nutriScoreToNumber } from '@/hooks/useNutriScoreMap';

interface TilbudStoreViewProps {
  storeId: string;
  addedCatalogId: string | null;
  inCartNames?: Set<string>;
  onAddProduct: (product: CatalogProduct, quantity?: number) => void;
  onAddToWishlist: (product: CatalogProduct) => void;
}

export function TilbudStoreView({ storeId, addedCatalogId, inCartNames, onAddProduct, onAddToWishlist }: TilbudStoreViewProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<TilbudFilters>(DEFAULT_FILTERS);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const nutriMap = useNutriScoreMap();

  const storeFlyer = FLYERS.find(f => f.id === storeId);
  const catalogKey = storeFlyer ? getFlyerStoreSlug(storeFlyer) : storeId;
  const storeCatalog = STORE_CATALOGS[catalogKey] || [];
  const allCategories = getCategoriesForStore(catalogKey);

  const isInCart = (product: CatalogProduct) => {
    if (!inCartNames?.size) return false;
    const fullName = `${product.name}${product.unit ? ` (${product.unit})` : ''}`.toLowerCase();
    return inCartNames.has(fullName);
  };

  // Apply filters + sort
  const filteredCatalog = useMemo(() => {
    let result = [...storeCatalog];

    // Category filter
    if (filters.enabledCategories.size > 0) {
      result = result.filter(p => filters.enabledCategories.has(p.category));
    }

    // NutriScore filter
    if (filters.nutriScoreFilter.size > 0) {
      result = result.filter(p => {
        const grade = matchNutriScore(p.name, nutriMap);
        return grade ? filters.nutriScoreFilter.has(grade) : false;
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'budget':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'kilopris': {
        const getUP = (p: CatalogProduct) => calculateUnitPrice(p.price, p.unit)?.unitPrice ?? Infinity;
        result.sort((a, b) => getUP(a) - getUP(b));
        break;
      }
      case 'besparelse': {
        const getSaving = (p: CatalogProduct) => {
          if (!p.originalPrice) return 0;
          return ((p.originalPrice - p.price) / p.originalPrice) * 100;
        };
        result.sort((a, b) => getSaving(b) - getSaving(a));
        break;
      }
      case 'sundhed': {
        result.sort((a, b) =>
          nutriScoreToNumber(matchNutriScore(a.name, nutriMap)) -
          nutriScoreToNumber(matchNutriScore(b.name, nutriMap))
        );
        break;
      }
    }

    return result;
  }, [storeCatalog, filters, nutriMap]);

  // Get categories from filtered results
  const visibleCategories = useMemo(() => {
    if (filters.sortBy !== 'default') {
      // When sorted, show all as one flat list (no category grouping)
      return null;
    }
    if (filters.enabledCategories.size > 0) {
      return allCategories.filter(c => filters.enabledCategories.has(c));
    }
    return allCategories;
  }, [allCategories, filters]);

  return (
    <>
      {/* ── Product rows ── */}
      {visibleCategories ? (
        // Grouped by category
        visibleCategories.map((category) => {
          const products = filteredCatalog.filter(p => p.category === category);
          if (products.length === 0) return null;
          return (
            <div key={category}>
              <p className="text-[13px] font-semibold text-[#2f2f2d] px-1 mb-2">{category}</p>
              <div className="flex gap-2 overflow-x-auto snap-x pt-3 pb-2 scrollbar-hide -mx-2 px-2">
                {products.map((product) => (
                  <CatalogProductCard
                    key={product.id}
                    product={product}
                    storeColor={storeFlyer?.storeColor || '#78766d'}
                    isAdded={addedCatalogId === product.id}
                    inCart={isInCart(product)}
                    nutriscoreGrade={matchNutriScore(product.name, nutriMap)}
                    onSelect={setSelectedProduct}
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        // Flat sorted list (no category grouping)
        <div>
          <p className="text-[13px] font-semibold text-[#2f2f2d] px-1 mb-2">
            {filters.sortBy === 'budget' ? 'Billigst først' : filters.sortBy === 'kilopris' ? 'Laveste kilopris' : filters.sortBy === 'sundhed' ? 'Sundest først' : 'Størst rabat'}
          </p>
          <div className="flex gap-2 overflow-x-auto snap-x pt-3 pb-2 scrollbar-hide -mx-2 px-2">
            {filteredCatalog.map((product) => (
              <CatalogProductCard
                key={product.id}
                product={product}
                storeColor={storeFlyer?.storeColor || '#78766d'}
                isAdded={addedCatalogId === product.id}
                inCart={isInCart(product)}
                nutriscoreGrade={matchNutriScore(product.name, nutriMap)}
                onSelect={setSelectedProduct}
              />
            ))}
          </div>
        </div>
      )}

      {filteredCatalog.length === 0 && (
        <p className="text-[13px] text-[#9a978f] py-4 px-2 text-center">Ingen produkter matcher dine filtre</p>
      )}

      <div className="h-16" />

      {/* ── FABs ── */}
      <div
        className="fixed left-4 z-10 flex flex-col gap-2"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <button
          onClick={() => setShowFilter(true)}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-colors",
            hasActiveFilters(filters)
              ? "bg-[#f58a2d] text-white"
              : "bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
          )}
          aria-label="Filter"
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => setShowSearch(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2f2f2f] text-white shadow-lg hover:bg-[#1a1a1a] transition-colors"
          aria-label="Søg"
        >
          <Search className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* ── Sheets ── */}
      <TilbudSearchSheet
        open={showSearch}
        onOpenChange={setShowSearch}
        storeId={storeId}
        addedCatalogId={addedCatalogId}
        onAddProduct={onAddProduct}
      />
      <TilbudFilterSheet
        open={showFilter}
        onOpenChange={setShowFilter}
        filters={filters}
        onFiltersChange={setFilters}
        storeId={storeId}
        availableCategories={allCategories}
      />
      <ProductActionSheet
        open={!!selectedProduct}
        onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
        product={selectedProduct}
        storeColor={storeFlyer?.storeColor || '#78766d'}
        onAddToShopping={(product, quantity) => {
          onAddProduct(product, quantity);
          setSelectedProduct(null);
        }}
        onAddToWishlist={(product) => {
          onAddToWishlist(product);
          setSelectedProduct(null);
        }}
      />
    </>
  );
}
