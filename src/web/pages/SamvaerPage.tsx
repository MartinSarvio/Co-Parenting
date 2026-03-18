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
      heroVisual={
        <div className="p-5 rounded-2xl bg-white/70 border border-white/40 shadow-xl max-w-[300px]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-[#2f2f2f]">Uge 12 — marts 2026</p>
            <span className="text-[11px] text-[#78766d]">7/7 model</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {['Ma','Ti','On','To','Fr','Lø','Sø'].map(d => (
              <div key={d} className="text-[10px] text-center text-[#78766d] font-semibold pb-1">{d}</div>
            ))}
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} className={`h-9 rounded-lg flex items-center justify-center text-[12px] font-semibold ${i < 7 ? 'bg-[#2f2f2f] text-white' : 'bg-[#e8e6df]/60 text-[#78766d]'}`}>
                {i + 10}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-[11px] text-[#78766d]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2f2f2f]" /> Forælder 1</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#e8e6df]" /> Forælder 2</span>
          </div>
        </div>
      }
    />
  );
}
