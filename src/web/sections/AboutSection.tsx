import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Heart, Shield, Briefcase } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const familyTypes = [
  {
    icon: Users,
    title: 'Co-parenting',
    description: 'Fast eller fleksibel samværsplan',
  },
  {
    icon: Heart,
    title: 'Sammensatte familier',
    description: 'Flere børn, flere kalendere',
  },
  {
    icon: Shield,
    title: 'Under samme tag',
    description: 'Fordel opgaver og udgifter',
  },
  {
    icon: Briefcase,
    title: 'Professionelle',
    description: 'Socialrådgivere og sagsbehandlere',
  },
];

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const cards = cardsRef.current;

    if (!section || !content || !cards) return;

    const cardElements = cards.querySelectorAll('.family-type-card');

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

      cardElements.forEach((card, index) => {
        gsap.fromTo(card,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            delay: index * 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
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
      id="about"
      className="section-flowing bg-[var(--color-bg)] z-[87]"
    >
      <div className="container-huska">
        <div ref={contentRef} className="max-w-3xl mx-auto text-center mb-12 lg:mb-16 will-change-transform">
          <h2 className="heading-2 mb-6">Bygget til familier i Danmark</h2>
          <p className="body-text text-[var(--color-text-secondary)] mb-6">
            Huska er skabt med én mission: at gøre hverdagen lettere for danske familier. Uanset om I er samboende, co-parenting eller en sammensat familie, fortjener I et redskab der samler alt ét sted — uden forvirring og med fuld gennemsigtighed.
          </p>
          <p className="body-text text-[var(--color-text-secondary)]">
            Vi tror på, at mindre friktion i hverdagen giver mere tid til det der virkelig tæller: at være sammen med dem, man holder af.
          </p>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {familyTypes.map((type, index) => (
            <div
              key={index}
              className="family-type-card huska-card p-6 text-center will-change-transform"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
                <type.icon className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <h3 className="font-semibold mb-2">{type.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{type.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
