import { useState, useEffect } from 'react';
import { Heart, Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { ProductCropImage } from './ProductCropImage';
import { NutritionSection } from './NutritionSection';
import { PriceSparkline } from './PriceSparkline';
import { calculateUnitPrice } from '@/lib/unitPrice';
import { formatDKK } from '@/lib/etilbudsavis';
import { lookupProductByName, trackProductClick, type ProductLookupResult } from '@/lib/productLookup';
import type { CatalogProduct } from '@/lib/etilbudsavis';

interface ProductActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: CatalogProduct | null;
  storeColor: string;
  onAddToShopping: (product: CatalogProduct, quantity?: number) => void;
  onAddToWishlist: (product: CatalogProduct) => void;
}

export function ProductActionSheet({ open, onOpenChange, product, storeColor, onAddToShopping, onAddToWishlist }: ProductActionSheetProps) {
  const [qty, setQty] = useState(1);
  const [lookupResult, setLookupResult] = useState<ProductLookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Reset quantity when product changes
  useEffect(() => {
    setQty(1);
  }, [product?.id]);

  // Fuzzy lookup for nutrition data
  useEffect(() => {
    if (!product) {
      setLookupResult(null);
      return;
    }
    let aborted = false;
    setLookupLoading(true);
    lookupProductByName(product.name).then(result => {
      if (!aborted) {
        setLookupResult(result);
        setLookupLoading(false);
      }
    });
    return () => { aborted = true; };
  }, [product?.id]);

  // Track product view
  useEffect(() => {
    if (lookupResult?.product) {
      trackProductClick(lookupResult.product.id, 'nutrition_view', { source: 'catalog' });
    }
  }, [lookupResult?.product?.id]);

  if (!product) return null;

  const up = calculateUnitPrice(product.price, product.unit);
  const saving = product.originalPrice ? product.originalPrice - product.price : 0;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={product.name} compact>
      <div className="flex flex-col gap-4 pb-6">
        {/* Product image from flyer crop */}
        {product.cropImage && (
          <ProductCropImage
            pageImageUrl={product.cropImage.pageImageUrl}
            cropX={product.cropImage.x}
            cropY={product.cropImage.y}
            cropWidth={product.cropImage.width}
            cropHeight={product.cropImage.height}
            className="w-full h-36"
          />
        )}

        {product.unit && (
          <p className="text-[13px] text-[#78766d] -mt-2">{product.unit}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-[28px] font-bold" style={{ color: storeColor }}>
            {formatDKK(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-[15px] text-[#9a978f] line-through">
              {formatDKK(product.originalPrice)}
            </span>
          )}
          <span className="text-[12px] font-bold text-white bg-[#ef4444] rounded-full px-2 py-0.5 ml-auto">
            {product.discount}
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
              style={{ backgroundColor: storeColor }}
            >
              <Plus className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            onClick={() => {
              onAddToShopping(product, qty);
              onOpenChange(false);
            }}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-semibold text-[15px] active:scale-[0.97] transition-transform shadow-sm"
            style={{ backgroundColor: storeColor }}
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            Tilføj {qty > 1 ? `${qty} stk` : ''} til indkøbsliste
          </button>
          <button
            onClick={() => {
              onAddToWishlist(product);
              onOpenChange(false);
            }}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#f58a2d] text-white font-semibold text-[15px] active:scale-[0.97] transition-transform shadow-sm"
          >
            <Heart className="h-4.5 w-4.5" />
            Tilføj til ønskeliste
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
