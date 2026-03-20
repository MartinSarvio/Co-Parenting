interface AppStateScreenProps {
  state: 'loading' | 'error' | 'offline';
  onRetry?: () => void;
}

// DiceBear avatar URLs matching app style
const CHILD_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maison&gender=male';
const ADULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anne&gender=female';

// ── SVG sub-components ──────────────────────────────────────────────────────

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" className={className} fill="currentColor">
      <ellipse cx="100" cy="55" rx="85" ry="25" />
      <ellipse cx="65" cy="38" rx="45" ry="28" />
      <ellipse cx="130" cy="32" rx="38" ry="24" />
      <ellipse cx="95" cy="25" rx="35" ry="22" />
    </svg>
  );
}

function Tree({ className, variant = 'large' }: { className?: string; variant?: 'large' | 'small' }) {
  if (variant === 'small') {
    return (
      <svg viewBox="0 0 80 140" className={className}>
        <rect x="35" y="85" width="10" height="55" rx="4" fill="#9B8B6E" className="dark:opacity-60" />
        <ellipse cx="40" cy="55" rx="32" ry="45" fill="#7DD87D" className="dark:fill-emerald-500" />
        <ellipse cx="32" cy="42" rx="22" ry="32" fill="#93E693" className="dark:fill-emerald-400" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 200" className={className}>
      <rect x="52" y="130" width="16" height="70" rx="6" fill="#8B7355" className="dark:opacity-60" />
      <ellipse cx="60" cy="75" rx="55" ry="70" fill="#5EC25E" className="dark:fill-emerald-600" />
      <ellipse cx="45" cy="58" rx="38" ry="50" fill="#6DD86D" className="dark:fill-emerald-500" />
      <ellipse cx="72" cy="48" rx="28" ry="36" fill="#7EE87E" className="dark:fill-emerald-400" />
    </svg>
  );
}

function ProfileCard({ variant, className }: { variant: 'adult' | 'child'; className?: string }) {
  const isAdult = variant === 'adult';
  const bgColor = isAdult ? '#2f2f2f' : '#c0491a';
  const avatarUrl = isAdult ? ADULT_AVATAR : CHILD_AVATAR;

  return (
    <div className={`relative ${className ?? ''}`}>
      <div
        className="rounded-[20px] shadow-xl flex items-center justify-center"
        style={{
          backgroundColor: bgColor,
          width: 150,
          height: 170,
        }}
      >
        {/* White circle with avatar */}
        <div className="w-[115px] h-[115px] rounded-full bg-white flex items-center justify-center overflow-hidden shadow-inner">
          <img
            src={avatarUrl}
            alt={isAdult ? 'Voksen' : 'Barn'}
            className="w-[90px] h-[90px]"
          />
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function AppStateScreen({ state, onRetry }: AppStateScreenProps) {
  const isLoading = state === 'loading';
  const isOffline = state === 'offline';

  const title = isLoading
    ? 'Indlæser'
    : isOffline
      ? 'Ingen internetforbindelse'
      : 'Siden kunne ikke indlæses';

  const subtitle = isLoading
    ? undefined
    : isOffline
      ? 'Tjek din forbindelse og prøv igen'
      : undefined;

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center bg-background overflow-hidden relative">
      {/* Clouds */}
      <Cloud className="absolute top-[8%] w-36 text-violet-200/90 dark:text-violet-900/40 animate-[cloud-drift_22s_linear_infinite]" />
      <Cloud className="absolute top-[5%] w-28 text-violet-200/70 dark:text-violet-900/30 animate-[cloud-drift_28s_linear_infinite_4s]" />
      <Cloud className="absolute top-[18%] w-24 text-violet-200/60 dark:text-violet-900/25 animate-[cloud-drift_20s_linear_infinite_10s]" />

      {/* Main illustration — overlapping rotated cards */}
      <div className="relative flex items-center justify-center mb-10 animate-[float_4s_ease-in-out_infinite]" style={{ width: 300, height: 200 }}>
        {/* Child card — behind, rotated left */}
        <div className="absolute" style={{ left: 10, transform: 'rotate(-12deg)' }}>
          <ProfileCard variant="child" />
        </div>
        {/* Adult card — front, rotated right */}
        <div className="absolute" style={{ right: 10, transform: 'rotate(8deg)', zIndex: 1 }}>
          <ProfileCard variant="adult" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center z-10">
        <p className="text-[22px] font-bold text-foreground">
          {title}
          {isLoading && <span className="animate-[dots_1.5s_steps(4,end)_infinite]">...</span>}
        </p>
        {subtitle && (
          <p className="text-[14px] text-muted-foreground mt-2">{subtitle}</p>
        )}
        {(state === 'error' || state === 'offline') && onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 px-8 py-3 rounded-full bg-[#f58a2d] text-white font-semibold text-[15px] shadow-lg active:scale-95 transition-transform"
          >
            Prøv igen
          </button>
        )}
      </div>

      {/* Trees — large and organic at bottom */}
      <div className="absolute bottom-0 left-[5%] w-24 animate-[tree-sway_5s_ease-in-out_infinite]">
        <Tree variant="large" />
      </div>
      <div className="absolute bottom-0 right-[8%] w-20 animate-[tree-sway_6s_ease-in-out_infinite_1.5s]">
        <Tree variant="large" />
      </div>
      <div className="absolute bottom-0 left-[35%] w-14 animate-[tree-sway_7s_ease-in-out_infinite_0.5s]">
        <Tree variant="small" />
      </div>
      <div className="absolute bottom-0 right-[32%] w-12 animate-[tree-sway_5.5s_ease-in-out_infinite_2s]">
        <Tree variant="small" />
      </div>
    </div>
  );
}
