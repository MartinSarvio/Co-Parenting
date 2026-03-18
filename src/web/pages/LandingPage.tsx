import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { GrainOverlay } from '../components/GrainOverlay';
import { HeroSection } from '../sections/HeroSection';
import { FeaturesOverviewSection } from '../sections/FeaturesOverviewSection';
import { SplitFeatureSection } from '../sections/SplitFeatureSection';
import { HowItWorksSection } from '../sections/HowItWorksSection';
import { TestimonialsSection } from '../sections/TestimonialsSection';
import { PricingSection } from '../sections/PricingSection';
import { AboutSection } from '../sections/AboutSection';
import { ClosingSection } from '../sections/ClosingSection';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  // Global scroll-snap for pinned sections
  useEffect(() => {
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter((st) => st.vars.pin)
        .sort((a, b) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);

      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map((st) => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            const inPinned = pinnedRanges.some(
              (r) => value >= r.start - 0.02 && value <= r.end + 0.02
            );

            if (!inPinned) return value;

            const target = pinnedRanges.reduce(
              (closest, r) =>
                Math.abs(r.center - value) < Math.abs(closest - value)
                  ? r.center
                  : closest,
              pinnedRanges[0]?.center ?? 0
            );

            return target;
          },
          duration: { min: 0.15, max: 0.3 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Clean up all ScrollTriggers on unmount
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div className="web-landing relative">
      <GrainOverlay />

      <main className="relative">
        <HeroSection />

        <FeaturesOverviewSection />

        <SplitFeatureSection
          id="samvaersplan"
          zIndex={30}
          variant="leftPhoto"
          photo="/images/samvaersplan-photo.jpg"
          title="Samværsplan"
          subtitle="Altid overblik over hvem der har børnene"
          body={[
            'Vælg mellem 7/7, 10/4, 14/14 eller lav din helt egen model.',
            'Samværsplanen synkroniserer automatisk, så begge forældre altid kan se den aktuelle plan.',
          ]}
          bullets={[
            'Fast eller fleksibel model',
            'Automatisk synkronisering',
            'Ferie- og helligdage inkluderet',
          ]}
          badge="Populær"
        />

        <SplitFeatureSection
          id="kalender"
          zIndex={40}
          variant="rightPhoto"
          photo="/images/kalender-photo.jpg"
          title="Kalender"
          subtitle="Fælles overblik over familiens tid"
          body={[
            'Se alle aktiviteter, afhentninger, fødselsdage og aftaler ét sted.',
            'Hver forælder tilføjer det, der passer til jeres hverdag — og begge ser det med det samme.',
          ]}
          bullets={[
            'Farvekoder per familie',
            'Påmindelser og notifikationer',
            'Synkroniseret på tværs af enheder',
          ]}
        />

        <SplitFeatureSection
          id="kommunikation"
          zIndex={50}
          variant="leftPhoto"
          photo="/images/kommunikation-photo.jpg"
          title="Kommunikation"
          subtitle="Struktureret dialog uden misforståelser"
          body={[
            'Hold al kommunikation samlet ét sted. Tråde og beskeder giver overblik og historik.',
            'Perfekt til co-parenting hvor klarhed er alt.',
          ]}
          bullets={[
            'Alt gemt som dokumentation',
            'Tråde pr. emne',
            'Push-notifikationer i realtid',
          ]}
          overlay={{
            type: 'chat',
            image: '/images/chat-bubble-ui.png',
          }}
        />

        <SplitFeatureSection
          id="udgifter"
          zIndex={60}
          variant="rightPhoto"
          photo="/images/udgifter-photo.jpg"
          title="Udgifter"
          subtitle="Del udgifter retfærdigt og enkelt"
          body={[
            'Registrer udgifter, se balancer og hold styr på kvitteringer — uden at skulle skrive det hele i en besked.',
          ]}
          bullets={[
            'Automatisk balance',
            'Kvitteringer vedhæftet',
            'Eksport til regnskab',
          ]}
          overlay={{
            type: 'expense',
            image: '/images/expense-list-ui.png',
          }}
        />

        <HowItWorksSection />

        <TestimonialsSection />

        <PricingSection />

        <AboutSection />

        <ClosingSection />
      </main>
    </div>
  );
}
