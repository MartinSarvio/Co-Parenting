import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, Check, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FLYERS, getFlyerStoreSlug } from '@/lib/etilbudsavis';
import { calculateUnitPrice } from '@/lib/unitPrice';
import type { Offer } from '@/lib/offers';
import { OfferCard } from './OfferCard';
import { StoreBadge } from './StoreBadge';
import { TilbudSearchSheet } from './TilbudSearchSheet';
import { TilbudFilterSheet, DEFAULT_FILTERS, hasActiveFilters, type TilbudFilters } from './TilbudFilterSheet';
import { GiftOfferDetailSheet } from './GiftOfferDetailSheet';
import { OfferActionSheet } from './OfferActionSheet';
import { ProductCropImage } from './ProductCropImage';
import type { CatalogProduct } from '@/lib/etilbudsavis';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import { useNutriScoreMap, matchNutriScore, nutriScoreToNumber } from '@/hooks/useNutriScoreMap';
import { NutriScoreBadge } from './NutriScoreBadge';
import { getStoreInfoByName } from '@/lib/storeLogos';
import { useAppStore } from '@/store';

interface AffiliateAd {
  id: string;
  name: string;
  url: string;
  store: string | null;
  category: string | null;
  banner_image: string | null;
  banner_position_y: number;
  banner_color?: string;
  banner_subtitle?: string;
}

const DEFAULT_SPONSORS: AffiliateAd[] = [
  {
    id: 'bulk-dk',
    name: 'Bulk',
    url: 'https://www.awin1.com/cread.php?s=2784306&v=18540&q=403732&r=900803',
    store: 'Bulk',
    category: 'Kosttilskud',
    banner_image: 'https://www.awin1.com/cshow.php?s=2784306&v=18540&q=403732&r=900803',
    banner_position_y: 50,
  },
  {
    id: 'nelly-dk',
    name: 'Nelly',
    url: 'https://www.awin1.com/cread.php?s=4696224&v=19564&q=589370&r=900803',
    store: 'Nelly',
    category: 'Mode',
    banner_image: 'https://www.awin1.com/cshow.php?s=4696224&v=19564&q=589370&r=900803',
    banner_position_y: 50,
  },
  {
    id: 'myprotein-dk-1',
    name: 'Myprotein',
    url: 'https://www.awin1.com/cread.php?s=3487002&v=8983&q=349344&r=900803',
    store: 'Myprotein',
    category: 'Kosttilskud',
    banner_image: 'https://www.awin1.com/cshow.php?s=3487002&v=8983&q=349344&r=900803',
    banner_position_y: 50,
  },
  {
    id: 'myprotein-dk-2',
    name: 'Myprotein',
    url: 'https://www.awin1.com/cread.php?s=4680362&v=8983&q=596085&r=900803',
    store: 'Myprotein',
    category: 'Kosttilskud',
    banner_image: 'https://www.awin1.com/cshow.php?s=4680362&v=8983&q=596085&r=900803',
    banner_position_y: 50,
  },
];

interface TilbudMainPageProps {
  offers: Offer[];
  giftOffers: Offer[];
  addedOfferId: string | null;
  addedCatalogId: string | null;
  inCartNames?: Set<string>;
  onSelectStore: (storeId: string) => void;
  onAddOffer: (offer: Offer, quantity?: number) => void;
  onRemoveOffer?: (offer: Offer) => void;
  onAddGift: (offer: Offer) => void;
  onAddCatalogProduct: (product: CatalogProduct) => void;
  onBack: () => void;
}

