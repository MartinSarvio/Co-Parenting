import {
  CheckSquare,
  UserCheck,
  Clock,
  RefreshCw,
  Bell,
  ListChecks,
  FolderOpen,
} from 'lucide-react';
import FeaturePageLayout from '../components/FeaturePageLayout';

const features = [
  { icon: UserCheck, title: 'Tildel opgaver', desc: 'Fordel opgaver mellem forældre og familiemedlemmer. Alle ved hvem der er ansvarlig, og der er aldrig tvivl om hvem der gør hvad.', color: '#1a1a1a' },
  { icon: Clock, title: 'Deadlines', desc: 'Sæt deadlines og få automatiske påmindelser inden tiden udløber. Aldrig glem en opgave — appen holder styr på det for dig.', color: '#1a1a1a' },
  { icon: RefreshCw, title: 'Gentagende opgaver', desc: 'Opret opgaver der gentages ugentligt, hver 14. dag eller månedligt. Madpakker, lektier, rengøring — alt kører automatisk.', color: '#1a1a1a' },
  { icon: ListChecks, title: 'Status-tracking', desc: 'Se hvad der er gjort, hvad der mangler, og hvem der er bagud. Fuldt overblik over familiens opgaver i realtid.', color: '#1a1a1a' },
  { icon: Bell, title: 'Påmindelser', desc: 'Automatiske push-notifikationer når en opgave nærmer sig sin deadline. Vælg selv hvornår du vil have besked.', color: '#1a1a1a' },
  { icon: FolderOpen, title: 'Kategorier', desc: 'Organisér opgaver i kategorier: skole, hjem, sundhed, fritid og mere. Filter og søg for hurtigt overblik.', color: '#1a1a1a' },
];

const details = [
  {
    badge: 'Fordeling',
    title: 'Fordel hverdagens opgaver retfærdigt',
    desc: 'Se hvem der gør hvad og hvornår. Tildel opgaver, sæt deadlines og følg op — så ingen føler sig uretfærdigt belastet.',
    paragraphs: [
      'Mange konflikter mellem skilte forældre handler om hvem der gør hvad. Med Huska er fordelingen gennemsigtig: begge forældre kan se alle opgaver, hvem der er ansvarlig, og hvad status er.',
      'Tildel opgaver til en specifik forælder baseret på samværsplanen. Appen foreslår automatisk hvem der bør tage en opgave baseret på hvem der har børnene den pågældende dag.',
    ],
    bullets: [
      'Tildel til specifik forælder eller lad appen foreslå',
      'Sæt prioritet: lav, medium eller høj',
      'Marker som fuldført med ét tryk',
      'Se historik over fuldførte opgaver',
    ],
    color: '#1a1a1a',
    icon: CheckSquare,
    visual: (
      <div className="space-y-3 max-w-[280px]">
        {[
          { task: 'Madpakker mandag', done: true, who: 'Dig', prio: 'Høj' },
          { task: 'Hente fra fodbold kl. 17', done: false, who: 'Medforælder', prio: 'Medium' },
          { task: 'Lektiehjælp onsdag', done: false, who: 'Dig', prio: 'Lav' },
          { task: 'Tandlæge fredag kl. 10', done: true, who: 'Medforælder', prio: 'Høj' },
          { task: 'Vaske fodbolddtøj', done: false, who: 'Dig', prio: 'Lav' },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-[#fafaf9] border border-[#e5e3dc]">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${t.done ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'border-[#d4d3cd]'}`}>
              {t.done && <CheckSquare size={12} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-medium ${t.done ? 'line-through text-[#9a978f]' : 'text-[#1a1a1a]'}`}>{t.task}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-[#78766d]">{t.who}</p>
                <span className="text-[10px] text-[#78766d]">·</span>
                <p className="text-[10px] text-[#78766d]">{t.prio}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    badge: 'Automatisering',
    title: 'Gentagende opgaver kører af sig selv',
    desc: 'Opret opgaver der gentages ugentligt, hver 14. dag eller månedligt. Perfekt til madpakker, rengøring, lektiehjælp og faste aftaler.',
    paragraphs: [
      'Når du opretter en gentagende opgave, genererer Huska automatisk nye instanser baseret på din valgte frekvens. Opgaven tildeles automatisk den forælder der har børnene den pågældende dag.',
      'Se historik over alle fuldførte gentagende opgaver. Over tid kan du se mønstre i hvem der gør hvad — og justere fordelingen hvis det er nødvendigt.',
    ],
    bullets: [
      'Ugentlig, 14-dages eller månedlig gentagelse',
      'Automatisk tildeling efter samværsplan',
      'Historik over fuldførte gentagende opgaver',
      'Pause eller stop gentagelse når som helst',
    ],
    color: '#1a1a1a',
    icon: RefreshCw,
    reversed: true,
  },
];

const comparison = {
  title: 'Opgaver med Huska vs. uden',
  subtitle: 'Se forskellen på at koordinere familiens opgaver med og uden et dedikeret værktøj.',
  rows: [
    { label: 'Opgavefordeling', without: 'Mundtlige aftaler, glemmes', with: 'Skriftlige, tildelte opgaver' },
    { label: 'Påmindelser', without: 'Ingen — ren hukommelse', with: 'Automatiske push-notifikationer' },
    { label: 'Gentagende opgaver', without: 'Skal huskes hver gang', with: 'Kører automatisk' },
    { label: 'Status', without: 'Ingen indsigt', with: 'Realtids status-tracking' },
    { label: 'Retfærdighed', without: 'Følelsen af skæv fordeling', with: 'Dokumenteret fordeling' },
  ],
};

const faq = {
  title: 'Ofte stillede spørgsmål om opgaver',
  items: [
    { q: 'Kan begge forældre oprette opgaver?', a: 'Ja. Begge forældre kan oprette, tildele og fuldføre opgaver. Alle ændringer er synlige for begge parter i realtid.' },
    { q: 'Kan jeg tildele opgaver til andre end medforælder?', a: 'I den nuværende version kan opgaver tildeles til de to forældre. Muligheden for at involvere andre familiemedlemmer er på vej.' },
    { q: 'Hvad sker der med forældede opgaver?', a: 'Opgaver der ikke er fuldført inden deadline markeres automatisk som forsinket. De forbliver synlige indtil de fuldføres eller slettes.' },
    { q: 'Kan jeg se historik over fuldførte opgaver?', a: 'Ja. Huska gemmer en komplet historik over alle opgaver — oprettede, fuldførte og forældede. Perfekt til at se mønstre i fordelingen.' },
  ],
};

export default function OpgaverPage() {
  return (
    <FeaturePageLayout
      badge="Opgaver"
      badgeIcon={CheckSquare}
      title="Fordel"
      titleHighlight="hverdagens opgaver"
      subtitle="Fordel og følg op på familiens opgaver. Se hvem der gør hvad og hvornår — gennemsigtigt, retfærdigt og uden diskussion."
      subtitleExtra="Automatisk tildeling baseret på samværsplan. Gentagende opgaver kører af sig selv."
      color="#1a1a1a"
      features={features}
      featuresTitle="Opgavestyring bygget til familier"
      featuresSubtitle="Ikke endnu et projektværktøj — men et værktøj designet specifikt til skilte forældres hverdag."
      details={details}
      comparison={comparison}
      faq={faq}
      ctaTitle="Få styr på opgaverne"
      ctaSubtitle="Opret din første opgaveliste på få sekunder. Helt gratis for alle familier."
      ctaButtonLabel="Kom i gang — gratis"
      ctaButtonHref="#funktioner"
    />
  );
}
