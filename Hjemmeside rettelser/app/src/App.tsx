import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { GrainOverlay } from './components/GrainOverlay';

import { HeroSection } from './sections/HeroSection';
import { FeaturesOverviewSection } from './sections/FeaturesOverviewSection';
import { SplitFeatureSection } from './sections/SplitFeatureSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { PricingSection } from './sections/PricingSection';
import { AboutSection } from './sections/AboutSection';
import { ClosingSection } from './sections/ClosingSection';

import './index.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  // Global scroll-snap for fastgjorte sektioner
  useEffect(() => {
    // Vent på at alle sektioner monteres og opretter deres ScrollTriggers
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter((st) => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      
      if (!maxScroll || pinned.length === 0) return;

      // Byg områder og snap-mål fra fastgjorte sektioner
      const pinnedRanges = pinned.map((st) => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      // Opret global snap
      ScrollTrigger.create({
        snap: {
          snapTo: (value) => {
            // Tjek om inden for et fastgjort område (med lille buffer)
            const inPinned = pinnedRanges.some(
              (r) => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            
            if (!inPinned) return value; // Flydende sektion: fri scroll

            // Find nærmeste fastgjorte center
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

  // Ryd alle ScrollTriggers ved afmontering
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div className="relative">
      {/* Støj-overlay */}
      <GrainOverlay />

      {/* Navigation */}
      <Navigation />

      {/* Hovedindhold */}
      <main className="relative">
        {/* Sektion 1: Hero */}
        <HeroSection />

        {/* Sektion 2: Funktionsoversigt */}
        <FeaturesOverviewSection />

        {/* Sektion 3: Samværsplan */}
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

        {/* Sektion 4: Kalender */}
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

        {/* Sektion 5: Kommunikation */}
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

        {/* Sektion 6: Udgifter */}
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

        {/* Sektion 7: Sådan virker det (flydende) */}
        <HowItWorksSection />

        {/* Sektion 8: Udtalelser (flydende) */}
        <TestimonialsSection />

        {/* Sektion 9: Priser (flydende) */}
        <PricingSection />

        {/* Sektion 10: Om os (flydende) */}
        <AboutSection />

        {/* Sektion 11: Afslutning (flydende) */}
        <ClosingSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;