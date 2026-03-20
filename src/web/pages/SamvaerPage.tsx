import {
  Calendar,
  CalendarRange,
  Palmtree,
  Users,
  RefreshCw,
  Bell,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: CalendarRange, title: 'Faste modeller', desc: 'Vælg mellem 7/7, 10/4, 14/14 eller andre faste samværsmodeller med ét klik.', color: '#1a1a1a' },
  { icon: RefreshCw, title: 'Fleksibel plan', desc: 'Lav din helt egen model dag-for-dag. Tilpas løbende efter behov.', color: '#1a1a1a' },
  { icon: Palmtree, title: 'Ferie- og helligdage', desc: 'Planlæg ferier, helligdage og skolefridage separat. Aldrig tvivl om hvem der har børnene.', color: '#1a1a1a' },
  { icon: Users, title: 'Del med netværket', desc: 'Del samværsplanen med bedsteforældre, nye partnere og andre vigtige personer.', color: '#1a1a1a' },
  { icon: Bell, title: 'Skift-påmindelser', desc: 'Automatisk påmindelse dagen før et skift. Aldrig glem forberedelse.', color: '#1a1a1a' },
  { icon: Calendar, title: 'Historik', desc: 'Se hele samværshistorikken. Dokumentation til enhver tid.', color: '#1a1a1a' },
];

const details = [
  {
    title: 'Samværsplan der bare virker',
    highlightText: 'bare virker',
    desc: 'Vælg en fast model eller byg din egen. Planen synkroniseres automatisk, så begge forældre altid kan se den aktuelle plan.',
    bullets: ['7/7, 10/4, 14/14 og flere modeller', 'Automatisk synkronisering i realtid', 'Enkel visning dag-for-dag'],
    color: '#1a1a1a',
    icon: Calendar,
    visual: (
      <div className="grid grid-cols-7 gap-1 max-w-[280px]">
        {Array.from({ length: 14 }, (_, i) => (
          <div
            key={i}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-semibold ${i < 7 ? 'bg-[#1a1a1a]/10 text-[#1a1a1a]' : 'bg-[#1a1a1a]/[0.04] text-[#78766d]'}`}
          >
            {i + 1}
          </div>
        ))}
        <div className="col-span-7 flex gap-3 mt-2 text-[11px] text-[#78766d]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1a1a1a]/15" /> Forælder 1</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1a1a1a]/[0.06]" /> Forælder 2</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Ferier og helligdage uden konflikter',
    highlightText: 'uden konflikter',
    desc: 'Planlæg ferier, jul, påske og skolefridage separat fra den faste plan. Klare aftaler reducerer konflikter.',
    bullets: ['Separate ferieplaner', 'Alternerende helligdage', 'Eksporter til kalender-apps'],
    color: '#1a1a1a',
    icon: Palmtree,
    reversed: true,
  },
];

export default function SamvaerPage() {
  return (
    <FeaturePageLayout
      badge="Samvær"
      badgeIcon={Calendar}
      title="Samværsplan"
      titleHighlight="der virker"
      subtitle="Planlæg samvær med fast 7/7, 10/4 eller fleksibel model. Altid overblik over hvem der har børnene."
      color="#1a1a1a"
      features={features}
      details={details}
      ctaTitle="Kom i gang med samværsplanen"
      ctaSubtitle="Opret din første samværsplan på under 2 minutter. Helt gratis."
      ctaButtonLabel="Prøv gratis"
      ctaButtonHref="#funktioner"
      variant="photo-hero"
      heroPhotoSrc="/images/kalender-photo.jpg"
    />
  );
}
