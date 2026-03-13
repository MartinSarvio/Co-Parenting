import { useState } from 'react';
import { Plus, Check, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { shoppingItemId } from '@/lib/id';
import { formatCurrency } from '@/lib/utils';
import { NutriScoreBadge } from './NutriScoreBadge';
import type { ShoppingItem, WishItem } from '@/types';

export interface ProductCardData {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  price?: number;
  description?: string;
  category?: string;
  quantity?: string;
  barcode?: string;
  link?: string;
  nutritionPer100g?: ShoppingItem['nutritionPer100g'];
  nutriscoreGrade?: string;
}

interface ProductCardProps {
  product: ProductCardData;
  mode: 'shopping' | 'wishlist';
  childId?: string;
  listId?: string;
  onAdded?: () => void;
}

export function ProductCard({ product, mode, childId, listId, onAdded }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const { addShoppingItem, addWishItem } = useAppStore();
  const currentUser = useAppStore(s => s.currentUser);

  const handleAdd = () => {
    if (added || !currentUser) return;

    if (mode === 'shopping') {
      const item: ShoppingItem = {
        id: shoppingItemId(),
        name: product.brand ? `${product.brand} ${product.name}` : product.name,
        quantity: product.quantity,
        purchased: false,
        addedBy: currentUser.id,
        category: product.category || 'Dagligvarer',
        childId,
        priority: 'normal',
        barcode: product.barcode,
        source: product.barcode ? 'open_food_facts' : 'manual',
        nutritionPer100g: product.nutritionPer100g,
        listId,
      };
      addShoppingItem(item);
      toast.success('Tilføjet til indkøbslisten');
    } else {
      const item: WishItem = {
        id: `wish-${Date.now()}`,
        title: product.name,
        priceEstimate: product.price,
        link: product.link,
        imageUrl: product.imageUrl,
        description: product.description,
        childId: childId || '',
        addedBy: currentUser.id,
        status: 'wanted',
        createdAt: new Date().toISOString(),
      };
      addWishItem(item);
      toast.success('Tilføjet til ønskelisten');
    }

    setAdded(true);
    onAdded?.();
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="rounded-[8px] border border-border bg-card overflow-hidden">
      {/* Image section */}
      <div className="relative aspect-[4/3] bg-card">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        {product.nutriscoreGrade && (
          <div className="absolute top-2 left-2 z-10">
            <NutriScoreBadge grade={product.nutriscoreGrade} size="sm" />
          </div>
        )}
        {/* Add button */}
        <button
          onClick={handleAdd}
          className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-sm active:scale-95 transition-all ${
            added
              ? 'bg-[#22c55e] text-white'
              : 'bg-[#f58a2d] text-white'
          }`}
        >
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {/* Info section */}
      <div className="p-2.5">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {product.name}
        </p>
        {(product.brand || product.quantity) && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {[product.brand, product.quantity].filter(Boolean).join(' · ')}
          </p>
        )}
        {product.price != null && product.price > 0 && (
          <p className="text-sm font-bold text-foreground mt-1">
            {formatCurrency(product.price)}
          </p>
        )}
      </div>
    </div>
  );
}
