interface AppStateScreenProps {
  state: 'loading' | 'error' | 'offline';
  onRetry?: () => void;
}

// ── SVG sub-components ──────────────────────────────────────────────────────

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 50" className={className} fill="currentColor">
      <ellipse cx="60" cy="35" rx="50" ry="15" />
      <ellipse cx="40" cy="25" rx="25" ry="15" />
      <ellipse cx="75" cy="22" rx="20" ry="13" />
      <ellipse cx="55" cy="18" rx="18" ry="12" />
    </svg>
  );
}

function Tree({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 100" className={className}>
      <rect x="26" y="60" width="8" height="40" rx="3" fill="#8B7355" className="dark:opacity-70" />
      <ellipse cx="30" cy="35" rx="28" ry="35" fill="#6DC56D" className="dark:fill-emerald-600" />
      <ellipse cx="22" cy="28" rx="18" ry="24" fill="#7DD87D" className="dark:fill-emerald-500" />
    </svg>
  );
}

function ProfileCard({ variant, className }: { variant: 'adult' | 'child'; className?: string }) {
  const isAdult = variant === 'adult';
  const bgColor = isAdult ? '#2f2f2f' : '#f58a2d';
  const cardBg = isAdult ? 'bg-[#1a1a1a]' : 'bg-[#c0491a]';

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* Card background */}
      <div className={`${cardBg} w-[100px] h-[110px] rounded-2xl shadow-lg flex items-center justify-center`}>
        {/* White circle */}
        <div className="w-[76px] h-[76px] rounded-full bg-white flex items-center justify-center">
          {/* Person silhouette */}
          <svg viewBox="0 0 40 40" className="w-10 h-10" fill={bgColor}>
            {isAdult ? (
              <>
                <circle cx="20" cy="13" r="7" />
                <path d="M8 36c0-6.627 5.373-12 12-12s12 5.373 12 12" />
              </>
            ) : (
              <>
                <circle cx="20" cy="15" r="6" />
                <path d="M10 36c0-5.523 4.477-10 10-10s10 4.477 10 10" />
              </>
            )}
          </svg>
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
      <Cloud className="absolute top-[12%] w-20 text-violet-200 dark:text-violet-900/40 animate-[cloud-drift_18s_linear_infinite]" />
      <Cloud className="absolute top-[8%] right-0 w-16 text-violet-200/80 dark:text-violet-900/30 animate-[cloud-drift_24s_linear_infinite_3s]" />
      <Cloud className="absolute top-[22%] w-14 text-violet-200/60 dark:text-violet-900/25 animate-[cloud-drift_20s_linear_infinite_8s]" />

      {/* Main illustration */}
      <div className="relative flex items-end gap-3 mb-8 animate-[float_4s_ease-in-out_infinite]">
        <ProfileCard variant="child" className="-rotate-6" />
        <ProfileCard variant="adult" className="rotate-6 -ml-4" />
      </div>

      {/* Trees */}
      <div className="absolute bottom-[8%] left-[10%] w-14 animate-[tree-sway_5s_ease-in-out_infinite]">
        <Tree />
      </div>
      <div className="absolute bottom-[6%] right-[12%] w-12 animate-[tree-sway_6s_ease-in-out_infinite_1s]">
        <Tree />
      </div>

      {/* Text */}
      <div className="text-center z-10">
        <p className="text-[18px] font-bold text-foreground">
          {title}
          {isLoading && <span className="animate-[dots_1.5s_steps(4,end)_infinite]">...</span>}
        </p>
        {subtitle && (
          <p className="text-[14px] text-muted-foreground mt-1">{subtitle}</p>
        )}
        {(state === 'error' || state === 'offline') && onRetry && (
          <button
            onClick={onRetry}
            className="mt-5 px-6 py-2.5 rounded-full bg-[#f58a2d] text-white font-semibold text-[14px] shadow-md active:scale-95 transition-transform"
          >
            Prøv igen
          </button>
        )}
      </div>
    </div>
  );
}