export function TilbudMainPage({
  offers,
  giftOffers,
  addedOfferId,
  addedCatalogId,
  inCartNames,
  onSelectStore,
  onAddOffer,
  onRemoveOffer,
  onAddGift,
  onAddCatalogProduct,
  onBack,
}: TilbudMainPageProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<TilbudFilters>(DEFAULT_FILTERS);
  const [selectedGift, setSelectedGift] = useState<Offer | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [affiliateAds, setAffiliateAds] = useState<AffiliateAd[]>([]);
  const [uploadedBatches, setUploadedBatches] = useState<{ id: string; store: string; storeColor: string; storeInitial: string; validFrom: string; validUntil: string; totalProducts: number }[]>([]);
  const nutriMap = useNutriScoreMap();
  const setUploadedBatchMeta = useAppStore(s => s.setUploadedBatchMeta);
  const sponsorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('affiliate_links')
      .select('id, name, url, store, category, banner_image, banner_position_y')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setAffiliateAds(data ?? []));
  }, []);

  // Fetch active uploaded batches
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from('pdf_import_batches')
      .select('id, store, total_products, valid_from, valid_until')
      .in('status', ['confirmed', 'preview', 'pending'])
      .lte('valid_from', today)
      .gte('valid_until', today)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const flyerStoreNames = new Set(FLYERS.map(f => f.store.toLowerCase()));
        setUploadedBatches(data
          .filter(b => b.store && !flyerStoreNames.has(b.store.toLowerCase()))
          .map(b => {
            const info = getStoreInfoByName(b.store ?? '');
            return {
              id: b.id,
              store: b.store ?? 'Ukendt',
              storeColor: info?.color ?? '#78766d',
              storeInitial: info?.initial ?? (b.store?.[0] ?? '?'),
              validFrom: new Date(b.valid_from!).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }),
              validUntil: new Date(b.valid_until!).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }),
              totalProducts: b.total_products ?? 0,
            };
          })
        );
      });
  }, []);

  const allSponsors = useMemo(() => {
    const supabaseIds = new Set(affiliateAds.map(a => a.id));
    const hardcoded = DEFAULT_SPONSORS.filter(s => !supabaseIds.has(s.id));
    return [...affiliateAds, ...hardcoded];
  }, [affiliateAds]);

  // Auto-scroll sponsors (infinite loop)
  useEffect(() => {
    const el = sponsorRef.current;
    if (!el) return;
    let paused = false;
    let resumeTimer: ReturnType<typeof setTimeout>;
    const pause = () => {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, 6000);
    };
    el.addEventListener('touchstart', pause, { passive: true });

    // Silent reset when past halfway (content is duplicated)
    const onScroll = () => {
      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) {
        el.scrollLeft -= half;
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });

    const interval = setInterval(() => {
      if (paused) return;
      el.scrollBy({ left: 208, behavior: 'smooth' });
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(resumeTimer);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  const isOfferInCart = (offer: Offer) => {
    if (!inCartNames?.size) return false;
    return inCartNames.has(offer.title.toLowerCase());
  };

  // Get unique categories from all offers
  const allCategories = useMemo(() =>
    [...new Set(offers.map(o => o.category))],
    [offers]
  );

  // Apply filters to offers
  const filteredOffers = useMemo(() => {
    let result = [...offers];

    // Store filter
    if (filters.enabledStores.size > 0) {
      const enabledStoreNames = new Set(
        FLYERS.filter(f => filters.enabledStores.has(getFlyerStoreSlug(f))).map(f => f.store)
      );
      result = result.filter(o => enabledStoreNames.has(o.store));
    }

    // Category filter
    if (filters.enabledCategories.size > 0) {
      result = result.filter(o => filters.enabledCategories.has(o.category));
    }

    // NutriScore filter
    if (filters.nutriScoreFilter.size > 0) {
      result = result.filter(o => {
        const grade = matchNutriScore(o.title, nutriMap);
        return grade ? filters.nutriScoreFilter.has(grade) : false;
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'budget':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'kilopris': {
        const getUP = (o: Offer) => calculateUnitPrice(o.price, o.unit)?.unitPrice ?? Infinity;
        result.sort((a, b) => getUP(a) - getUP(b));
        break;
      }
      case 'besparelse': {
        const getSaving = (o: Offer) => o.originalPrice > 0 ? ((o.originalPrice - o.price) / o.originalPrice) * 100 : 0;
        result.sort((a, b) => getSaving(b) - getSaving(a));
        break;
      }
      case 'sundhed': {
        result.sort((a, b) =>
          nutriScoreToNumber(matchNutriScore(a.title, nutriMap)) -
          nutriScoreToNumber(matchNutriScore(b.title, nutriMap))
        );
        break;
      }
    }

    return result;
  }, [offers, filters, nutriMap]);

  return (
    <>
      {/* ── Dagstilbud (alle butikker) ── */}
      <p className="text-[13px] font-semibold text-foreground px-1">Dagstilbud</p>
      <div className="flex gap-2 overflow-x-auto snap-x pt-3 pb-2 scrollbar-hide -mx-2 px-2">
        {filteredOffers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            isAdded={addedOfferId === offer.id}
            inCart={isOfferInCart(offer)}
            nutriscoreGrade={matchNutriScore(offer.title, nutriMap)}
            onSelect={(o) => setSelectedOffer(o)}
          />
        ))}
        {filteredOffers.length === 0 && (
          <p className="text-[13px] text-muted-foreground py-4 px-2">Ingen tilbud matcher dine filtre</p>
        )}
      </div>

      {/* ── Tilbudsaviser (covers) ── */}
      <div className="px-1">
        <p className="text-[13px] font-semibold text-foreground">Tilbudsaviser</p>
      </div>
      <div className="flex gap-2.5 overflow-x-auto snap-x pb-2 scrollbar-hide -mx-2 px-2">
        {FLYERS.map((flyer) => (
          <button
            key={flyer.id}
            onClick={() => { trackEvent({ eventType: 'product_click', targetId: flyer.id, targetType: 'flyer', page: 'tilbud', metadata: { store: flyer.store } }); onSelectStore(flyer.id); }}
            className="min-w-[140px] max-w-[140px] snap-start shrink-0 rounded-[8px] overflow-hidden bg-card active:scale-[0.97] transition-transform text-left"
          >
            {flyer.coverImage ? (
              <img src={flyer.coverImage} alt={flyer.store} className="w-full h-[170px] object-cover object-top" />
            ) : (
              <div
                className="w-full h-[170px] flex flex-col items-center justify-center gap-2"
                style={{ backgroundColor: flyer.storeColor + '18' }}
              >
                <StoreBadge storeId={getFlyerStoreSlug(flyer)} size="lg" />
                <span className="text-[14px] font-bold text-foreground">{flyer.store}</span>
                {flyer.label && <span className="text-[10px] text-muted-foreground">{flyer.label}</span>}
              </div>
            )}
            <div className="p-2.5">
              <div className="flex items-center gap-1.5">
                <StoreBadge storeId={getFlyerStoreSlug(flyer)} size="sm" />
                <p className="text-[13px] font-bold text-foreground">{flyer.store}{flyer.label ? ` · ${flyer.label}` : ''}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{flyer.validFrom} – {flyer.validUntil}</p>
              <p className="text-[10px] text-muted-foreground">{flyer.pages} sider</p>
            </div>
          </button>
        ))}
        {/* Uploaded batches (from Supabase) */}
        {uploadedBatches.map((ub) => (
          <button
            key={`uploaded-${ub.id}`}
            onClick={() => {
              trackEvent({ eventType: 'product_click', targetId: ub.id, targetType: 'flyer', page: 'tilbud', metadata: { store: ub.store } });
              setUploadedBatchMeta({ store: ub.store, storeColor: ub.storeColor, validFrom: ub.validFrom, validUntil: ub.validUntil, totalProducts: ub.totalProducts });
              onSelectStore(`uploaded-${ub.id}`);
            }}
            className="min-w-[140px] max-w-[140px] snap-start shrink-0 rounded-[8px] overflow-hidden bg-card active:scale-[0.97] transition-transform text-left"
          >
            <div
              className="w-full h-[170px] flex flex-col items-center justify-center gap-2"
              style={{ backgroundColor: ub.storeColor + '18' }}
            >
              <StoreBadge storeName={ub.store} storeColor={ub.storeColor} storeInitial={ub.storeInitial} size="lg" />
              <span className="text-[14px] font-bold text-foreground">{ub.store}</span>
            </div>
            <div className="p-2.5">
              <div className="flex items-center gap-1.5">
                <StoreBadge storeName={ub.store} storeColor={ub.storeColor} storeInitial={ub.storeInitial} size="sm" />
                <p className="text-[13px] font-bold text-foreground">{ub.store}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{ub.validFrom} – {ub.validUntil}</p>
              <p className="text-[10px] text-muted-foreground">{ub.totalProducts} produkter</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Gave & ønskeliste tilbud ── */}
      <p className="text-[13px] font-semibold text-foreground px-1">Gave & ønskeliste</p>
      <div className="flex gap-1.5 overflow-x-auto snap-x pb-2 scrollbar-hide -mx-2 px-2">
        {giftOffers.map((offer) => (
          <button
            key={offer.id}
            onClick={() => setSelectedGift(offer)}
            className="min-w-[160px] max-w-[160px] snap-start shrink-0 text-left active:scale-[0.97] transition-transform"
          >
            <div className="relative h-[160px] rounded-[8px] overflow-hidden" style={{ backgroundColor: offer.storeColor + '18' }}>
              {offer.cropImage ? (
                <ProductCropImage
                  pageImageUrl={offer.cropImage.pageImageUrl}
                  cropX={offer.cropImage.x}
                  cropY={offer.cropImage.y}
                  cropWidth={offer.cropImage.width}
                  cropHeight={offer.cropImage.height}
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[28px] font-bold" style={{ color: offer.storeColor }}>{offer.store[0]}</span>
              )}
              <div className="absolute top-2 left-2">
                <StoreBadge storeName={offer.store} storeColor={offer.storeColor} storeInitial={offer.store[0]} size="sm" />
              </div>
              <div
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#f58a2d] flex items-center justify-center text-white shadow-md"
              >
                {addedOfferId === offer.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </div>
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-[#ef4444] rounded-full px-1.5 py-0.5">
                {offer.discount}
              </span>
            </div>
            <div className="mt-1.5 px-0.5 h-[52px] overflow-hidden">
              <h3 className="text-[12px] font-semibold text-foreground leading-snug line-clamp-2">{offer.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[14px] font-bold text-[#f58a2d]">{offer.price.toLocaleString('da-DK')},-</p>
                {(() => { const g = matchNutriScore(offer.title, nutriMap); return g ? <NutriScoreBadge grade={g} size="sm" /> : null; })()}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Sponsoreret ── */}
      <p className="text-[13px] font-semibold text-foreground px-1">Sponsoreret</p>
      <div ref={sponsorRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        {[...allSponsors, ...allSponsors].map((ad, i) => (
          <a
            key={ad.id + '-' + i}
            href={ad.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={() => {
              trackEvent({
                eventType: 'link_redirect',
                targetId: ad.id,
                targetType: 'offer',
                page: 'tilbud',
                metadata: { store: ad.name, url: ad.url },
              });
              // Only track in Supabase for DB-managed sponsors
              if (!ad.id.includes('-dk')) {
                supabase.from('affiliate_clicks').insert({
                  affiliate_link_id: ad.id,
                  user_id: null,
                });
                supabase.rpc('increment_affiliate_clicks', { link_id: ad.id }).then(() => {});
              }
            }}
            className="min-w-[200px] max-w-[200px] shrink-0 flex flex-col active:scale-[0.97] transition-transform"
          >
            <div className="h-24 rounded-[8px] overflow-hidden">
              {ad.banner_image ? (
                <img src={ad.banner_image} alt={ad.name} className="w-full h-full object-cover" style={{ objectPosition: `center ${ad.banner_position_y ?? 50}%` }} />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center"
                  style={{ background: ad.banner_color || '#1a1a2e' }}
                >
                  <span className={`text-[20px] font-black tracking-wide ${ad.banner_color?.includes('#f5e6d3') ? 'text-foreground' : 'text-white'}`}>{ad.name}</span>
                  {ad.banner_subtitle && (
                    <span className={`text-[11px] font-medium mt-0.5 ${ad.banner_color?.includes('#f5e6d3') ? 'text-muted-foreground' : 'text-white/70'}`}>{ad.banner_subtitle}</span>
                  )}
                </div>
              )}
            </div>
            <p className="text-[13px] font-semibold text-foreground mt-1.5 leading-tight line-clamp-1">{ad.name}</p>
            {ad.category && (
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{ad.category}</p>
            )}
          </a>
        ))}
      </div>

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
              : "bg-primary text-white hover:bg-primary"
          )}
          aria-label="Filter"
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={() => setShowSearch(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary transition-colors"
          aria-label="Søg"
        >
          <Search className="h-4.5 w-4.5" />
        </button>
      </div>

      <button
        onClick={onBack}
        className="fixed right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary transition-colors"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        aria-label="Tilbage"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* ── Sheets ── */}
      <TilbudSearchSheet
        open={showSearch}
        onOpenChange={setShowSearch}
        storeId={null}
        addedCatalogId={addedCatalogId}
        onAddProduct={onAddCatalogProduct}
      />
      <TilbudFilterSheet
        open={showFilter}
        onOpenChange={setShowFilter}
        filters={filters}
        onFiltersChange={setFilters}
        storeId={null}
        availableCategories={allCategories}
      />
      <GiftOfferDetailSheet
        open={!!selectedGift}
        onOpenChange={(open) => { if (!open) setSelectedGift(null); }}
        offer={selectedGift}
        onAddToWishlist={onAddGift}
        nutriscoreGrade={selectedGift ? matchNutriScore(selectedGift.title, nutriMap) : undefined}
      />
      <OfferActionSheet
        open={!!selectedOffer}
        onOpenChange={(open) => { if (!open) setSelectedOffer(null); }}
        offer={selectedOffer}
        inCart={selectedOffer ? isOfferInCart(selectedOffer) : false}
        onAddToShopping={(offer, qty) => {
          onAddOffer(offer, qty);
          setSelectedOffer(null);
        }}
        onRemoveFromCart={onRemoveOffer ? (offer) => {
          onRemoveOffer(offer);
          setSelectedOffer(null);
        } : undefined}
      />
    </>
  );
}
