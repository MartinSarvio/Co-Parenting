const NUTRISCORE_COLORS: Record<string, { bg: string; text: string }> = {
  a: { bg: '#038141', text: 'white' },
  b: { bg: '#85BB2F', text: 'white' },
  c: { bg: '#FECB02', text: '#2f2f2d' },
  d: { bg: '#EE8100', text: 'white' },
  e: { bg: '#E63E11', text: 'white' },
};

const NOVA_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#038141', text: 'white' },
  2: { bg: '#FECB02', text: '#2f2f2d' },
  3: { bg: '#EE8100', text: 'white' },
  4: { bg: '#E63E11', text: 'white' },
};

interface NutriScoreBadgeProps {
  grade: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function NutriScoreBadge({ grade, size = 'md', className = '' }: NutriScoreBadgeProps) {
  const g = grade.toLowerCase();
  const colors = NUTRISCORE_COLORS[g];
  if (!colors) return null;

  const sizeClasses = size === 'sm'
    ? 'h-4 px-1.5 text-[9px]'
    : 'h-5 px-2 text-[11px]';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-black leading-none ${sizeClasses} ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {g.toUpperCase()}
    </span>
  );
}

interface NovaGroupBadgeProps {
  group: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function NovaGroupBadge({ group, size = 'md', className = '' }: NovaGroupBadgeProps) {
  const colors = NOVA_COLORS[group];
  if (!colors) return null;

  const sizeClasses = size === 'sm'
    ? 'h-4 px-1.5 text-[9px]'
    : 'h-5 px-2 text-[11px]';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-black leading-none ${sizeClasses} ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      NOVA {group}
    </span>
  );
}
