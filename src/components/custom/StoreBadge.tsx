import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getStoreInfo, getStoreInfoByName, STORE_LOGOS, getFaviconFallback, needsDarkText } from '@/lib/storeLogos';

interface StoreBadgeProps {
  /** Store ID (e.g. 'bilka') or store name (e.g. 'Bilka') */
  storeId?: string;
  storeName?: string;
  /** Override color (if not using store registry) */
  storeColor?: string;
  /** Override initial (if not using store registry) */
  storeInitial?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 'h-5 w-5', text: 'text-[9px]', img: 'h-5 w-5' },
  md: { container: 'h-8 w-8', text: 'text-[13px]', img: 'h-8 w-8' },
  lg: { container: 'h-14 w-14 rounded-[8px]', text: 'text-[24px]', img: 'h-14 w-14 rounded-[8px]' },
};

export function StoreBadge({ storeId, storeName, storeColor, storeInitial, size = 'md', className }: StoreBadgeProps) {
  const [imgError, setImgError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Resolve store info
  const info = storeId ? getStoreInfo(storeId) : storeName ? getStoreInfoByName(storeName) : undefined;
  const color = storeColor || info?.color || '#78766d';
  const initial = storeInitial || info?.initial || (storeName?.[0] ?? '?');
  const primaryLogo = info?.logoUrl || (storeId && STORE_LOGOS[storeId]) || undefined;
  const fallbackLogo = storeId ? getFaviconFallback(storeId) : undefined;
  const logoUrl = useFallback ? fallbackLogo : primaryLogo;

  const s = SIZE_MAP[size];

  return (
    <div className={cn('relative shrink-0', s.container, size !== 'lg' && 'rounded-full', className)}>
      {/* Fallback: colored circle with initial */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center font-bold',
          needsDarkText(color) ? 'text-[#2f2f2d]' : 'text-white',
          size !== 'lg' ? 'rounded-full' : 'rounded-[8px]',
          s.text,
        )}
        style={{ backgroundColor: color }}
      >
        {initial}
      </div>

      {/* Logo image on top */}
      {logoUrl && !imgError && (
        <img
          src={logoUrl}
          alt=""
          className={cn('absolute inset-0 object-cover', s.img, size !== 'lg' ? 'rounded-full' : 'rounded-[8px]')}
          onError={() => {
            if (!useFallback && fallbackLogo) {
              setUseFallback(true);
            } else {
              setImgError(true);
            }
          }}
          loading="lazy"
        />
      )}
    </div>
  );
}
