import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Calendar, MessageSquare, Wallet, CheckSquare, ShoppingCart, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Users,
    title: 'Samværsplan',
    description: 'Planlæg samvær med fast 7/7, 10/4 eller fleksibel model. Altid overblik over hvem der har børnene.',
  },
  {
    icon: Calendar,
    title: 'Kalender',
    description: 'Fælles familiekalender med begivenheder, aktiviteter og vigtige datoer for alle.',
  },
  {
    icon: MessageSquare,
    title: 'Kommunikation',
    description: 'Struktureret kommunikation mellem forældre. Tråde, beskeder og historik.',
  },
  {
    icon: Wallet,
    title: 'Udgifter',
    description: 'Del udgifter retfærdigt. Hold styr på budgetter, balancer og kvitteringer.',
  },
  {
    icon: CheckSquare,
    title: 'Opgaver',
    description: 'Fordel og følg op på familiens opgaver. Se hvem der gør hvad og hvornår.',
  },
  {
    icon: ShoppingCart,
    title: 'Mad & Indkøb',
    description: 'Madplan og indkøbslister. Se ugens bedste tilbud fra lokale butikker.',
  },
];

export function FeaturesOverviewSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;

    if (!section || !header || !cards) return;

    const cardElements = cards.querySelectorAll('.feature-card');

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.5,
        },
      });

      // INDGANG (0%-30%)
      scrollTl
        .fromTo(header, 
          { opacity: 0, y: -30 }, 
          { opacity: 1, y: 0, ease: 'none' }, 
          0
        )
        .fromTo(cardElements, 
          { opacity: 0, y: 40, scale: 0.97 }, 
          { opacity: 1, y: 0, scale: 1, stagger: 0.02, ease: 'none' }, 
          0.05
        );

      // PAUSE (30%-70%): Statisk

      // UDGANG (70%-100%)
      cardElements.forEach((card, i) => {
        const xOffset = i % 3 === 0 ? -40 : i % 3 === 2 ? 40 : 0;
        scrollTl.fromTo(card, 
          { x: 0, scale: 1, opacity: 1 }, 
          { x: xOffset, scale: 0.95, opacity: 0.35, ease: 'power2.in' }, 
          0.7 + i * 0.015
        );
      });
      
      scrollTl.fromTo(header, 
        { opacity: 1 }, 
        { opacity: 0, ease: 'power2.in' }, 
        0.85
      );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="section-pinned bg-[var(--color-bg)] z-20"
    >
      <div className="container-huska w-full h-full flex flex-col justify-center">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-10 lg:mb-14">
          <h2 className="heading-2 mb-4">Alt-i-én platform</h2>
          <p className="body-text text-[var(--color-text-secondary)] max-w-md mx-auto">
            Alt hvad din familie har brug for
          </p>
        </div>

        {/* Funktionskort gitter */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card huska-card will-change-transform"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <h3 className="heading-3 mb-2">{feature.title}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}