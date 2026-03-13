import { useState, useEffect, useMemo } from 'react';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { CatalogProduct } from '@/lib/etilbudsavis';

interface ImportItem {
  id: string;
  title: string;
  price: string | null;
  original_price: string | null;
  discount: string | null;
  category: string | null;
  unit: string | null;
  confidence: number | null;
  is_rejected: boolean;
}

interface UploadedBatchViewProps {
  batchId: string;
  inCartNames?: Set<string>;
  onAddProduct: (product: CatalogProduct) => void;
}

export function UploadedBatchView({ batchId, inCartNames, onAddProduct }: UploadedBatchViewProps) {
  const [items, setItems] = useState<ImportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('pdf_import_items')
      .select('id, title, price, original_price, discount, category, unit, confidence, is_rejected')
      .eq('batch_id', batchId)
      .eq('is_rejected', false)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, [batchId]);

  const grouped = useMemo(() => {
    const map = new Map<string, ImportItem[]>();
    for (const item of items) {
      const cat = item.category || 'Andet';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return [...map.entries()];
  }, [items]);

  const handleAdd = (item: ImportItem) => {
    const price = item.price ? parseFloat(item.price.replace(',', '.')) : 0;
    const origPrice = item.original_price ? parseFloat(item.original_price.replace(',', '.')) : price;
    onAddProduct({
      id: `batch-${item.id}`,
      name: item.title,
      price,
      originalPrice: origPrice,
      discount: item.discount || '',
      category: item.category || 'Andet',
      unit: item.unit || undefined,
    } as CatalogProduct);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 border-2 border-[#f58a2d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <p className="text-[14px] font-semibold text-foreground">Ingen produkter endnu</p>
        <p className="text-[12px] text-muted-foreground">PDF'en er muligvis ved at blive analyseret</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {grouped.map(([category, catItems]) => (
        <div key={category}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-1.5 px-1">{category}</p>
          <div className="rounded-[8px] border border-border bg-card overflow-hidden divide-y divide-border">
            {catItems.map((item) => {
              const inCart = inCartNames?.has(item.title.toLowerCase());
              const isAdded = addedId === item.id;
              return (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.price && (
                        <span className="text-[13px] font-bold text-[#f58a2d]">{item.price} kr</span>
                      )}
                      {item.original_price && (
                        <span className="text-[11px] text-muted-foreground line-through">{item.original_price} kr</span>
                      )}
                      {item.discount && (
                        <span className="text-[10px] font-semibold text-white bg-[#ef4444] rounded-full px-1.5 py-0.5">{item.discount}</span>
                      )}
                    </div>
                    {item.unit && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.unit}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAdd(item)}
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                      inCart || isAdded
                        ? 'bg-[#34C759] text-white'
                        : 'bg-[#f58a2d] text-white active:bg-[#e47921]'
                    )}
                  >
                    {inCart || isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
