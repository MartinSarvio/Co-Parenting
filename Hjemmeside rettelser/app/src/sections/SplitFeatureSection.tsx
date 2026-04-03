import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

gsap.registerPlugin(ScrollTrigger);

interface SplitFeatureSectionProps {
  id: string;
  zIndex: number;
  variant: 'leftPhoto' | 'rightPhoto';
  photo: string;
  title: string;
  subtitle: string;
  body: string[];
  bullets: string[];
  badge?: string;
  overlay?: {
    type: 'chat' | 'expense';
    image: string;
  };
}

export function SplitFeatureSection({
  id,
  zIndex,
  variant,
  photo,
  title,
  subtitle,
  body,
  bullets,
  badge,
  overlay,
}: SplitFeatureSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const photoCardRef = useRef<HTMLDivElement>(null);
  const textCardRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const photoCard = photoCardRef.current;
    const textCard = textCardRef.current;
    const overlayEl = overlayRef.current;
    const textContent = textContentRef.current;

    if (!section || !photoCard || !textCard || !textContent) return;

    const textElements = textContent.querySelectorAll('.animate-text');

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
      const photoStartX = variant === 'leftPhoto' ? -80 : 80;
      const textStartX = variant === 'leftPhoto' ? 80 : -80;

      scrollTl
        .fromTo(photoCard, 
          { opacity: 0, x: photoStartX, scale: 0.95 }, 
          { opacity: 1, x: 0, scale: 1, ease: 'none' }, 
          0
        )
        .fromTo(textCard, 
          { opacity: 0, x: textStartX, scale: 0.95 }, 
          { opacity: 1, x: 0, scale: 1, ease: 'none' }, 
          0.05
        )
        .fromTo(textElements, 
          { opacity: 0, y: 15 }, 
          { opacity: 1, y: 0, stagger: 0.015, ease: 'none' }, 
          0.1
        );

      if (overlayEl) {
        scrollTl.fromTo(overlayEl, 
          { opacity: 0, y: 30, scale: 0.92 }, 
          { opacity: 1, y: 0, scale: 1, ease: 'none' }, 
          0.15
        );
      }

      // PAUSE (30%-70%): Statisk

      // UDGANG (70%-100%)
      const photoExitX = variant === 'leftPhoto' ? -50 : 50;
      const textExitX = variant === 'leftPhoto' ? 50 : -50;

      scrollTl
        .fromTo(photoCard, 
          { x: 0, opacity: 1 }, 
          { x: photoExitX, opacity: 0.35, ease: 'power2.in' }, 
          0.7
        )
        .fromTo(textCard, 
          { x: 0, opacity: 1 }, 
          { x: textExitX, opacity: 0.35, ease: 'power2.in' }, 
          0.7
        );

      if (overlayEl) {
        scrollTl.fromTo(overlayEl, 
          { y: 0, opacity: 1 }, 
          { y: 30, opacity: 0, ease: 'power2.in' }, 
          0.75
        );
      }

    }, section);

    return () => ctx.revert();
  }, [variant]);

  const isLeftPhoto = variant === 'leftPhoto';

  return (
    <section
      ref={sectionRef}
      id={id}
      className="section-pinned bg-[var(--color-bg)]"
      style={{ zIndex }}
    >
      <div className="container-huska w-full h-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full">
          {/* Fotokort */}
          <div
            ref={photoCardRef}
            className={`lg:col-span-6 xl:col-span-7 will-change-transform ${
              isLeftPhoto ? 'lg:order-1' : 'lg:order-2'
            }`}
          >
            <div className="photo-card relative aspect-[4/3] lg:aspect-[4/3] h-auto lg:h-[68vh] max-h-[600px]">
              <img
                src={photo}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              
              {/* Overlay UI-element */}
              {overlay && (
                <div
                  ref={overlayRef}
                  className={`absolute ${
                    overlay.type === 'chat' 
                      ? 'bottom-8 left-1/2 -translate-x-1/2 w-[80%] max-w-[280px]' 
                      : 'bottom-8 right-8 w-[45%] max-w-[180px]'
                  } rounded-2xl overflow-hidden shadow-2xl will-change-transform`}
                >
                  <img
                    src={overlay.image}
                    alt=""
                    loading="lazy"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tekstkort */}
          <div
            ref={textCardRef}
            className={`lg:col-span-6 xl:col-span-5 will-change-transform ${
              isLeftPhoto ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            <div className="text-card h-auto lg:h-[68vh] max-h-[600px] flex flex-col justify-center">
              <div ref={textContentRef}>
                {/* Badge */}
                {badge && (
                  <div className="animate-text mb-4">
                    <Badge className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 font-medium">
                      {badge}
                    </Badge>
                  </div>
                )}

                {/* Titel */}
                <h2 className="animate-text heading-2 mb-2">{title}</h2>

                {/* Undertitel */}
                <p className="animate-text text-lg font-medium text-[var(--color-text)] mb-4">
                  {subtitle}
                </p>

                {/* Brødtekst */}
                <div className="animate-text space-y-3 mb-6">
                  {body.map((paragraph, index) => (
                    <p key={index} className="body-text text-[var(--color-text-secondary)]">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Punkter */}
                <ul className="animate-text space-y-3">
                  {bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[var(--color-accent)]" />
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)]">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}