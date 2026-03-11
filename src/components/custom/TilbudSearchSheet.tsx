import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { CatalogProductCard } from './CatalogProductCard';
import { StoreBadge } from './StoreBadge';
import { STORE_CATALOGS, FLYERS, type CatalogProduct } from '@/lib/etilbudsavis';

interface SearchResult extends CatalogProduct {
  storeId: string;
}

interface TilbudSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  addedCatalogId: string | null;
  onAddProduct: (product: CatalogProduct) => void;
}

export function TilbudSearchSheet({ open, onOpenChange, storeId, addedCatalogId, onAddProduct }: TilbudSearchSheetProps) {
  const [query, setQuery] = useState('');
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, close]);

  // Prevent background scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset query on close
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const entries = storeId
      ? [[storeId, STORE_CATALOGS[storeId] || []] as const]
      : Object.entries(STORE_CATALOGS);

    return entries.flatMap(([sid, products]) =>
      (products as CatalogProduct[])
        .filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
        .map(p => ({ ...p, storeId: sid as string }))
    ).slice(0, 30);
  }, [query, storeId]);

  // Group results by store
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      const arr = map.get(r.storeId) || [];
      arr.push(r);
      map.set(r.storeId, arr);
    }
    return map;
  }, [results]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[80] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />

          {/* Top sheet */}
          <motion.div
            className="fixed inset-x-0 top-0 z-[81] mx-auto max-w-[430px] flex flex-col bg-[#f7f6f2] rounded-b-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] max-h-[70vh]"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            {/* Header with search */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a978f]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={storeId ? `Søg i ${FLYERS.find(f => f.id === storeId)?.store || 'butik'}...` : 'Søg tilbud...'}
                  className="w-full rounded-xl border border-[#e5e3dc] bg-white pl-9 pr-9 py-2.5 text-[14px] text-[#2f2f2d] placeholder:text-[#c5c3ba] focus:outline-none focus:ring-1 focus:ring-[#f58a2d]"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#e5e3dc] flex items-center justify-center"
                  >
                    <X className="h-3 w-3 text-[#78766d]" />
                  </button>
                )}
              </div>
              <button
                onClick={close}
                className="text-[14px] font-semibold text-[#78766d]"
              >
                Luk
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 space-y-4">
              {query.length >= 2 && results.length === 0 && (
                <p className="text-center text-[13px] text-[#9a978f] py-6">Ingen resultater for &ldquo;{query}&rdquo;</p>
              )}

              {query.length < 2 && (
                <p className="text-center text-[13px] text-[#9a978f] py-6">Skriv mindst 2 tegn for at søge</p>
              )}

              {[...grouped.entries()].map(([sid, products]) => {
                const flyer = FLYERS.find(f => f.id === sid);
                return (
                  <div key={sid}>
                    {!storeId && (
                      <div className="flex items-center gap-2 mb-2">
                        <StoreBadge storeId={sid} size="sm" />
                        <span className="text-[13px] font-semibold text-[#2f2f2d]">{flyer?.store || sid}</span>
                      </div>
                    )}
                    <div className="flex gap-2 overflow-x-auto snap-x pb-2 scrollbar-hide -mx-4 px-4">
                      {products.map((product) => (
                        <CatalogProductCard
                          key={product.id}
                          product={product}
                          storeColor={flyer?.storeColor || '#78766d'}
                          isAdded={addedCatalogId === product.id}
                          onSelect={onAddProduct}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom handle */}
            <div className="flex justify-center pb-3 pt-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-[#d8d7cf]" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
