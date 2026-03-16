import {
  Calendar,
  CalendarRange,
  Palmtree,
  Users,
  RefreshCw,
  Bell,
  FileText,
  Share2,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: CalendarRange, title: 'Faste modeller', desc: 'Vælg mellem 7/7, 10/4, 14/14 eller andre faste samværsmodeller med ét klik. Planen genereres automatisk for hele året.', color: '#1a1a1a' },
  { icon: RefreshCw, title: 'Fleksibel plan', desc: 'Byg din helt egen model dag-for-dag. Tilpas løbende efter familiens behov, aftaler og ændringer.', color: '#1a1a1a' },
  { icon: Palmtree, title: 'Ferie- og helligdage', desc: 'Planlæg ferier, jul, påske og skolefridage separat fra den faste plan. Klare aftaler reducerer konflikter.', color: '#1a1a1a' },
  { icon: Users, title: 'Del med netværket', desc: 'Del samværsplanen med bedsteforældre, nye partnere, pædagoger eller sagsbehandlere — med begrænset adgang.', color: '#1a1a1a' },
  { icon: Bell, title: 'Skift-påmindelser', desc: 'Automatiske påmindelser dagen før et skift. Vælg selv tidspunktet og hvem der skal have besked.', color: '#1a1a1a' },
  { icon: FileText, title: 'Fuld historik', desc: 'Se hele samværshistorikken. Hvem havde børnene hvornår? Perfekt som dokumentation ved behov.', color: '#1a1a1a' },
];

