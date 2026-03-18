import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote, Star } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote: 'Endelig en app der forstår hverdagen som skilsmissefamilie. Samværsplanen er genial!',
    name: 'Maria K.',
    role: 'Co-parenting mor',
    initial: 'M',
    stars: 5,
  },
  {
    quote: 'Vi sparer så mange misforståelser. Alt er dokumenteret og begge har overblikket.',
    name: 'Thomas J.',
    role: 'Far til to',
    initial: 'T',
    stars: 5,
  },
  {
    quote: 'Med 4 børn og 3 kalendere var vi ved at drukne. Huska samler det hele.',
    name: 'Line & Anders',
    role: 'Sammensat familie',
    initial: 'L',
    stars: 5,
  },
];

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;

    if (!section || !header || !cards) return;

    const cardElements = cards.querySelectorAll('.testimonial-card');

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
          { opacity: 0, y: 25 },
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
      id="testimonials"
      className="section-flowing bg-[var(--color-bg)] z-[80]"
    >
      <div className="container-huska">
        <div ref={headerRef} className="text-center mb-12 lg:mb-16">
          <h2 className="heading-2 mb-4">Familier elsker Huska</h2>
          <p className="body-text text-[var(--color-text-secondary)] max-w-md mx-auto">
            Brugt af familier over hele Danmark
          </p>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card relative p-6 rounded-2xl bg-white border border-[#e5e3dc] shadow-sm will-change-transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <Quote className="w-5 h-5 text-[#1a1a1a]/15 mb-3" />

              <p className="text-[14px] text-[#4a4a4a] leading-relaxed mb-4">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-[13px] font-bold">
                  {testimonial.initial}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">{testimonial.name}</p>
                  <p className="text-[11px] text-[#78766d]">{testimonial.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: testimonial.stars }).map((_, j) => (
                    <Star key={j} className="w-3 h-3 fill-[#1a1a1a] text-[#1a1a1a]" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
