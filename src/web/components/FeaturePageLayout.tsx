import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export interface FeatureCard {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  title: string;
  desc: string;
  color: string;
}

export interface DetailSection {
  title: string;
  highlightText?: string;
  desc: string;
  bullets: string[];
  color: string;
  icon?: React.ComponentType<{ size?: number }>;
  reversed?: boolean;
  visual?: ReactNode;
}

interface FeaturePageLayoutProps {
  badge: string;
  badgeIcon: React.ComponentType<{ size?: number }>;
  title: string;
  titleHighlight: string;
  subtitle: string;
  color: string;
  features: FeatureCard[];
  details: DetailSection[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonLabel?: string;
  ctaButtonHref?: string;
  heroVisual?: ReactNode;
}

export default function FeaturePageLayout({
  badge,
  badgeIcon: BadgeIcon,
  title,
  titleHighlight,
  subtitle,
  color,
  features,
  details,
  ctaTitle,
  ctaSubtitle,
  ctaButtonLabel = 'Kom i gang',
  ctaButtonHref = '#funktioner',
  heroVisual,
}: FeaturePageLayoutProps) {
  const heroRef = useInView();
  const featRef = useInView();

  return (
    <div className="min-h-screen bg-[#f2f1ed]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[80px]" style={{ background: `${color}15`, animation: 'meshFloat 12s ease-in-out infinite' }} />
          <div className="absolute bottom-[-10%] left-[-8%] w-[400px] h-[400px] rounded-full blur-[60px]" style={{ background: `${color}10`, animation: 'meshFloat 10s ease-in-out infinite reverse' }} />
        </div>

        <div
          ref={heroRef.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${heroRef.visible ? 'animate-fadeIn' : 'opacity-0'}`}
        >
          <div className={heroVisual ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center' : 'text-center'}>
            <div className={heroVisual ? '' : 'max-w-3xl mx-auto'}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6" style={{ background: `${color}12`, color }}>
                <BadgeIcon size={14} /> {badge}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-[800] text-[#2f2f2f] tracking-[-0.03em] leading-[1.1]">
                {title}
                <span className="block bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
                  {titleHighlight}
                </span>
              </h1>

              <p className="mt-6 text-[1.1rem] text-[#5f5d56] max-w-2xl leading-relaxed">
                {subtitle}
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <a
                  href={ctaButtonHref}
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-bold text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  style={{ background: `linear-gradient(135deg, ${color}cc, ${color})`, boxShadow: `0 8px 24px ${color}30` }}
                >
                  {ctaButtonLabel}
                  <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {heroVisual && (
              <div className="flex justify-center">
                {heroVisual}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-16">
        <div
          ref={featRef.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${featRef.visible ? 'animate-fadeIn' : 'opacity-0'}`}
        >
          <h2 className="text-2xl font-bold text-[#2f2f2f] text-center mb-10">Funktioner</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl backdrop-blur-sm bg-white/70 border border-white/40 shadow-lg shadow-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}15` }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="text-[15px] font-bold text-[#2f2f2f] mb-1">{f.title}</h3>
                <p className="text-[13px] text-[#78766d] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail sections */}
      {details.map((d, i) => {
        const Section = () => {
          const secRef = useInView();
          return (
            <section key={i} className="py-16">
              <div
                ref={secRef.ref}
                className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${secRef.visible ? 'animate-slideUp' : 'opacity-0'}`}
              >
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${d.reversed ? 'lg:direction-rtl' : ''}`}>
                  <div className={d.reversed ? 'lg:order-2' : ''}>
                    {d.icon && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: `${d.color}12`, color: d.color }}>
                        <d.icon size={14} /> {d.title}
                      </div>
                    )}
                    <h3 className="text-2xl sm:text-3xl font-[800] text-[#2f2f2f] tracking-[-0.02em] leading-[1.15]">
                      {d.highlightText ? (
                        <>
                          {d.title.replace(d.highlightText, '')}
                          <span style={{ color: d.color }}>{d.highlightText}</span>
                        </>
                      ) : d.title}
                    </h3>
                    <p className="mt-4 text-[#5f5d56] leading-relaxed">{d.desc}</p>
                    <ul className="mt-5 space-y-3">
                      {d.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-3 text-[14px] text-[#5f5d56]">
                          <Check size={16} style={{ color: d.color }} className="shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {d.visual && (
                    <div className={`flex justify-center ${d.reversed ? 'lg:order-1' : ''}`}>
                      {d.visual}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        };
        return <Section key={i} />;
      })}

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative text-center rounded-[2rem] p-10 md:p-14 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${color}08, ${color}15, ${color}10)` }}
          >
            <div className="absolute top-[-60px] right-[-30px] w-[250px] h-[250px] rounded-full blur-[50px] pointer-events-none" style={{ background: `${color}15` }} />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-[800] text-[#2f2f2f] tracking-[-0.02em]">
                {ctaTitle}
              </h2>
              <p className="mt-4 text-[#5f5d56] max-w-lg mx-auto leading-relaxed">
                {ctaSubtitle}
              </p>
              <a
                href={ctaButtonHref}
                className="group inline-flex items-center justify-center gap-2.5 mt-8 px-8 py-4 text-[15px] font-bold text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: `linear-gradient(135deg, ${color}cc, ${color})`, boxShadow: `0 8px 24px ${color}30` }}
              >
                {ctaButtonLabel}
                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Back link */}
      <div className="text-center pb-16">
        <a href="#" className="text-[14px] text-[#78766d] hover:text-[#2f2f2f] transition-colors">
          ← Tilbage til forsiden
        </a>
      </div>
    </div>
  );
}
