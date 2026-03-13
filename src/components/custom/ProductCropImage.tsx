import { cn } from '@/lib/utils';

interface ProductCropImageProps {
  /** Full flyer page image URL */
  pageImageUrl: string;
  /** Hotspot x position as fraction 0–1 */
  cropX: number;
  /** Hotspot y position as fraction 0–1 */
  cropY: number;
  /** Hotspot width as fraction 0–1 */
  cropWidth: number;
  /** Hotspot height as fraction 0–1 */
  cropHeight: number;
  className?: string;
}

/**
 * Renders a cropped region of a flyer page image based on hotspot coordinates.
 * Uses CSS transform to position the full page image so only the product region is visible.
 */
export function ProductCropImage({
  pageImageUrl,
  cropX,
  cropY,
  cropWidth,
  cropHeight,
  className,
}: ProductCropImageProps) {
  // Scale: how much bigger the full image needs to be relative to the container
  const scaleX = 1 / cropWidth;
  const scaleY = 1 / cropHeight;

  // Offset: shift the image so the crop region aligns with the container
  const offsetX = -cropX * scaleX * 100;
  const offsetY = -cropY * scaleY * 100;

  return (
    <div className={cn('overflow-hidden rounded-[8px] bg-card', className)}>
      <img
        src={pageImageUrl}
        alt=""
        className="block"
        style={{
          width: `${scaleX * 100}%`,
          height: `${scaleY * 100}%`,
          transform: `translate(${offsetX}%, ${offsetY}%)`,
          transformOrigin: '0 0',
        }}
        loading="lazy"
      />
    </div>
  );
}
