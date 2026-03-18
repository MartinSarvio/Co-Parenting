import {
  CalendarHeart,
  CalendarDays,
  Bell,
  RefreshCw,
  Gift,
  Stethoscope,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: CalendarDays, title: 'Fælles begivenheder', desc: 'Tilføj begivenheder begge forældre kan se. Forældremøder, fødselsdage, aktiviteter.', color: '#1a1a1a' },
  { icon: Gift, title: 'Vigtige datoer', desc: 'Glem aldrig fødselsdage, milepæle og jubilæer. Automatiske påmindelser.', color: '#1a1a1a' },
  { icon: Bell, title: 'Påmindelser', desc: 'Sæt påmindelser for begivenheder. Vælg hvornår du vil have besked — en dag, en uge eller en time før.', color: '#1a1a1a' },
  { icon: RefreshCw, title: 'Synk med telefon', desc: 'Synkronisér med din iPhones kalender. Se Huska-begivenheder sammen med dine andre aftaler.', color: '#1a1a1a' },
  { icon: Stethoscope, title: 'Lægebesøg & kontroller', desc: 'Hold styr på børnenes sundhedsaftaler. Begge forældre har adgang til alle informationer.', color: '#1a1a1a' },
  { icon: CalendarHeart, title: 'Skoledage & ferier', desc: 'Importér skolens ferieplan og planlæg herefter. Aldrig tvivl om skolefridage.', color: '#1a1a1a' },
];

const details = [
  {
    title: 'Én kalender for hele familien',
    highlightText: 'hele familien',
    desc: 'Se alles begivenheder samlet ét sted. Forældre, børn, bedsteforældre — alle har adgang til det de skal vide.',
    bullets: ['Farvekodede begivenheder pr. person', 'Dag-, uge- og månedsvisning', 'Integreret med samværsplanen'],
    color: '#1a1a1a',
    icon: CalendarHeart,
    visual: (
      <div className="max-w-[260px]">
        <div className="p-4 rounded-2xl bg-white/70 border border-white/40">
          <p className="text-[13px] font-bold text-[#2f2f2f] mb-3">Marts 2026</p>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
            {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map(d => (
              <div key={d} className="text-[#78766d] font-semibold py-1">{d}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => {
              const hasEvent = [5, 12, 18, 23, 28].includes(i + 1);
              return (
                <div
                  key={i}
                  className={`py-1.5 rounded-lg text-[12px] ${hasEvent ? 'bg-[#1a1a1a]/10 text-[#1a1a1a] font-bold' : 'text-[#5f5d56]'}`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              { date: '5. mar', event: 'Forældremøde', color: '#1a1a1a' },
              { date: '18. mar', event: 'Emmas fødselsdag', color: '#1a1a1a' },
              { date: '23. mar', event: 'Tandlæge', color: '#1a1a1a' },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                <span className="text-[#78766d]">{e.date}</span>
                <span className="text-[#2f2f2f] font-medium">{e.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Aldrig glem vigtige datoer',
    highlightText: 'vigtige datoer',
    desc: 'Fødselsdage, lægebesøg, forældremøder og milepæle — alt samlet med automatiske påmindelser.',
    bullets: ['Automatiske fødselsdags-påmindelser', 'Sundhedsaftaler med noter', 'Eksporter til Apple/Google kalender'],
    color: '#1a1a1a',
    icon: Gift,
    reversed: true,
  },
];

export default function KalenderPage() {
  return (
    <FeaturePageLayout
      badge="Kalender"
      badgeIcon={CalendarHeart}
      title="Fælles"
      titleHighlight="familiekalender"
      subtitle="Fælles familiekalender med begivenheder, aktiviteter og vigtige datoer for alle. Aldrig gå glip af noget."
      color="#1a1a1a"
      features={features}
      details={details}
      ctaTitle="Få fælles overblik"
      ctaSubtitle="Opret din familiekalender i dag. Helt gratis."
      ctaButtonLabel="Prøv gratis"
      ctaButtonHref="#funktioner"
    />
  );
}
