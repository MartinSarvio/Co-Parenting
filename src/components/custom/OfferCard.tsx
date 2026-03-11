import { cn } from '@/lib/utils';
import { Check, ShoppingCart } from 'lucide-react';
import { StoreBadge } from './StoreBadge';
import { NutriScoreBadge } from './NutriScoreBadge';
import { ProductCropImage } from './ProductCropImage';
import { calculateUnitPrice } from '@/lib/unitPrice';
import type { Offer } from '@/lib/offers';

interface OfferCardProps {
  offer: Offer;
  isAdded: boolean;
  inCart?: boolean;
  nutriscoreGrade?: string;
  onSelect: (offer: Offer) => void;
}

export function OfferCard({ offer, isAdded, inCart, nutriscoreGrade, onSelect }: OfferCardProps) {
  const up = calculateUnitPrice(offer.price, offer.unit);

  return (
    <div className="relative min-w-[150px] max-w-[150px] snap-start shrink-0 rounded-[8px] bg-white p-3 flex flex-col overflow-visible">
      {nutriscoreGrade && (
        <NutriScoreBadge grade={nutriscoreGrade} size="sm" className="absolute top-1 left-1 z-10" />
      )}
      {inCart && !isAdded && (
        <span className="absolute -top-2 right-1 bg-[#22c55e] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10">
          I kurven
        </span>
      )}
      {offer.cropImage ? (
        <ProductCropImage
          pageImageUrl={offer.cropImage.pageImageUrl}
          cropX={offer.cropImage.x}
          cropY={offer.cropImage.y}
          cropWidth={offer.cropImage.width}
          cropHeight={offer.cropImage.height}
          className="w-full h-16 mb-1.5 rounded-[6px]"
        />
      ) : (
        <div className="flex items-center gap-1.5 mb-1.5">
          <StoreBadge storeName={offer.store} storeColor={offer.storeColor} storeInitial={offer.store[0]} size="sm" />
          <span className="text-[10px] font-semibold text-[#9a978f] truncate">{offer.store}</span>
        </div>
      )}
      <p className="text-[13px] font-semibold text-[#2f2f2d] leading-snug line-clamp-2">{offer.title}</p>
      {offer.unit && (
        <p className="text-[10px] text-[#9a978f] mt-0.5">{offer.unit}</p>
      )}
      <div className="flex items-baseline gap-1.5 mt-auto pt-1.5">
        <span className="text-[15px] font-bold text-[#2f2f2d]">{offer.price}.-</span>
        <span className="text-[11px] text-[#9a978f] line-through">{offer.originalPrice}.-</span>
        <span className="text-[10px] font-bold text-white bg-[#ef4444] rounded-full px-1.5 py-0.5 ml-auto">{offer.discount}</span>
      </div>
      {up && (
        <p className="text-[10px] text-[#78766d] mt-0.5">{up.formatted}</p>
      )}
      <button
        onClick={() => onSelect(offer)}
        className={cn(
          "mt-2 w-full py-1.5 rounded-lg text-[12px] font-semibold active:scale-[0.97] transition-all",
          isAdded
            ? "bg-[#22c55e]/10 text-[#22c55e]"
            : "bg-[#2f2f2f] text-white"
        )}
      >
        {isAdded ? (
          <span className="flex items-center justify-center gap-1"><Check className="h-3 w-3" /> Tilføjet</span>
        ) : (
          <span className="flex items-center justify-center gap-1"><ShoppingCart className="h-3 w-3" /> Tilføj</span>
        )}
      </button>
    </div>
  );
}