const details = [
  {
    badge: 'Samværsmodeller',
    title: 'Vælg den model der passer jeres familie',
    desc: 'Huska understøtter alle gængse samværsmodeller ud af boksen. Vælg en fast model eller byg jeres helt egen — dag for dag.',
    paragraphs: [
      'De mest almindelige modeller (7/7, 10/4, 14/14) kan sættes op med ét klik. Planen genereres automatisk for hele året, inklusive skiftedage og tider.',
      'Har I en unik aftale? Brug den fleksible model til at planlægge præcis som det passer. Flyt enkeltdage, tilføj undtagelser og tilpas løbende.',
    ],
    bullets: [
      '7/7, 10/4, 14/14 og flere faste modeller',
      'Fleksibel model med dag-for-dag planlægning',
      'Automatisk generering for hele året',
      'Enkel redigering af enkeltdage og undtagelser',
    ],
    color: '#1a1a1a',
    icon: Calendar,
    visual: (
      <div className="grid grid-cols-7 gap-1.5 max-w-[280px]">
        {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map(d => (
          <div key={d} className="text-[10px] font-bold text-[#78766d] text-center uppercase">{d}</div>
        ))}
        {Array.from({ length: 28 }, (_, i) => {
          const week = Math.floor(i / 7);
          const isParent1 = week < 2;
          return (
            <div key={i} className={`w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-semibold ${isParent1 ? 'bg-[#1a1a1a]/10 text-[#1a1a1a]' : 'bg-[#d4d3cd]/30 text-[#78766d]'}`}>
              {i + 1}
            </div>
          );
        })}
        <div className="col-span-7 flex gap-4 mt-3 text-[11px] text-[#78766d]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#1a1a1a]/15" /> Forælder 1</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#d4d3cd]/40" /> Forælder 2</span>
        </div>
      </div>
    ),
  },
  {
    badge: 'Ferier',
    title: 'Ferier og helligdage uden konflikter',
    desc: 'Ferieplanlægning er ofte det mest konfliktfyldte emne for skilte forældre. Huska gør det enkelt med separate ferieplaner og klare aftaler.',
    paragraphs: [
      'Opret separate ferieplaner for sommerferie, efterårsferie, juleferie og påskeferie. Vælg alternerende helligdage, så fordelingen er retfærdig over tid.',
      'Se hele årets feriefordeling i en samlet visning. Eksportér ferieplanen til PDF eller del den direkte med skoler og institutioner.',
    ],
    bullets: ['Separate ferieplaner for hver ferieperiode', 'Alternerende helligdage og mærkedage', 'Årsvisning af feriefordeling', 'Eksportér til PDF eller kalender-apps'],
    color: '#1a1a1a',
    icon: Palmtree,
    reversed: true,
    visual: (
      <div className="max-w-[280px]">
        <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
          <p className="text-[13px] font-bold text-[#1a1a1a] mb-3">Ferieplan 2026</p>
          <div className="space-y-2">
            {[
              { period: 'Vinterferie', dates: '8-15 feb', who: 'Mor' },
              { period: 'Påske', dates: '29 mar - 5 apr', who: 'Far' },
              { period: 'Sommerferie uge 28-29', dates: '6-19 jul', who: 'Mor' },
              { period: 'Sommerferie uge 30-31', dates: '20 jul - 2 aug', who: 'Far' },
              { period: 'Efterårsferie', dates: '11-18 okt', who: 'Mor' },
              { period: 'Juleferie', dates: '23-31 dec', who: 'Far' },
            ].map((f, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[#e5e3dc]">
                <div>
                  <p className="text-[11px] font-semibold text-[#1a1a1a]">{f.period}</p>
                  <p className="text-[10px] text-[#78766d]">{f.dates}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#1a1a1a]/5 text-[10px] font-semibold text-[#1a1a1a]">{f.who}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    badge: 'Deling',
    title: 'Del planen med dem der har brug for den',
    desc: 'Børnenes hverdag involverer flere end bare forældrene. Bedsteforældre, nye partnere, pædagoger og sagsbehandlere kan alle have gavn af at se samværsplanen.',
    paragraphs: [
      'Med Huska kan du dele samværsplanen med udvalgte personer via et sikkert link. De får adgang til at se planen, men ikke ændre den.',
      'Perfekt til bedsteforældre der vil vide hvornår de kan se børnebørnene, eller sagsbehandlere der har brug for dokumentation.',
    ],
    bullets: ['Del med bedsteforældre, nye partnere og pædagoger', 'Begrænset adgang — kan se men ikke ændre', 'Sikre delingslinks med udløbsdato', 'Professionel adgang for sagsbehandlere'],
    color: '#1a1a1a',
    icon: Share2,
    visual: (
      <div className="max-w-[280px]">
        <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
          <p className="text-[13px] font-bold text-[#1a1a1a] mb-3">Delt med</p>
          <div className="space-y-2.5">
            {[
              { name: 'Mormor Inger', role: 'Bedsteforælder', access: 'Kun visning' },
              { name: 'Farmor Lise', role: 'Bedsteforælder', access: 'Kun visning' },
              { name: 'Advokat Nielsen', role: 'Professionel', access: 'Tidsbegrænset' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-[#e5e3dc]">
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a]/5 flex items-center justify-center text-[11px] font-bold text-[#1a1a1a]">
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#1a1a1a]">{p.name}</p>
                  <p className="text-[10px] text-[#78766d]">{p.role}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#1a1a1a]/5 text-[9px] font-semibold text-[#78766d] shrink-0">{p.access}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#e5e3dc] text-[11px] text-[#78766d]">
            <span>+</span> Tilføj person...
          </div>
        </div>
      </div>
    ),
  },
];

const comparison = {
  title: 'Samværsplan med Huska vs. uden',
  subtitle: 'Se forskellen på at koordinere samvær med og uden et dedikeret værktøj.',
  rows: [
    { label: 'Planlægning', without: 'SMS og mundtlige aftaler', with: 'Digital plan med automatik' },
    { label: 'Ændringsanmodninger', without: 'Kaotisk SMS-kommunikation', with: 'Strukturerede anmodninger med log' },
    { label: 'Feriefordeling', without: 'Diskussion hvert år', with: 'Automatisk alternering' },
    { label: 'Påmindelser', without: 'Ingen — ren hukommelse', with: 'Automatiske skift-påmindelser' },
    { label: 'Dokumentation', without: 'Ingen — ord mod ord', with: 'Fuld historik med tidsstempler' },
    { label: 'Deling', without: 'Screenshot af SMS', with: 'Sikkert delingslink' },
  ],
};

const steps = {
  title: 'Opret jeres samværsplan i 3 trin',
  subtitle: 'Det tager under 2 minutter at have en komplet digital samværsplan.',
  items: [
    { number: '1', title: 'Vælg model', desc: 'Vælg en fast samværsmodel (7/7, 10/4 osv.) eller start med en fleksibel plan. Planen genereres automatisk.' },
    { number: '2', title: 'Tilpas detaljer', desc: 'Juster skiftetider, tilføj ferier og helligdage, og sæt eventuelle undtagelser op.' },
    { number: '3', title: 'Del og brug', desc: 'Invitér din medforælder, del med relevante personer, og begynd at bruge planen i hverdagen.' },
  ],
};

const faq = {
  title: 'Ofte stillede spørgsmål om samvær',
  items: [
    { q: 'Hvilke samværsmodeller understøtter Huska?', a: 'Huska understøtter alle gængse modeller: 7/7, 10/4, 14/14, 12/2, og mange flere. Du kan også bygge din helt egen model dag-for-dag.' },
    { q: 'Kan jeg ændre samværsplanen løbende?', a: 'Ja. Du kan sende en ændringsanmodning til din medforælder direkte i appen. Ændringen træder først i kraft når begge har godkendt den.' },
    { q: 'Hvad sker der ved uenighed om en ændring?', a: 'Hvis en ændringsanmodning afvises, forbliver den eksisterende plan gældende. Al kommunikation om ændringer gemmes som dokumentation.' },
    { q: 'Kan samværsplanen bruges som juridisk dokumentation?', a: 'Huska gemmer en komplet historik over alle planer, ændringer og godkendelser med tidsstempler. Mange forældre bruger dette som supplement i samværssager.' },
    { q: 'Kan bedsteforældre se samværsplanen?', a: 'Ja. Du kan dele planen via et sikkert link med begrænset adgang. Modtageren kan se planen men ikke ændre den.' },
  ],
};

export default function SamvaerPage() {
  return (
    <FeaturePageLayout
      badge="Samvær"
      badgeIcon={Calendar}
      title="Samværsplan"
      titleHighlight="der bare virker"
      subtitle="Planlæg samvær med fast 7/7, 10/4 eller fleksibel model. Altid overblik over hvem der har børnene — med automatiske påmindelser og fuld historik."
      subtitleExtra="Brugt af tusindvis af danske forældre til at koordinere hverdagen."
      color="#1a1a1a"
      features={features}
      featuresTitle="Alt du har brug for til samværsplanlægning"
      featuresSubtitle="Fra faste modeller til fleksible planer, ferieplanlægning og deling — alt samlet ét sted."
      details={details}
      comparison={comparison}
      steps={steps}
      faq={faq}
      ctaTitle="Opret jeres samværsplan i dag"
      ctaSubtitle="Det tager under 2 minutter at have en komplet digital samværsplan. Helt gratis."
      ctaButtonLabel="Kom i gang — gratis"
      ctaButtonHref="#funktioner"
      heroVisual={
        <div className="relative">
          <div className="w-[260px] h-[520px] rounded-[3rem] border-[10px] border-[#1a1a1a] bg-white overflow-hidden shadow-2xl shadow-black/20">
            <div className="p-4 pt-12">
              <p className="text-[11px] font-bold text-[#78766d] uppercase tracking-wider mb-1">Uge 12</p>
              <p className="text-[16px] font-bold text-[#1a1a1a] mb-4">Samværsplan</p>
              <div className="space-y-1.5">
                {[
                  { day: 'Man 16/3', who: 'Mor', color: 'bg-[#1a1a1a]/10' },
                  { day: 'Tir 17/3', who: 'Mor', color: 'bg-[#1a1a1a]/10' },
                  { day: 'Ons 18/3', who: 'Mor', color: 'bg-[#1a1a1a]/10' },
                  { day: 'Tor 19/3', who: 'Far', color: 'bg-[#d4d3cd]/30' },
                  { day: 'Fre 20/3', who: 'Far', color: 'bg-[#d4d3cd]/30' },
                  { day: 'Lør 21/3', who: 'Far', color: 'bg-[#d4d3cd]/30' },
                  { day: 'Søn 22/3', who: 'Far', color: 'bg-[#d4d3cd]/30' },
                ].map((d, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${d.color}`}>
                    <span className="text-[12px] font-semibold text-[#1a1a1a]">{d.day}</span>
                    <span className="text-[11px] font-medium text-[#78766d]">{d.who}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-[10px] text-[#78766d]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#1a1a1a]/15" /> Mor</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#d4d3cd]/40" /> Far</span>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
