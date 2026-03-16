import {
  CalendarHeart,
  CalendarDays,
  Bell,
  RefreshCw,
  Gift,
  Stethoscope,
  GraduationCap,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: CalendarDays, title: 'Fælles begivenheder', desc: 'Tilføj begivenheder begge forældre kan se. Forældremøder, fødselsdage, aktiviteter og alt andet der vedrører børnene.', color: '#1a1a1a' },
  { icon: Gift, title: 'Vigtige datoer', desc: 'Glem aldrig fødselsdage, milepæle og jubilæer. Automatiske påmindelser sørger for at du altid er forberedt.', color: '#1a1a1a' },
  { icon: Bell, title: 'Smarte påmindelser', desc: 'Sæt påmindelser for begivenheder. Vælg hvornår du vil have besked — en dag, en uge eller en time før.', color: '#1a1a1a' },
  { icon: RefreshCw, title: 'Synk med telefon', desc: 'Synkronisér med din iPhones kalender. Se Huska-begivenheder sammen med dine andre aftaler i én visning.', color: '#1a1a1a' },
  { icon: Stethoscope, title: 'Sundhedsaftaler', desc: 'Hold styr på børnenes lægebesøg, tandlæge, vaccinationer og kontroller. Begge forældre har adgang til alle informationer.', color: '#1a1a1a' },
  { icon: GraduationCap, title: 'Skole & institution', desc: 'Importér skolens ferieplan, forældremøder og arrangementer. Aldrig tvivl om skolefridage og vigtige datoer.', color: '#1a1a1a' },
];

