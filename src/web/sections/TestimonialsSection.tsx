import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote: 'Endelig en app der forstår hverdagen som skilsmissefamilie. Samværsplanen er genial!',
    name: 'Maria K.',
    role: 'Co-parenting mor',
    avatar: '/images/avatar-maria.jpg',
  },
  {
    quote: 'Vi sparer så mange misforståelser. Alt er dokumenteret og begge har overblikket.',
    name: 'Thomas J.',
    role: 'Far til to',
    avatar: '/images/avatar-thomas.jpg',
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
            Brugt af familier over hele Danmark.
          </p>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card huska-card-lg p-8 lg:p-10 will-change-transform"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-6">
                <Quote className="w-5 h-5 text-[var(--color-accent)]" />
              </div>

              <blockquote className="text-lg lg:text-xl font-medium leading-relaxed mb-8" style={{ fontFamily: 'var(--font-heading)' }}>
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
