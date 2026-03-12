import { useState, useEffect } from 'react';
import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { StoreBadge } from './StoreBadge';
import { ProductCropImage } from './ProductCropImage';
import { NutritionSection } from './NutritionSection';
import { PriceSparkline } from './PriceSparkline';
import { calculateUnitPrice } from '@/lib/unitPrice';
import { lookupProductByName, trackProductClick, type ProductLookupResult } from '@/lib/productLookup';
import type { Offer } from '@/lib/offers';

interface OfferActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer | null;
  inCart?: boolean;
  onAddToShopping: (offer: Offer, quantity?: number) => void;
  onRemoveFromCart?: (offer: Offer) => void;
}

export function OfferActionSheet({ open, onOpenChange, offer, inCart, onAddToShopping, onRemoveFromCart }: OfferActionSheetProps) {
  const [qty, setQty] = useState(1);
  const [lookupResult, setLookupResult] = useState<ProductLookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Reset quantity when offer changes
  useEffect(() => {
    setQty(1);
  }, [offer?.id]);

  // Fuzzy lookup for nutrition data
  useEffect(() => {
    if (!offer) {
      setLookupResult(null);
      return;
    }
    let aborted = false;
    setLookupLoading(true);
    lookupProductByName(offer.title).then(result => {
      if (!aborted) {
        setLookupResult(result);
        setLookupLoading(false);
      }
    });
    return () => { aborted = true; };
  }, [offer?.id]);

  // Track product view
  useEffect(() => {
    if (lookupResult?.product) {
      trackProductClick(lookupResult.product.id, 'nutrition_view', { source: 'offer' });
    }
  }, [lookupResult?.product?.id]);

  if (!offer) return null;

  const up = calculateUnitPrice(offer.price, offer.unit);
  const saving = offer.originalPrice > 0 ? offer.originalPrice - offer.price : 0;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={offer.title} compact>
      <div className="flex flex-col gap-4 pb-6">
        {/* Product image from flyer crop */}
        {offer.cropImage && (
          <ProductCropImage
            pageImageUrl={offer.cropImage.pageImageUrl}
            cropX={offer.cropImage.x}
            cropY={offer.cropImage.y}
            cropWidth={offer.cropImage.width}
            cropHeight={offer.cropImage.height}
            className="w-full h-36"
          />
        )}

        {/* Store info */}
        <div className="flex items-center gap-2 -mt-2">
          <StoreBadge storeName={offer.store} storeColor={offer.storeColor} storeInitial={offer.store[0]} size="sm" />
          <span className="text-[12px] font-semibold text-[#9a978f]">{offer.store}</span>
          {offer.unit && (
            <span className="text-[13px] text-[#78766d] ml-auto">{offer.unit}</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-[28px] font-bold" style={{ color: offer.storeColor }}>
            {offer.price},-
          </span>
          {offer.originalPrice > 0 && (
            <span className="text-[15px] text-[#9a978f] line-through">
              {offer.originalPrice},-
            </span>
          )}
          <span className="text-[12px] font-bold text-white bg-[#ef4444] rounded-full px-2 py-0.5 ml-auto">
            {offer.discount}
          </span>
        </div>

        {up && (
          <p className="text-[13px] text-[#78766d]">{up.formatted}</p>
        )}

        {saving > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#fef3c7]">
            <span className="text-[13px] font-semibold text-[#92400e]">
              Du sparer {Number.isInteger(saving) ? saving : saving.toFixed(2).replace('.', ',')} kr
            </span>
          </div>
        )}

        {/* Nutrition section */}
        {lookupLoading && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#9a978f]" />
            <span className="text-[12px] text-[#9a978f]">Henter næringsinfo...</span>
          </div>
        )}

        {!lookupLoading && lookupResult?.product && (
          <NutritionSection product={lookupResult.product} compact />
        )}

        {/* Price history sparkline */}
        {!lookupLoading && lookupResult?.priceHistory && lookupResult.priceHistory.length > 0 && (
          <PriceSparkline data={lookupResult.priceHistory} />
        )}

        {/* Quantity stepper */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[14px] font-semibold text-[#2f2f2d]">Antal</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f4f0] active:scale-95 transition-transform"
              disabled={qty <= 1}
            >
              <Minus className="h-4 w-4 text-[#2f2f2d]" />
            </button>
            <span className="text-[18px] font-bold text-[#2f2f2d] w-6 text-center">{qty}</span>
            <button
              onClick={() => setQty(q => Math.min(20, q + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full active:scale-95 transition-transform"
              style={{ backgroundColor: offer.storeColor }}
            >
              <Plus className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Action */}
        <div className="pt-1 space-y-2">
          <button
            onClick={() => {
              onAddToShopping(offer, qty);
              onOpenChange(false);
            }}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-semibold text-[15px] active:scale-[0.97] transition-transform shadow-sm"
            style={{ backgroundColor: offer.storeColor }}
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            Tilføj {qty > 1 ? `${qty} stk` : ''} til indkøbsliste
          </button>
          {inCart && onRemoveFromCart && (
            <button
              onClick={() => {
                onRemoveFromCart(offer);
                onOpenChange(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[#fecaca] text-[#FF3B30] font-semibold text-[14px] active:scale-[0.97] transition-transform"
            >
              Fjern fra indkøbsliste
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
