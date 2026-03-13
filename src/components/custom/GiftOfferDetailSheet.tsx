import { Heart } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { StoreBadge } from './StoreBadge';
import { ProductCropImage } from './ProductCropImage';
import { NutriScoreBadge } from './NutriScoreBadge';
import type { Offer } from '@/lib/offers';

interface GiftOfferDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer | null;
  onAddToWishlist: (offer: Offer) => void;
  nutriscoreGrade?: string;
}

export function GiftOfferDetailSheet({ open, onOpenChange, offer, onAddToWishlist, nutriscoreGrade }: GiftOfferDetailSheetProps) {
  if (!offer) return null;

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
            className="w-full h-40"
          />
        )}

        {/* Header area with store badge */}
        <div
          className="flex items-center gap-3 p-4 rounded-[8px]"
          style={{ backgroundColor: offer.storeColor + '18' }}
        >
          <StoreBadge storeName={offer.store} storeColor={offer.storeColor} storeInitial={offer.store[0]} size="lg" />
          <div>
            <p className="text-[15px] font-bold text-foreground">{offer.store}</p>
            <p className="text-[12px] text-muted-foreground">Gyldig til {offer.validUntil}</p>
          </div>
          <span className="ml-auto text-[12px] font-bold text-white bg-[#ef4444] rounded-full px-2 py-0.5">
            {offer.discount}
          </span>
        </div>

        {/* Product info */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[17px] font-bold text-foreground">{offer.title}</h3>
            {nutriscoreGrade && <NutriScoreBadge grade={nutriscoreGrade} size="md" />}
          </div>
          {offer.description && (
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{offer.description}</p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-[28px] font-bold text-[#f58a2d]">
            {offer.price.toLocaleString('da-DK')},-
          </span>
          {offer.originalPrice > 0 && (
            <span className="text-[15px] text-muted-foreground line-through">
              {offer.originalPrice.toLocaleString('da-DK')},-
            </span>
          )}
        </div>

        {saving > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-yellow-tint">
            <span className="text-[13px] font-semibold text-[#92400e]">
              Du sparer {saving.toLocaleString('da-DK')} kr
            </span>
          </div>
        )}

        {/* Add to wishlist */}
        <button
          onClick={() => {
            onAddToWishlist(offer);
            onOpenChange(false);
          }}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#f58a2d] text-white font-semibold text-[15px] active:scale-[0.97] transition-transform shadow-sm"
        >
          <Heart className="h-4.5 w-4.5" />
          Tilføj til ønskeliste
        </button>
      </div>
    </BottomSheet>
  );
}