const details = [
  {
    badge: 'Fælles kalender',
    title: 'Én kalender for hele familien',
    desc: 'Se alles begivenheder samlet ét sted. Forældre, børn, bedsteforældre — alle har adgang til det de skal vide, og ingen går glip af vigtige begivenheder.',
    paragraphs: [
      'Mange skilte forældre oplever at vigtige begivenheder glemmes fordi informationen kun er hos den ene forælder. Med Huska er alt synligt for begge.',
      'Begivenheder farvekodes automatisk: samvær, skole, sundhed, fritid og mærkedage. Brug dag-, uge- eller månedsvisning alt efter behov. Klik på en dag for at se alle detaljer.',
      'Kalenderen er integreret med samværsplanen, så du altid kan se hvem der har børnene samtidig med begivenheder og aftaler.',
    ],
    bullets: [
      'Farvekodede begivenheder pr. kategori',
      'Dag-, uge- og månedsvisning',
      'Integreret med samværsplanen',
      'Synk med Apple/Google kalender',
    ],
    color: '#1a1a1a',
    icon: CalendarHeart,
    visual: (
      <div className="max-w-[280px]">
        <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#e5e3dc]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-bold text-[#1a1a1a]">Marts 2026</p>
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded bg-[#1a1a1a]/5 flex items-center justify-center text-[10px] text-[#78766d]">←</div>
              <div className="w-6 h-6 rounded bg-[#1a1a1a]/5 flex items-center justify-center text-[10px] text-[#78766d]">→</div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
            {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map(d => (
              <div key={d} className="text-[#78766d] font-semibold py-1">{d}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => {
              const hasEvent = [5, 12, 18, 23, 28].includes(i + 1);
              const isToday = i + 1 === 16;
              return (
                <div
                  key={i}
                  className={`py-1.5 rounded-lg text-[12px] ${isToday ? 'bg-[#1a1a1a] text-white font-bold' : hasEvent ? 'bg-[#1a1a1a]/8 text-[#1a1a1a] font-semibold' : 'text-[#4a4a4a]'}`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-2">
            {[
              { date: '5. mar', event: 'Forældremøde kl. 18', cat: 'Skole' },
              { date: '12. mar', event: 'Svømning starter igen', cat: 'Fritid' },
              { date: '18. mar', event: 'Emmas fødselsdag!', cat: 'Mærkedag' },
              { date: '23. mar', event: 'Tandlæge kl. 10', cat: 'Sundhed' },
              { date: '28. mar', event: 'Efterårsferie starter', cat: 'Ferie' },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] shrink-0" />
                <span className="text-[#78766d] w-12 shrink-0">{e.date}</span>
                <span className="text-[#1a1a1a] font-medium">{e.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    badge: 'Sundhed',
    title: 'Aldrig glem et lægebesøg',
    desc: 'Hold styr på børnenes sundhedsaftaler. Tandlæge, vaccination, kontroller og specialistbesøg — alt samlet med noter og påmindelser for begge forældre.',
    paragraphs: [
      'Det er frustrerende når den ene forælder ikke ved at barnet har tandlæge i morgen. Med Huska er alle sundhedsaftaler synlige for begge forældre med automatiske påmindelser.',
      'Tilføj noter til sundhedsaftaler: hvad sagde lægen? Hvad er næste skridt? Begge forældre har adgang til samme information, uanset hvem der var med til besøget.',
    ],
    bullets: [
      'Alle sundhedsaftaler synlige for begge forældre',
      'Noter og opfølgning per aftale',
      'Automatiske påmindelser',
      'Historik over alle besøg og resultater',
    ],
    color: '#1a1a1a',
    icon: Stethoscope,
    reversed: true,
  },
  {
    badge: 'Skole',
    title: 'Skole og institution — aldrig ud af løkken',
    desc: 'Importér skolens ferieplan, hold styr på forældremøder og arrangementer. Begge forældre er altid informeret om hvad der sker i børnenes institution.',
    paragraphs: [
      'Mange skilte forældre oplever at den ene forælder er bedre informeret end den anden om hvad der sker på skolen. Med Huska deles al information automatisk.',
      'Registrer forældremøder, skole-arrangementer, pædagogiske dage og ferier. Alt er synligt for begge forældre med påmindelser.',
    ],
    bullets: [
      'Import af skolens ferieplan',
      'Forældremøder og arrangementer',
      'Pædagogiske dage og lukkedage',
      'Påmindelser for begge forældre',
    ],
    color: '#1a1a1a',
    icon: GraduationCap,
  },
];

const comparison = {
  title: 'Familiekalender med Huska vs. uden',
  subtitle: 'Se forskellen på at koordinere familiens kalender med og uden Huska.',
  rows: [
    { label: 'Begivenheder', without: 'Kun i den ene forælders kalender', with: 'Synligt for begge forældre' },
    { label: 'Påmindelser', without: 'Kun for den der oprettede', with: 'Begge forældre får besked' },
    { label: 'Sundhedsaftaler', without: 'Spredt information', with: 'Samlet med noter og historik' },
    { label: 'Skole', without: 'Info via Aula, glemmes', with: 'Integreret i familiekalenderen' },
    { label: 'Fødselsdage', without: 'Huskes af den ene', with: 'Automatiske påmindelser for begge' },
  ],
};

const faq = {
  title: 'Ofte stillede spørgsmål om kalenderen',
  items: [
    { q: 'Kan jeg synkronisere med Apple/Google kalender?', a: 'Ja. Du kan synkronisere Huskas kalender med din telefons kalender, så du ser alle begivenheder samlet i én visning.' },
    { q: 'Kan begge forældre tilføje begivenheder?', a: 'Ja. Begge forældre kan oprette begivenheder. Den anden forælder får automatisk besked og kan se begivenheden i sin kalender.' },
    { q: 'Hvad er forskellen på kalenderen og samværsplanen?', a: 'Samværsplanen viser hvem der har børnene. Kalenderen viser begivenheder, aftaler og aktiviteter. De to er integreret, så du altid kan se begge dele samtidig.' },
    { q: 'Kan bedsteforældre se kalenderen?', a: 'Du kan dele specifikke begivenheder eller hele kalenderen med udvalgte personer via sikkert delingslink med begrænset adgang.' },
  ],
};

export default function KalenderPage() {
  return (
    <FeaturePageLayout
      badge="Kalender"
      badgeIcon={CalendarHeart}
      title="Fælles"
      titleHighlight="familiekalender"
      subtitle="Fælles familiekalender med begivenheder, sundhedsaftaler, skole og vigtige datoer. Begge forældre er altid informeret — aldrig ude af løkken."
      subtitleExtra="Integreret med samværsplanen. Synkroniserer med Apple og Google kalender."
      color="#1a1a1a"
      features={features}
      featuresTitle="Alt samlet i én kalender"
      featuresSubtitle="Begivenheder, sundhed, skole, fødselsdage og ferier — synligt for begge forældre."
      details={details}
      comparison={comparison}
      faq={faq}
      ctaTitle="Opret jeres familiekalender"
      ctaSubtitle="Hold hele familien synkroniseret med en fælles kalender. Helt gratis."
      ctaButtonLabel="Kom i gang — gratis"
      ctaButtonHref="#funktioner"
    />
  );
}
