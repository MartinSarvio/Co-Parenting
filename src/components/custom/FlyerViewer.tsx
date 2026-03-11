import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, X, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { shoppingItemId } from '@/lib/id';
import { FLYERS, fetchFlyerPageData, getPageImageUrl } from '@/lib/etilbudsavis';
import type { FlyerPageData, FlyerProduct, iPaperEnrichment } from '@/lib/etilbudsavis';

export function FlyerViewer() {
  const { viewerFlyerId, setViewerFlyerId, addShoppingItem, currentUser } = useAppStore();
  const flyer = FLYERS.find(f => f.id === viewerFlyerId) ?? null;
  const open = !!flyer;

  const [pageData, setPageData] = useState<FlyerPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);

  // Image aspect ratio for max-height constraint
  const [imageAspect, setImageAspect] = useState(1.42); // default ~A4 portrait

  // Product popover state
  const [selectedHotspot, setSelectedHotspot] = useState<{
    enrichment: iPaperEnrichment;
    product?: FlyerProduct;
  } | null>(null);
  const [productName, setProductName] = useState('');
  const [addedFeedback, setAddedFeedback] = useState(false);

  const close = useCallback(() => {
    setViewerFlyerId(null);
    setSelectedHotspot(null);
    setProductName('');
  }, [setViewerFlyerId]);

  // Fetch page data when flyer changes
  useEffect(() => {
    if (!flyer) return;
    setLoading(true);
    setError(false);
    setCurrentPage(0);
    setPageData(null);
    setSelectedHotspot(null);

    fetchFlyerPageData(flyer.embedUrl).then(data => {
      if (data) {
        setPageData(data);
        setLoading(false);
      } else {
        setError(true);
        setLoading(false);
      }
    });
  }, [flyer?.id]);

  // Prevent background scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, close]);

  const pageCount = pageData?.pageCount ?? flyer?.pages ?? 0;

  const goToPage = useCallback((page: number) => {
    setDirection(page > currentPage ? 1 : -1);
    setCurrentPage(page);
    setSelectedHotspot(null);
    setProductName('');
  }, [currentPage]);

  const nextPage = useCallback(() => {
    if (currentPage < pageCount - 1) goToPage(currentPage + 1);
  }, [currentPage, pageCount, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Swipe handling
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) nextPage();
      else prevPage();
    }
    touchStart.current = null;
  }, [nextPage, prevPage]);

  // Page image URL
  const currentImageUrl = pageData ? getPageImageUrl(pageData, currentPage + 1) : null;

  // Preload adjacent pages
  useEffect(() => {
    if (!pageData) return;
    [currentPage + 1, currentPage + 2].filter(p => p < pageCount).forEach(p => {
      const img = new Image();
      img.src = getPageImageUrl(pageData, p + 1);
    });
  }, [currentPage, pageData, pageCount]);

  // Measure image aspect ratio on first load
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setImageAspect(img.naturalHeight / img.naturalWidth);
    }
  }, []);

  // Enrichment hotspots for current page
  const pageEnrichments = pageData?.enrichments.filter(e => e.pageIndex === currentPage) ?? [];

  // Hardcoded products for current page (1-indexed)
  const hardcodedProducts = flyer?.productMap?.[currentPage + 1] ?? [];

  // Match enrichment to hardcoded product by overlap
  const findMatchingProduct = useCallback((enrichment: iPaperEnrichment): FlyerProduct | undefined => {
    return hardcodedProducts.find(p => {
      const overlapX = Math.max(0, Math.min(p.x + p.width, enrichment.x + enrichment.width) - Math.max(p.x, enrichment.x));
      const overlapY = Math.max(0, Math.min(p.y + p.height, enrichment.y + enrichment.height) - Math.max(p.y, enrichment.y));
      return overlapX > 0 && overlapY > 0;
    });
  }, [hardcodedProducts]);

  // Handle hotspot tap
  const handleHotspotTap = useCallback((enrichment: iPaperEnrichment) => {
    const product = findMatchingProduct(enrichment);
    setSelectedHotspot({ enrichment, product });
    setProductName(product?.name ?? '');
    setAddedFeedback(false);
  }, [findMatchingProduct]);

  // Add to shopping list
  const handleAddToCart = useCallback(() => {
    if (!productName.trim()) return;
    addShoppingItem({
      id: shoppingItemId(),
      name: productName.trim(),
      quantity: '1',
      purchased: false,
      addedBy: currentUser?.id || '',
      category: selectedHotspot?.product?.category || 'Tilbud',
    });
    toast.success(`${productName.trim()} tilføjet`);
    setAddedFeedback(true);
    setTimeout(() => {
      setSelectedHotspot(null);
      setProductName('');
      setAddedFeedback(false);
    }, 600);
  }, [productName, addShoppingItem, currentUser?.id, selectedHotspot]);

  // Calculate max-height: image height + header (~52px) + page indicator (~40px)
  const sheetMaxHeight = `min(${imageAspect * 100}vw + 92px, 92vh)`;

  const slideVariants = {
    enter: (d: number) => ({ x: d >= 0 ? '40%' : '-40%', opacity: 0 }),
    center: { x: '0%', opacity: 1 },
    exit: (d: number) => ({ x: d >= 0 ? '-40%' : '40%', opacity: 0 }),
  };

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

          {/* Bottom Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[81] mx-auto max-w-[430px] flex flex-col bg-[#f7f6f2] rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
            style={{ maxHeight: sheetMaxHeight }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-[#d8d7cf]" />
            </div>

            {/* Header: store name + page counter + close */}
            <div className="flex items-center justify-between px-4 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ backgroundColor: flyer?.storeColor }}
                >
                  {flyer?.storeInitial}
                </div>
                <span className="text-[15px] font-bold text-[#2f2f2d]">{flyer?.store}</span>
              </div>
              <div className="flex items-center gap-3">
                {!loading && !error && (
                  <span className="text-[12px] font-semibold text-[#9a978f]">
                    {currentPage + 1} / {pageCount}
                  </span>
                )}
                <button
                  onClick={close}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8e7e2] active:scale-95 transition-transform"
                >
                  <X className="h-3.5 w-3.5 text-[#78766d]" />
                </button>
              </div>
            </div>

            {/* Page content */}
            <div className="flex-1 relative overflow-hidden">
              {/* Loading */}
              {loading && !error && (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-[#78766d]" />
                    <p className="text-[13px] text-[#9a978f]">Indlæser tilbudsavis...</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3 px-8 text-center">
                    {!flyer?.hasFlyer ? (
                      <>
                        <p className="text-[14px] font-semibold text-[#2f2f2d]">Avisen er ikke tilgængelig i appen</p>
                        <p className="text-[13px] text-[#9a978f]">Se tilbudsavisen direkte på {flyer?.store}s hjemmeside</p>
                        <a
                          href={flyer?.webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-[13px] font-semibold active:scale-[0.97] transition-transform"
                          style={{ backgroundColor: flyer?.storeColor }}
                        >
                          Åbn {flyer?.store}.dk
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </>
                    ) : (
                      <>
                        <p className="text-[14px] font-semibold text-[#2f2f2d]">Kunne ikke indlæse avisen</p>
                        <p className="text-[13px] text-[#9a978f]">Prøv igen senere.</p>
                      </>
                    )}
                    <button
                      onClick={close}
                      className="mt-2 px-4 py-2 rounded-full bg-[#2f2f2f] text-white text-[13px] font-semibold active:scale-[0.97] transition-transform"
                    >
                      Luk
                    </button>
                  </div>
                </div>
              )}

              {/* Page viewer */}
              {!loading && !error && currentImageUrl && (
                <div
                  className="relative overflow-hidden"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                      key={currentPage}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="relative w-full shrink-0"
                    >
                      <img
                        src={currentImageUrl}
                        alt={`${flyer?.store} side ${currentPage + 1}`}
                        className="w-full h-auto"
                        draggable={false}
                        onLoad={handleImageLoad}
                      />

                      {/* Enrichment hotspots */}
                      {pageEnrichments.map((enrichment, i) => (
                        <button
                          key={`e-${enrichment.pageIndex}-${i}`}
                          onClick={(e) => { e.stopPropagation(); handleHotspotTap(enrichment); }}
                          className="absolute rounded active:bg-[#f58a2d]/15 transition-colors"
                          style={{
                            left: `${enrichment.x * 100}%`,
                            top: `${enrichment.y * 100}%`,
                            width: `${enrichment.width * 100}%`,
                            height: `${enrichment.height * 100}%`,
                          }}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation arrows */}
                  {pageCount > 1 && (
                    <>
                      {currentPage > 0 && (
                        <button
                          onClick={prevPage}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-lg active:scale-95 transition-transform"
                        >
                          <ChevronLeft className="h-4 w-4 text-[#2f2f2d]" />
                        </button>
                      )}
                      {currentPage < pageCount - 1 && (
                        <button
                          onClick={nextPage}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-lg active:scale-95 transition-transform"
                        >
                          <ChevronRight className="h-4 w-4 text-[#2f2f2d]" />
                        </button>
                      )}
                    </>
                  )}

                  {/* Product popover */}
                  <AnimatePresence>
                    {selectedHotspot && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-20 left-2 right-2"
                        style={{
                          // Position below the hotspot, clamped to stay visible
                          top: `${Math.min((selectedHotspot.enrichment.y + selectedHotspot.enrichment.height) * 100, 70)}%`,
                        }}
                      >
                        <div className="bg-white rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.18)] p-3 flex flex-col gap-2">
                          {/* Name input */}
                          <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Produktnavn..."
                            className="w-full rounded-lg border border-[#e5e3dc] bg-[#f8f7f3] px-3 py-2 text-[14px] text-[#2f2f2d] placeholder:text-[#b5b3ab] outline-none focus:border-[#f58a2d] transition-colors"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddToCart(); }}
                          />

                          <div className="flex items-center gap-2">
                            {/* Price badge */}
                            {selectedHotspot.product?.price && (
                              <span className="text-[13px] font-bold text-[#f58a2d] bg-[#f58a2d]/10 px-2 py-0.5 rounded-full">
                                {selectedHotspot.product.price}
                              </span>
                            )}

                            <div className="flex-1" />

                            {/* Cancel */}
                            <button
                              onClick={() => { setSelectedHotspot(null); setProductName(''); }}
                              className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#78766d] active:bg-[#e8e7e2] transition-colors"
                            >
                              Annuller
                            </button>

                            {/* Add to cart */}
                            <button
                              onClick={handleAddToCart}
                              disabled={!productName.trim() || addedFeedback}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f58a2d] text-[13px] font-semibold text-white active:scale-[0.97] transition-all disabled:opacity-40"
                            >
                              {addedFeedback ? (
                                <><Check className="h-3.5 w-3.5" /> Tilføjet</>
                              ) : (
                                <><ShoppingCart className="h-3.5 w-3.5" /> Tilføj</>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
