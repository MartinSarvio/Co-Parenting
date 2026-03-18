import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ArrowDown, Shield, Clock, Sparkles, Heart, Smartphone } from 'lucide-react';

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
                <Heart className="w-4 h-4 text-[#1a1a1a]" />
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
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-8 py-4 text-[15px] font-semibold text-white bg-[#1a1a1a] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <Smartphone className="w-[18px] h-[18px]" />
                Hent til iPhone
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="#features" className="btn-secondary inline-flex items-center gap-2">
                Se funktioner
                <ArrowDown className="w-4 h-4" />
              </a>
            </div>

            <div ref={badgesRef} className="flex flex-wrap gap-6">
              <span className="trust-badge">
                <Shield className="w-4 h-4" />
                Sikker
              </span>
              <span className="trust-badge">
                <Clock className="w-4 h-4" />
                Tidsbesparende
              </span>
              <span className="trust-badge text-[#1a1a1a] font-bold">
                <Sparkles className="w-4 h-4" />
                Gratis
              </span>
            </div>
          </div>

          <div
            ref={phoneRef}
            className="hidden lg:flex justify-center items-center will-change-transform"
          >
            <div className="relative">
              <div className="absolute inset-0 scale-110 rounded-[3.5rem] bg-[#1a1a1a]/5 blur-xl" />
              <div className="relative w-[290px] h-[590px] bg-gradient-to-b from-[#fafafa] to-white rounded-[3rem] shadow-2xl shadow-black/15 border border-[#e5e3dc] p-3">
                <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative">
                  <img
                    src="/app-screenshot.png"
                    alt="Huska App — samværsplan indstillinger"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-[#1a1a1a] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
