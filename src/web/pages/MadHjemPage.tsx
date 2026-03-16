import {
  UtensilsCrossed,
  ShoppingCart,
  Tag,
  Heart,
  CalendarDays,
  ListChecks,
  AlertTriangle,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: CalendarDays, title: 'Ugentlig madplan', desc: 'Planlæg ugens måltider for begge hjem. Alle ved hvad der er på menuen — og børnene får sund og varieret mad uanset hjem.', color: '#1a1a1a' },
  { icon: ShoppingCart, title: 'Smart indkøbsliste', desc: 'Automatisk indkøbsliste baseret på madplanen. Tilføj ekstra varer med ét tryk, og se hvad der allerede er handlet.', color: '#1a1a1a' },
  { icon: Tag, title: 'Tilbud fra butikker', desc: 'Se ugens bedste tilbud fra danske supermarkeder integreret i din indkøbsliste. Spar penge uden ekstra arbejde.', color: '#1a1a1a' },
  { icon: Heart, title: 'Favorit-opskrifter', desc: 'Gem familiens yndlingsopskrifter og genbrug dem i madplanen. Børnene kan se hvad der er til middag begge steder.', color: '#1a1a1a' },
  { icon: ListChecks, title: 'Delt indkøbsliste', desc: 'Begge forældre kan tilføje og afkrydse varer i realtid. Synkroniseret så der aldrig er dobbelt-indkøb.', color: '#1a1a1a' },
  { icon: AlertTriangle, title: 'Allergi-markering', desc: 'Markér allergier og diætkrav per barn. Opskrifter og madplaner filtreres automatisk så alle måltider er trygge.', color: '#1a1a1a' },
];

const details = [
  {
    badge: 'Madplan',
    title: 'Madplan for begge hjem',
    desc: 'Planlæg ugens måltider så børnene får sund og varieret mad — uanset hvilket hjem de er i. Del opskrifter og koordinér nemt mellem husstandene.',
    paragraphs: [
      'Mange skilte forældre oplever at børnene spiser det samme to dage i træk fordi forældrene ikke koordinerer madplanen. Med Huska kan begge forældre se hinandens madplan og undgå gentagelser.',
      'Opret en madplan for din uge, og din medforælder kan se hvad børnene allerede har spist. Gem yndlingsretter og genbrug dem med ét klik.',
    ],
    bullets: [
      'Separat madplan for hvert hjem',
      'Se hvad børnene har spist det andet sted',
      'Gem og genbrug yndlingsopskrifter',
      'Tilpasset allergier og præferencer automatisk',
    ],
    color: '#1a1a1a',
    icon: UtensilsCrossed,
    visual: (
      <div className="space-y-2 max-w-[280px]">
        <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
          <p className="text-[11px] font-bold text-[#78766d] uppercase tracking-wider mb-3">Denne uges madplan</p>
          {[
            { day: 'Mandag', meal: 'Kylling med ris og salat', emoji: '🍗' },
            { day: 'Tirsdag', meal: 'Pasta bolognese med broccoli', emoji: '🍝' },
            { day: 'Onsdag', meal: 'Fiskefrikadeller og kartofler', emoji: '🐟' },
            { day: 'Torsdag', meal: 'Grøntsagssuppe med brød', emoji: '🥣' },
            { day: 'Fredag', meal: 'Hjemmelavet pizza', emoji: '🍕' },
          ].map((d, i) => (
            <div key={i} className={`flex items-center gap-3 py-2.5 ${i < 4 ? 'border-b border-[#e5e3dc]/50' : ''}`}>
              <span className="text-lg">{d.emoji}</span>
              <div>
                <p className="text-[11px] font-bold text-[#78766d]">{d.day}</p>
                <p className="text-[13px] text-[#1a1a1a]">{d.meal}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    badge: 'Indkøb',
    title: 'Indkøb og tilbud samlet ét sted',
    desc: 'Indkøbslisten genereres automatisk fra madplanen. Se tilbud fra lokale butikker direkte i listen og spar penge på familiens indkøb.',
    paragraphs: [
      'Når du tilføjer en ret til madplanen, tilføjes ingredienserne automatisk til indkøbslisten. Du kan justere mængder, tilføje ekstra varer og organisere efter butik.',
      'Begge forældre har adgang til listen i realtid. Når den ene afkrydser en vare i butikken, opdateres listen øjeblikkeligt for den anden. Aldrig dobbelt-indkøb igen.',
    ],
    bullets: [
      'Automatisk genereret fra madplan',
      'Realtids-synkronisering mellem forældre',
      'Tilbudsintegration med danske butikker',
      'Organiser efter butik eller kategori',
    ],
    color: '#1a1a1a',
    icon: ShoppingCart,
    reversed: true,
  },
];

const comparison = {
  title: 'Mad & indkøb med Huska vs. uden',
  subtitle: 'Se forskellen på at koordinere mad og indkøb med og uden Huska.',
  rows: [
    { label: 'Madplanlægning', without: 'Ingen koordinering mellem hjem', with: 'Synlig madplan for begge hjem' },
    { label: 'Indkøb', without: 'Separate lister, dobbelt-indkøb', with: 'Delt realtids-liste' },
    { label: 'Allergier', without: 'Mundtlig information', with: 'Digital markering per barn' },
    { label: 'Tilbud', without: 'Bladre tilbudsaviser manuelt', with: 'Integreret i indkøbslisten' },
    { label: 'Opskrifter', without: 'SMS eller screenshot', with: 'Gemt og delt i appen' },
  ],
};

const faq = {
  title: 'Ofte stillede spørgsmål om mad & hjem',
  items: [
    { q: 'Kan min medforælder se min madplan?', a: 'Ja. Begge forældre kan se hinandens madplan, så I undgår at børnene spiser det samme to dage i træk.' },
    { q: 'Hvordan fungerer tilbudsintegrationen?', a: 'Huska henter automatisk ugens tilbud fra de største danske supermarkeder og matcher dem med din indkøbsliste. Du ser relevante tilbud direkte i listen.' },
    { q: 'Kan jeg gemme mine egne opskrifter?', a: 'Ja. Gem yndlingsopskrifter med ingredienser og instruktioner. Genbrug dem i madplanen med ét klik, og ingredienserne tilføjes automatisk til indkøbslisten.' },
    { q: 'Understøtter appen allergier?', a: 'Ja. Markér allergier og diætkrav per barn. Opskrifter og madplaner kan filtreres automatisk så alle måltider er trygge.' },
  ],
};

export default function MadHjemPage() {
  return (
    <FeaturePageLayout
      badge="Mad & hjem"
      badgeIcon={UtensilsCrossed}
      title="Madplan og indkøb"
      titleHighlight="— nemt og koordineret"
      subtitle="Planlæg ugens måltider for begge hjem, lav fælles indkøbslister og se tilbud. Spar tid, penge og undgå dobbelt-indkøb."
      subtitleExtra="Børnene får sund og varieret mad uanset hvilket hjem de er i."
      color="#1a1a1a"
      features={features}
      featuresTitle="Alt til mad og indkøb"
      featuresSubtitle="Fra madplanlægning til indkøbslister og tilbud — koordineret mellem begge hjem."
      details={details}
      comparison={comparison}
      faq={faq}
      ctaTitle="Planlæg ugens mad i dag"
      ctaSubtitle="Opret din første madplan på under et minut. Helt gratis for alle familier."
      ctaButtonLabel="Kom i gang — gratis"
      ctaButtonHref="#funktioner"
    />
  );
}
