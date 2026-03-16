import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';

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
  badge?: string;
  title: string;
  desc: string;
  paragraphs?: string[];
  bullets: string[];
  color: string;
  icon?: React.ComponentType<{ size?: number }>;
  reversed?: boolean;
  visual?: ReactNode;
}

export interface ComparisonRow {
  label: string;
  without: string;
  with: string;
}

export interface StepItem {
  number: string;
  title: string;
  desc: string;
  icon?: React.ComponentType<{ size?: number }>;
}

export interface FAQItem {
  q: string;
  a: string;
}

interface FeaturePageLayoutProps {
  badge: string;
  badgeIcon: React.ComponentType<{ size?: number }>;
  title: string;
  titleHighlight: string;
  subtitle: string;
  subtitleExtra?: string;
  color: string;
  features: FeatureCard[];
  featuresTitle?: string;
  featuresSubtitle?: string;
  details: DetailSection[];
  comparison?: { title: string; subtitle: string; rows: ComparisonRow[] };
  steps?: { title: string; subtitle: string; items: StepItem[] };
  faq?: { title: string; items: FAQItem[] };
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonLabel?: string;
  ctaButtonHref?: string;
  heroVisual?: ReactNode;
}

function FAQSection({ title, items }: { title: string; items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const secRef = useInView();

  return (
    <section className="py-20">
      <div
        ref={secRef.ref}
        className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 ${secRef.visible ? 'animate-fadeIn' : 'opacity-0'}`}
      >
        <h2 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] text-center mb-12 tracking-[-0.02em]">{title}</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border border-[#e5e3dc] rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="text-[15px] font-semibold text-[#1a1a1a] pr-4">{item.q}</span>
                <ChevronDown size={18} className={`text-[#78766d] shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5">
                  <p className="text-[14px] text-[#4a4a4a] leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FeaturePageLayout({
  badge,
  badgeIcon: BadgeIcon,
  title,
  titleHighlight,
  subtitle,
  subtitleExtra,
  color,
  features,
  featuresTitle = 'Alt hvad du har brug for',
  featuresSubtitle,
  details,
  comparison,
  steps,
  faq,
  ctaTitle,
  ctaSubtitle,
  ctaButtonLabel = 'Kom i gang — gratis',
  ctaButtonHref = '#funktioner',
  heroVisual,
}: FeaturePageLayoutProps) {
  const heroRef = useInView();
  const featRef = useInView();
  const compRef = useInView();
  const stepsRef = useInView();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 bg-[#fafaf9]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] opacity-30" style={{ background: color }} />
        </div>

        <div
          ref={heroRef.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${heroRef.visible ? 'animate-fadeIn' : 'opacity-0'}`}
        >
          <div className={heroVisual ? 'grid grid-cols-1 lg:grid-cols-2 gap-16 items-center' : 'text-center'}>
            <div className={heroVisual ? '' : 'max-w-3xl mx-auto'}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 bg-[#1a1a1a]/5 text-[#1a1a1a]">
                <BadgeIcon size={14} /> {badge}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-[800] text-[#1a1a1a] tracking-[-0.03em] leading-[1.08]">
                {title}{' '}
                <span className="text-[#1a1a1a]">{titleHighlight}</span>
              </h1>

              <p className="mt-6 text-lg text-[#4a4a4a] max-w-2xl leading-relaxed">
                {subtitle}
              </p>
              {subtitleExtra && (
                <p className="mt-3 text-[15px] text-[#6b6b6b] max-w-2xl leading-relaxed">
                  {subtitleExtra}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-10">
                <a
                  href={ctaButtonHref}
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-bold text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-[#1a1a1a]"
                >
                  {ctaButtonLabel}
                  <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold text-[#1a1a1a] rounded-full border border-[#e5e3dc] hover:bg-[#f5f5f4] transition-colors"
                >
                  Se alle funktioner
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

      {/* Comparison table */}
      {comparison && (
        <section className="py-20 bg-white">
          <div
            ref={compRef.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${compRef.visible ? 'animate-fadeIn' : 'opacity-0'}`}
          >
            <h2 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] text-center mb-3 tracking-[-0.02em]">{comparison.title}</h2>
            <p className="text-center text-[#4a4a4a] mb-10 max-w-2xl mx-auto">{comparison.subtitle}</p>

            <div className="rounded-2xl border border-[#e5e3dc] overflow-hidden">
              <div className="grid grid-cols-3 text-[12px] font-bold text-[#78766d] uppercase tracking-wider px-6 py-4 bg-[#fafaf9] border-b border-[#e5e3dc]">
                <div></div>
                <div className="text-center">Uden Huska</div>
                <div className="text-center">Med Huska</div>
              </div>
              {comparison.rows.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 px-6 py-4 text-[14px] ${i < comparison.rows.length - 1 ? 'border-b border-[#e5e3dc]/60' : ''}`}
                >
                  <div className="font-semibold text-[#1a1a1a]">{row.label}</div>
                  <div className="text-center text-[#78766d]">{row.without}</div>
                  <div className="text-center font-semibold text-[#1a1a1a]">{row.with}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feature grid */}
      <section className="py-20 bg-[#fafaf9]">
        <div
          ref={featRef.ref}
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${featRef.visible ? 'animate-fadeIn' : 'opacity-0'}`}
        >
          <h2 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] text-center mb-3 tracking-[-0.02em]">{featuresTitle}</h2>
          {featuresSubtitle && (
            <p className="text-center text-[#4a4a4a] mb-12 max-w-2xl mx-auto">{featuresSubtitle}</p>
          )}
          {!featuresSubtitle && <div className="mb-12" />}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-white border border-[#e5e3dc] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#1a1a1a]/5">
                  <f.icon size={22} className="text-[#1a1a1a]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-2">{f.title}</h3>
                <p className="text-[14px] text-[#4a4a4a] leading-relaxed">{f.desc}</p>
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
            <section key={i} className={`py-20 ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafaf9]'}`}>
              <div
                ref={secRef.ref}
                className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${secRef.visible ? 'animate-slideUp' : 'opacity-0'}`}
              >
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center`}>
                  <div className={d.reversed ? 'lg:order-2' : ''}>
                    {d.badge && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-[#1a1a1a]/5 text-[#1a1a1a]">
                        {d.icon && <d.icon size={14} />} {d.badge}
                      </div>
                    )}
                    <h3 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] tracking-[-0.02em] leading-[1.15]">
                      {d.title}
                    </h3>
                    <p className="mt-4 text-[#4a4a4a] leading-relaxed text-[15px]">{d.desc}</p>
                    {d.paragraphs?.map((p, j) => (
                      <p key={j} className="mt-3 text-[#4a4a4a] leading-relaxed text-[15px]">{p}</p>
                    ))}
                    <ul className="mt-6 space-y-3">
                      {d.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-[14px] text-[#1a1a1a]">
                          <Check size={18} className="text-[#1a1a1a] shrink-0 mt-0.5" />
                          <span>{b}</span>
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

      {/* Steps */}
      {steps && (
        <section className="py-20 bg-[#fafaf9]">
          <div
            ref={stepsRef.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${stepsRef.visible ? 'animate-fadeIn' : 'opacity-0'}`}
          >
            <h2 className="text-2xl sm:text-3xl font-[800] text-[#1a1a1a] text-center mb-3 tracking-[-0.02em]">{steps.title}</h2>
            <p className="text-center text-[#4a4a4a] mb-12 max-w-2xl mx-auto">{steps.subtitle}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.items.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-lg font-bold mx-auto mb-5">
                    {step.number}
                  </div>
                  <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-2">{step.title}</h3>
                  <p className="text-[14px] text-[#4a4a4a] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq && <FAQSection title={faq.title} items={faq.items} />}

      {/* CTA */}
      <section className="py-20 bg-[#1a1a1a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-[800] text-white tracking-[-0.02em]">
            {ctaTitle}
          </h2>
          <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed">
            {ctaSubtitle}
          </p>
          <a
            href={ctaButtonHref}
            className="group inline-flex items-center justify-center gap-2.5 mt-8 px-8 py-4 text-[15px] font-bold text-[#1a1a1a] bg-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            {ctaButtonLabel}
            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* Back link */}
      <div className="text-center py-10 bg-white">
        <a href="#" className="text-[14px] text-[#78766d] hover:text-[#1a1a1a] transition-colors">
          ← Tilbage til forsiden
        </a>
      </div>
    </div>
  );
}
