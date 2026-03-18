import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: 1,
    title: 'Opret din familie',
    description: 'Download appen og opret en familieprofil. Vælg jeres familiemodel — co-parenting, sammensat eller under samme tag.',
  },
  {
    number: 2,
    title: 'Invitér den anden forælder',
    description: 'Send en invitation, så begge forældre kan se og opdatere fælles information i realtid.',
  },
  {
    number: 3,
    title: 'Start med samværsplanen',
    description: 'Vælg en model eller byg jeres egen. Resten følger automatisk.',
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;

    if (!section || !header || !cards) return;

    const cardElements = cards.querySelectorAll('.step-card');

    const ctx = gsap.context(() => {
      gsap.fromTo(header,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          }
        }
      );

      cardElements.forEach((card, index) => {
        gsap.fromTo(card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            delay: index * 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      });

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="section-flowing bg-[var(--color-bg)] z-[70]"
    >
      <div className="container-huska">
        <div ref={headerRef} className="text-center mb-12 lg:mb-16">
          <h2 className="heading-2 mb-4">Kom i gang på 3 trin</h2>
          <p className="body-text text-[var(--color-text-secondary)] max-w-md mx-auto">
            Det tager under 5 minutter at sætte op.
          </p>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {steps.map((step, index) => (
            <div
              key={index}
              className="step-card huska-card-lg p-8 lg:p-10 text-center will-change-transform"
            >
              <div className="w-14 h-14 rounded-full bg-[var(--color-accent)] flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">{step.number}</span>
              </div>
              <h3 className="heading-3 mb-4">{step.title}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
