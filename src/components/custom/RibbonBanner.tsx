import { motion } from 'framer-motion';

const WORDS = [
  'Familie', 'Hygge', 'Huska', 'Samarbejde',
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
  fontWeight?: number;
}

function RibbonRow({ words, color, speed, direction, fontSize, opacity, top, blur, fontWeight = 800 }: RibbonRowProps) {
  const repeated = [...words, ...words, ...words];

  return (
    <motion.div
      className="absolute whitespace-nowrap will-change-transform"
      style={{
        top,
        fontSize,
        fontWeight,
        color,
        opacity,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
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
        <span key={i} className="inline-block mx-2">
          {word}
        </span>
      ))}
    </motion.div>
  );
}

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
    // Far background — very faded, large
    { words: shuffleWords(0), color: '#f5dfc4', speed: 50, direction: 'right', fontSize: '2.2rem', opacity: 0.3,  top: '-4%', blur: 1, fontWeight: 900 },

    // Background
    { words: shuffleWords(1), color: '#f0c896', speed: 42, direction: 'left',  fontSize: '1.8rem', opacity: 0.35, top: '10%' },

    // Mid-background
    { words: shuffleWords(2), color: '#eba85e', speed: 35, direction: 'right', fontSize: '2rem',  opacity: 0.45, top: '22%', fontWeight: 900 },

    // Middle — prominent
    { words: shuffleWords(3), color: '#f58a2d', speed: 30, direction: 'left',  fontSize: '2.4rem', opacity: 0.6,  top: '36%', fontWeight: 900 },

    // Foreground
    { words: shuffleWords(4), color: '#e8773f', speed: 28, direction: 'right', fontSize: '1.9rem', opacity: 0.55, top: '50%' },

    // Near foreground
    { words: shuffleWords(5), color: '#d4621a', speed: 33, direction: 'left',  fontSize: '2.2rem', opacity: 0.4,  top: '63%', fontWeight: 900 },

    // Far foreground — faded
    { words: shuffleWords(6), color: '#f7a95c', speed: 45, direction: 'right', fontSize: '1.7rem', opacity: 0.25, top: '76%', blur: 1 },

    // Bottom accent
    { words: shuffleWords(7), color: '#f0c896', speed: 38, direction: 'left',  fontSize: '2rem',  opacity: 0.2,  top: '88%', blur: 1 },
  ];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: 'linear-gradient(170deg, #fef8f0 0%, #fdf0e0 35%, #fce6cc 70%, #f9dbb8 100%)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: 'rotate(-12deg) scale(1.5)',
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
