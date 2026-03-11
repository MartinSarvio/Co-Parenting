import { cn } from '@/lib/utils';
import { Check, ShoppingCart } from 'lucide-react';
import { NutriScoreBadge } from './NutriScoreBadge';
import { ProductCropImage } from './ProductCropImage';
import { calculateUnitPrice } from '@/lib/unitPrice';
import { formatDKK } from '@/lib/etilbudsavis';
import type { CatalogProduct } from '@/lib/etilbudsavis';

interface CatalogProductCardProps {
  product: CatalogProduct;
  storeColor: string;
  isAdded: boolean;
  inCart?: boolean;
  nutriscoreGrade?: string;
  onSelect: (product: CatalogProduct) => void;
}

export function CatalogProductCard({ product, storeColor, isAdded, inCart, nutriscoreGrade, onSelect }: CatalogProductCardProps) {
  const up = calculateUnitPrice(product.price, product.unit);

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
      {product.cropImage && (
        <ProductCropImage
          pageImageUrl={product.cropImage.pageImageUrl}
          cropX={product.cropImage.x}
          cropY={product.cropImage.y}
          cropWidth={product.cropImage.width}
          cropHeight={product.cropImage.height}
          className="w-full h-20 mb-1.5 -mt-1"
        />
      )}
      <p className="text-[13px] font-semibold text-[#2f2f2d] leading-snug line-clamp-2">{product.name}</p>
      {product.unit && (
        <p className="text-[10px] text-[#9a978f] mt-0.5">{product.unit}</p>
      )}
      <div className="flex items-baseline gap-1.5 mt-auto pt-1.5">
        <span className="text-[15px] font-bold text-[#2f2f2d]">{formatDKK(product.price)}</span>
        {product.originalPrice && (
          <span className="text-[11px] text-[#9a978f] line-through">{formatDKK(product.originalPrice)}</span>
        )}
        <span className="text-[10px] font-bold text-white bg-[#ef4444] rounded-full px-1.5 py-0.5 ml-auto">
          {product.discount}
        </span>
      </div>
      {up && (
        <p className="text-[10px] text-[#78766d] mt-0.5">{up.formatted}</p>
      )}
      <button
        onClick={() => onSelect(product)}
        className={cn(
          "mt-2 w-full py-1.5 rounded-lg text-[12px] font-semibold active:scale-[0.97] transition-all",
          isAdded
            ? "bg-[#22c55e]/10 text-[#22c55e]"
            : "text-white"
        )}
        style={isAdded ? undefined : { backgroundColor: storeColor }}
      >
        {isAdded ? (
          <span className="flex items-center justify-center gap-1"><Check className="h-3 w-3" /> Tilføjet</span>
        ) : (
          <span className="flex items-center justify-center gap-1"><ShoppingCart className="h-3 w-3" /> Tilføj til kurv</span>
        )}
      </button>
    </div>
  );
}
