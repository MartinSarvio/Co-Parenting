import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  'Samværsplan',
  'Fælles kalender',
  'Kommunikation',
  'Udgiftsdeling',
  'Opgaver',
  'Madplan & indkøb',
  'Påmindelser',
  'Krypteret data',
];

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;

    if (!section || !content) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(content,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: content,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          }
        }
      );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="section-flowing bg-[var(--color-bg)] z-[85]"
    >
      <div className="container-huska">
        <div ref={contentRef} className="max-w-3xl mx-auto will-change-transform">
          <div className="huska-card-lg p-10 lg:p-14 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)]/10 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-sm font-medium text-[var(--color-accent)]">Helt gratis</span>
            </div>

            <h2 className="heading-2 mb-4">Ingen skjulte omkostninger</h2>
            <p className="body-text text-[var(--color-text-secondary)] mb-8">
              Alle funktioner er gratis for familier. Ingen abonnement, ingen prøveperiode.
            </p>

            <div className="mb-10">
              <span className="text-6xl lg:text-7xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                0 kr
              </span>
              <span className="text-[var(--color-text-secondary)] ml-2">/ for altid</span>
            </div>

            <a href="#download" className="btn-primary inline-flex items-center gap-2 mb-10">
              Hent appen nu
            </a>

            <div className="border-t border-gray-200 pt-10">
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-6 uppercase tracking-wide">
                Alt inkluderet
              </p>

              <div className="grid grid-cols-2 gap-4 text-left">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[var(--color-accent)]" />
                    </div>
                    <span className="text-sm text-[var(--color-text-secondary)]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
