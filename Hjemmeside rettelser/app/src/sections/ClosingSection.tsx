import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Apple, Lock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function ClosingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;

    if (!section || !content) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(content, 
        { opacity: 0, y: 20 }, 
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
      id="download"
      className="section-flowing bg-[var(--color-dark)] z-[90]"
    >
      <div className="container-huska py-20 lg:py-28">
        <div ref={contentRef} className="max-w-2xl mx-auto text-center will-change-transform">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-8">
            <Lock className="w-4 h-4 text-[var(--color-accent)]" />
            <span className="text-sm font-medium text-white/80">Krypteret data & sikker opbevaring</span>
          </div>

          {/* Titel */}
          <h2 className="heading-1 text-white mb-6">
            Klar til at koordinere hverdagen?
          </h2>

          {/* Beskrivelse */}
          <p className="body-text text-white/70 mb-10 max-w-lg mx-auto">
            Hent Huska gratis og kom i gang med at skabe mere struktur og mindre friktion i din families hverdag.
          </p>

          {/* CTA-knapper */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://apps.apple.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4"
            >
              <Apple className="w-5 h-5" />
              Hent appen nu
            </a>
          </div>

          {/* Partnerlink */}
          <p className="mt-10 text-white/50 text-sm">
            Er du kommune eller professionel?{' '}
            <a href="#partner" className="text-[var(--color-accent)] hover:underline">
              Se partnerprogrammet
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}