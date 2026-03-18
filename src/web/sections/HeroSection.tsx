import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Apple, ChevronDown, Shield, Clock, Sparkles, Heart } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const phone = phoneRef.current;
    const eyebrow = eyebrowRef.current;
    const headline = headlineRef.current;
    const subheadline = subheadlineRef.current;
    const buttons = buttonsRef.current;
    const badges = badgesRef.current;

    if (!section || !content || !phone || !eyebrow || !headline || !subheadline || !buttons || !badges) return;

    const ctx = gsap.context(() => {
      gsap.set([eyebrow, headline, subheadline], { opacity: 0, y: 20 });
      gsap.set(phone, { opacity: 0, x: 60, rotateZ: -4, scale: 0.95 });
      gsap.set(buttons.children, { opacity: 0, y: 12 });
      gsap.set(badges.children, { opacity: 0, y: 12 });

      const entranceTl = gsap.timeline({ delay: 0.15 });

      entranceTl
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
        .to(headline, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.25')
        .to(subheadline, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.25')
        .to(phone, { opacity: 1, x: 0, rotateZ: -1, scale: 1, duration: 0.4, ease: 'power2.out' }, '-=0.3')
        .to(buttons.children, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }, '-=0.2')
        .to(badges.children, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' }, '-=0.15');

      gsap.to(phone, {
        y: -4,
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.5,
          onLeaveBack: () => {
            gsap.to([eyebrow, headline, subheadline], { opacity: 1, y: 0, duration: 0.25 });
            gsap.to(phone, { opacity: 1, x: 0, rotateZ: -1, scale: 1, duration: 0.25 });
            gsap.to(buttons.children, { opacity: 1, y: 0, duration: 0.25 });
            gsap.to(badges.children, { opacity: 1, y: 0, duration: 0.25 });
          },
        },
      });

      scrollTl
        .fromTo(content,
          { y: 0, opacity: 1 },
          { y: '-12vh', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(phone,
          { x: 0, rotateZ: -1, opacity: 1 },
          { x: '12vw', rotateZ: 4, opacity: 0, ease: 'power2.in' },
          0.7
        );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="section-pinned bg-[var(--color-bg)] z-10"
    >
      <div className="container-huska w-full h-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full pt-20">
          <div ref={contentRef} className="max-w-xl">
            <div ref={eyebrowRef} className="mb-6">
              <span className="eyebrow-pill">
                <Heart className="w-4 h-4 text-[var(--color-accent)]" />
                Lavet til familier i Danmark
              </span>
            </div>

            <h1
              ref={headlineRef}
              className="heading-1 mb-6"
            >
              Koordinér
              <br />
              hverdagen
              <br />
              <span className="text-[var(--color-text-secondary)]">med din familie</span>
            </h1>

            <p
              ref={subheadlineRef}
              className="body-text text-[var(--color-text-secondary)] mb-8 max-w-md"
            >
              Én sandhedskilde for hele familien. Samværsplan, kalender, kommunikation, udgifter og meget mere — samlet i én app.
            </p>

            <div ref={buttonsRef} className="flex flex-wrap gap-4 mb-10">
              <a href="#download" className="btn-primary inline-flex items-center gap-2">
                <Apple className="w-5 h-5" />
                Hent til iPhone
              </a>
              <a href="#features" className="btn-secondary inline-flex items-center gap-2">
                Se funktioner
                <ChevronDown className="w-4 h-4" />
              </a>
            </div>

            <div ref={badgesRef} className="flex flex-wrap gap-6">
              <span className="trust-badge">
                <Shield className="w-4 h-4 text-[var(--color-accent)]" />
                Sikker
              </span>
              <span className="trust-badge">
                <Clock className="w-4 h-4 text-[var(--color-accent)]" />
                Tidsbesparende
              </span>
              <span className="trust-badge">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                Gratis
              </span>
            </div>
          </div>

          <div
            ref={phoneRef}
            className="hidden lg:flex justify-center items-center will-change-transform"
          >
            <div className="phone-mockup relative">
              <img
                src="/images/hero-phone-ui.jpg"
                alt="Huska App Brugerflade"
                loading="lazy"
                className="w-full max-w-[280px] xl:max-w-[320px] rounded-[36px]"
                style={{
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
