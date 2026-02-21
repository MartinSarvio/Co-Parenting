import { motion } from 'framer-motion';

const WORDS = [
  'Familie', 'Hygge', 'Hverdag', 'Samarbejde',
  'Kærlighed', 'Børn', 'Tryghed', 'Glæde',
  'Sammen', 'Omsorg', 'Tillid', 'Hjem',
];

interface RibbonRowProps {
  words: string[];
  color: string;
  speed: number;
  direction: 'left' | 'right';
  fontSize: string;
  opacity: number;
  top: string;
  blur?: number;
}

function RibbonRow({ words, color, speed, direction, fontSize, opacity, top, blur }: RibbonRowProps) {
  // Triple the words for seamless loop
  const repeated = [...words, ...words, ...words];

  return (
    <motion.div
      className="absolute whitespace-nowrap"
      style={{
        top,
        fontSize,
        fontWeight: 900,
        color,
        opacity,
        letterSpacing: '-0.03em',
        filter: blur ? `blur(${blur}px)` : undefined,
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
      animate={{
        x: direction === 'left' ? ['0%', '-33.33%'] : ['-33.33%', '0%'],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {repeated.map((word, i) => (
        <span key={i} className="inline-block mx-3">
          {word}
        </span>
      ))}
    </motion.div>
  );
}

// Shuffled word sets for variety per row
function shuffleWords(offset: number): string[] {
  const arr = [...WORDS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (i + offset) % arr.length;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function RibbonBanner() {
  const rows: RibbonRowProps[] = [
    // Background layer — large, faded
    { words: shuffleWords(0), color: '#fde0b8', speed: 45, direction: 'right', fontSize: '4.5rem', opacity: 0.18, top: '-8%', blur: 1 },
    { words: shuffleWords(1), color: '#f7c589', speed: 38, direction: 'left',  fontSize: '3.8rem', opacity: 0.22, top: '12%' },

    // Middle layer — medium, semi-visible
    { words: shuffleWords(2), color: '#f7a95c', speed: 30, direction: 'right', fontSize: '3.2rem', opacity: 0.35, top: '28%' },
    { words: shuffleWords(3), color: '#f58a2d', speed: 35, direction: 'left',  fontSize: '3.5rem', opacity: 0.45, top: '44%' },

    // Foreground layer — bold, high contrast
    { words: shuffleWords(4), color: '#e8773f', speed: 28, direction: 'right', fontSize: '3rem',  opacity: 0.65, top: '58%' },
    { words: shuffleWords(5), color: '#d4621a', speed: 32, direction: 'left',  fontSize: '3.8rem', opacity: 0.55, top: '72%' },

    // Bottom accent
    { words: shuffleWords(6), color: '#f58a2d', speed: 40, direction: 'right', fontSize: '4rem',  opacity: 0.25, top: '88%', blur: 1 },
  ];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #fdf6ee 0%, #fff2e2 40%, #fde8d0 100%)',
      }}
    >
      {/* Rotated container for diagonal flow */}
      <div
        className="absolute inset-0"
        style={{
          transform: 'rotate(-12deg) scale(1.4)',
          transformOrigin: 'center center',
        }}
      >
        {rows.map((row, i) => (
          <RibbonRow key={i} {...row} />
        ))}
      </div>
    </div>
  );
}
